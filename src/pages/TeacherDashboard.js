import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import SessionMaterials from '../components/SessionMaterials';

const TeacherDashboard = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);

    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [roster, setRoster] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchMySessions = async () => {
            try {
                const response = await api.get(`/sessions?teacher=${user.id || user._id}`);
                setSessions(response.data);
                setLoading(false);
            } catch (err) { setError('Failed to load your schedule.'); setLoading(false); }
        };
        fetchMySessions();
    }, [user]);

    const handleSelectSession = async (session) => {
        setSelectedSession(session); setError(''); setSuccessMsg('');
        try {
            const response = await api.get(`/enrollments/session/${session._id}`);
            setRoster(response.data);
            const initialAttendance = {};
            response.data.forEach(enrollment => { initialAttendance[enrollment.student._id] = 'Present'; });
            setAttendanceRecords(initialAttendance);
        } catch (err) { setError('Failed to load class roster.'); }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const submitAttendance = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        const formattedRecords = Object.keys(attendanceRecords).map(studentId => ({
            student: studentId, status: attendanceRecords[studentId], remarks: ''
        }));
        try {
            await api.post('/attendance', { session: selectedSession._id, date: attendanceDate, teacher: user.id || user._id, records: formattedRecords });
            setSuccessMsg('Attendance successfully recorded!');
        } catch (err) { setError(err.response?.data?.error || 'Failed to submit attendance.'); }
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('teacherDash.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('teacherDash.title')}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', marginTop: '8px' }}>

                {/* LEFT: My Classes */}
                <div>
                    <div className="card-header" style={{ marginBottom: '16px' }}>📚 {t('teacherDash.myClasses')}</div>
                    {sessions.length === 0 ? (
                        <div className="empty-state"><div className="icon">📚</div><p>{t('teacherDash.noClasses')}</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sessions.map(session => (
                                <div
                                    key={session._id}
                                    onClick={() => handleSelectSession(session)}
                                    className="item-card"
                                    style={{
                                        cursor: 'pointer',
                                        borderColor: selectedSession?._id === session._id ? 'var(--primary)' : 'var(--border)',
                                        background: selectedSession?._id === session._id ? 'var(--primary-glow)' : 'var(--bg-card)',
                                    }}
                                >
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--primary)' }}>{session.course?.title}</h3>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {session.currentStudents} / {session.maxStudents} {t('teacherDash.studentsEnrolled')}
                                    </p>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {session.schedule.map((s, i) => (
                                            <div key={i}>📅 {s.day}s at {s.startTime}</div>
                                        ))}
                                    </div>
                                    {session.meetingLink ? (
                                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm" style={{ marginTop: '10px', textDecoration: 'none', display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}>
                                            🔗 {t('teacherDash.joinMeeting')}
                                        </a>
                                    ) : (
                                        <div className="alert alert-warning" style={{ marginTop: '10px', marginBottom: 0, padding: '6px 10px', fontSize: '0.8rem' }}>
                                            {t('teacherDash.noMeetingLink')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Roster & Attendance */}
                <div>
                    {selectedSession ? (<>
                        <div className="card">
                            <div className="card-header">📋 {selectedSession.course?.title} - {t('teacherDash.roster')}</div>

                            {error && <div className="alert alert-danger">{error}</div>}
                            {successMsg && <div className="alert alert-success">{successMsg}</div>}

                            {roster.length === 0 ? (
                                <div className="empty-state"><p>{t('teacherDash.noStudents')}</p></div>
                            ) : (
                                <form onSubmit={submitAttendance}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                                        <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('teacherDash.takingAttendance')}</label>
                                        <input type="date" className="form-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} required style={{ width: 'auto' }} />
                                    </div>

                                    <table className="data-table" style={{ marginBottom: '20px' }}>
                                        <thead>
                                            <tr>
                                                <th>{t('teacherDash.studentName')}</th>
                                                <th>{t('teacherDash.email')}</th>
                                                <th style={{ textAlign: 'center' }}>✅ {t('teacherDash.present')}</th>
                                                <th style={{ textAlign: 'center' }}>❌ {t('teacherDash.absent')}</th>
                                                <th style={{ textAlign: 'center' }}>⏰ {t('teacherDash.late')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roster.map(({ student }) => (
                                                <tr key={student._id}>
                                                    <td><strong>{student.firstName} {student.lastName}</strong></td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{student.email}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input type="radio" name={`status-${student._id}`} checked={attendanceRecords[student._id] === 'Present'} onChange={() => handleStatusChange(student._id, 'Present')} />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input type="radio" name={`status-${student._id}`} checked={attendanceRecords[student._id] === 'Absent'} onChange={() => handleStatusChange(student._id, 'Absent')} />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input type="radio" name={`status-${student._id}`} checked={attendanceRecords[student._id] === 'Late'} onChange={() => handleStatusChange(student._id, 'Late')} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <button type="submit" className="btn btn-success btn-block">{t('teacherDash.saveAttendance')}</button>
                                </form>
                            )}
                        </div>

                        <div className="card" style={{ marginTop: '24px' }}>
                             <div className="card-header">📁 {t('materials.cardTitle') || 'Course Materials & Syllabi'}</div>
                             <div style={{ padding: '20px' }}>
                                 <SessionMaterials sessionId={selectedSession._id} />
                             </div>
                        </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}>
                            <h3>👈 {t('teacherDash.selectClass')}</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;