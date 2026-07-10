import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManageAttendance = () => {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecord, setAttendanceRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await api.get('/sessions');
                setSessions(response.data);
                if (response.data.length > 0) setSelectedSessionId(response.data[0]._id);
                setLoading(false);
            } catch (err) { setError('Failed to load class sessions.'); setLoading(false); }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        if (!selectedSessionId || !attendanceDate) return;
        const fetchAttendance = async () => {
            setSearching(true); setError('');
            try {
                const response = await api.get(`/attendance/session/${selectedSessionId}?date=${attendanceDate}`);
                if (response.data && response.data.length > 0) {
                    setAttendanceRecord(response.data[0]);
                } else { setAttendanceRecord(null); }
                setSearching(false);
            } catch (err) { setError('Failed to retrieve attendance roster.'); setSearching(false); }
        };
        fetchAttendance();
    }, [selectedSessionId, attendanceDate]);

    const attendanceBadge = (status) => {
        const map = { 'Present': 'badge-success', 'Absent': 'badge-danger', 'Late': 'badge-warning', 'Excused': 'badge-info' };
        return map[status] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('manageAttendance.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="page-title">{t('manageAttendance.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* FILTER CARD */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>{t('manageAttendance.selectSession')}</label>
                        <select className="form-select" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
                            {sessions.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.course?.title} ({s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : 'No Teacher'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('manageAttendance.selectDate')}</label>
                        <input type="date" className="form-input" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} required />
                    </div>
                </div>
            </div>

            {searching ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>⏳ {t('manageAttendance.searching')}</div>
            ) : attendanceRecord ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', background: 'var(--bg-table-stripe)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{t('manageAttendance.sheetDetails')}</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                {t('manageAttendance.loggedBy')}: <strong style={{ color: 'var(--text-primary)' }}>{attendanceRecord.teacher?.firstName} {attendanceRecord.teacher?.lastName}</strong>
                            </p>
                        </div>
                        <span className="badge badge-success">{t('manageAttendance.recorded')}</span>
                    </div>

                    <table className="data-table" style={{ boxShadow: 'none', borderRadius: 0 }}>
                        <thead>
                            <tr>
                                <th>{t('manageAttendance.student')}</th>
                                <th>{t('manageAttendance.email')}</th>
                                <th>{t('manageAttendance.status')}</th>
                                <th>{t('manageAttendance.remarks')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceRecord.records.map((rec, index) => (
                                <tr key={index}>
                                    <td><strong>{rec.student?.firstName} {rec.student?.lastName}</strong></td>
                                    <td>{rec.student?.email}</td>
                                    <td>
                                        <span className={`badge ${attendanceBadge(rec.status)}`}>
                                            {t(`manageAttendance.status_${rec.status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{rec.remarks || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="icon">📅</div>
                    <h3 style={{ color: 'var(--text-secondary)' }}>{t('manageAttendance.noRecords')}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('manageAttendance.noRecordsHelp')}</p>
                </div>
            )}
        </div>
    );
};

export default ManageAttendance;
