import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const StudentAttendance = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const studentId = user.id || user._id;
                const response = await api.get(`/attendance/student/${studentId}`);
                setAttendance(response.data);
                setLoading(false);
            } catch (err) { setError('Failed to load attendance records.'); setLoading(false); }
        };
        fetchAttendance();
    }, [user]);

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('studentAttendance.loading')}</div>;

    const stats = attendance.reduce((acc, record) => {
        acc.total += 1;
        if (record.status === 'Present') acc.present += 1;
        else if (record.status === 'Absent') acc.absent += 1;
        else if (record.status === 'Late') acc.late += 1;
        else if (record.status === 'Excused') acc.excused += 1;
        return acc;
    }, { total: 0, present: 0, absent: 0, late: 0, excused: 0 });

    const attendanceRate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 100;

    const attendanceBadge = (status) => {
        const map = { 'Present': 'badge-success', 'Absent': 'badge-danger', 'Late': 'badge-warning', 'Excused': 'badge-info' };
        return map[status] || 'badge-primary';
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="page-title">{t('studentAttendance.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-card primary">
                    <h3>{t('studentAttendance.attendanceRate')}</h3>
                    <p className="metric" style={{ color: attendanceRate >= 80 ? 'var(--success)' : 'var(--danger)' }}>{attendanceRate}%</p>
                </div>
                <div className="stat-card success">
                    <h3>{t('studentAttendance.present')}</h3>
                    <p className="metric">{stats.present}</p>
                </div>
                <div className="stat-card warning">
                    <h3>{t('studentAttendance.late')}</h3>
                    <p className="metric">{stats.late}</p>
                </div>
                <div className="stat-card danger">
                    <h3>{t('studentAttendance.absent')}</h3>
                    <p className="metric">{stats.absent}</p>
                </div>
            </div>

            {/* Attendance History */}
            {attendance.length === 0 ? (
                <div className="empty-state"><div className="icon">📋</div><p>{t('studentAttendance.noRecords')}</p></div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('studentAttendance.class')}</th>
                                <th>{t('studentAttendance.date')}</th>
                                <th>{t('studentAttendance.teacher')}</th>
                                <th>{t('studentAttendance.status')}</th>
                                <th>{t('studentAttendance.remarks')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((record, index) => (
                                <tr key={index}>
                                    <td><strong>{record.session?.course?.title || 'Course'}</strong></td>
                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                    <td>{record.teacher ? `${record.teacher.firstName} ${record.teacher.lastName}` : 'Teacher'}</td>
                                    <td>
                                        <span className={`badge ${attendanceBadge(record.status)}`}>
                                            {t(`studentAttendance.status_${record.status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{record.remarks || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentAttendance;
