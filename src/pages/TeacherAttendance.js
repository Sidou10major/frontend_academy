import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TeacherAttendance = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [roster, setRoster] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await api.get(`/sessions?teacher=${user.id || user._id}`);
                setSessions(response.data);
                if (response.data.length > 0) setSelectedSessionId(response.data[0]._id);
                setLoading(false);
            } catch (err) { setError('Failed to load your classes.'); setLoading(false); }
        };
        fetchSessions();
    }, [user]);

    useEffect(() => {
        if (!selectedSessionId) return;
        const fetchRoster = async () => {
            setError(''); setSuccessMsg('');
            try {
                const response = await api.get(`/enrollments/session/${selectedSessionId}`);
                setRoster(response.data);
                const initialAttendance = {};
                response.data.forEach(enrollment => { initialAttendance[enrollment.student._id] = 'Present'; });
                setAttendanceRecords(initialAttendance);
            } catch (err) { setError('Failed to load class roster.'); }
        };
        fetchRoster();
    }, [selectedSessionId]);

    const handleStatusChange = (studentId, status) => {
        setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const submitAttendance = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        const formattedRecords = Object.keys(attendanceRecords).map(studentId => ({
            student: studentId, status: attendanceRecords[studentId], remarks: ''
        }));
        try {
            await api.post('/attendance', { session: selectedSessionId, date: attendanceDate, teacher: user.id || user._id, records: formattedRecords });
            setSuccessMsg(t('teacherAttendance.successMsg', { date: attendanceDate }));
        } catch (err) { setError(err.response?.data?.error || 'Failed to submit attendance.'); }
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('teacherAttendance.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 className="page-title">{t('teacherAttendance.title')}</h1>

            <div className="card">
                {error && <div className="alert alert-danger">{error}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                <div className="form-grid" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                    <div className="form-group">
                        <label>{t('teacherAttendance.selectClass')}</label>
                        <select className="form-select" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
                            {sessions.map(s => <option key={s._id} value={s._id}>{s.course?.title} ({s.schedule[0]?.day}s)</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('teacherAttendance.dateOfClass')}</label>
                        <input type="date" className="form-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} required />
                    </div>
                </div>

                {roster.length === 0 ? (
                    <div className="empty-state"><p>{t('teacherAttendance.noStudents')}</p></div>
                ) : (
                    <form onSubmit={submitAttendance}>
                        <table className="data-table" style={{ marginBottom: '24px' }}>
                            <thead>
                                <tr>
                                    <th>{t('teacherAttendance.studentHeader')}</th>
                                    <th style={{ textAlign: 'center' }}>✅ {t('teacherAttendance.presentHeader')}</th>
                                    <th style={{ textAlign: 'center' }}>❌ {t('teacherAttendance.absentHeader')}</th>
                                    <th style={{ textAlign: 'center' }}>⏰ {t('teacherAttendance.lateHeader')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roster.map(({ student }) => (
                                    <tr key={student._id}>
                                        <td><strong>{student.firstName} {student.lastName}</strong></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input type="radio" checked={attendanceRecords[student._id] === 'Present'} onChange={() => handleStatusChange(student._id, 'Present')} />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input type="radio" checked={attendanceRecords[student._id] === 'Absent'} onChange={() => handleStatusChange(student._id, 'Absent')} />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input type="radio" checked={attendanceRecords[student._id] === 'Late'} onChange={() => handleStatusChange(student._id, 'Late')} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="submit" className="btn btn-success btn-block">{t('teacherAttendance.submitBtn')}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default TeacherAttendance;