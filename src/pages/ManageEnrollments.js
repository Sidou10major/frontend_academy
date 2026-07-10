import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManageEnrollments = () => {
    const { t } = useTranslation();
    const [enrollments, setEnrollments] = useState([]);
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({ studentId: '', sessionId: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [enrollmentsRes, studentsRes, sessionsRes] = await Promise.all([
                api.get('/enrollments'), api.get('/users?role=student'), api.get('/sessions')
            ]);
            setEnrollments(enrollmentsRes.data); setStudents(studentsRes.data); setSessions(sessionsRes.data);
            if (studentsRes.data.length > 0 && sessionsRes.data.length > 0) {
                setFormData({ studentId: studentsRes.data[0]._id, sessionId: sessionsRes.data[0]._id });
            }
            setLoading(false);
        } catch (err) { setError('Failed to load enrollment data.'); setLoading(false); }
    };

    const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        try {
            await api.post('/enrollments', formData);
            setSuccessMsg(t('enrollments.successEnroll'));
            const [enrollmentsRes, sessionsRes] = await Promise.all([api.get('/enrollments'), api.get('/sessions')]);
            setEnrollments(enrollmentsRes.data); setSessions(sessionsRes.data);
        } catch (err) { setError(err.response?.data?.error || 'Error creating enrollment'); }
    };

    const handleDrop = async (enrollmentId) => {
        setError(''); setSuccessMsg('');
        try {
            await api.patch(`/enrollments/${enrollmentId}`, { status: 'Dropped' });
            setSuccessMsg(t('enrollments.successDrop'));
            const [enrollmentsRes, sessionsRes] = await Promise.all([api.get('/enrollments'), api.get('/sessions')]);
            setEnrollments(enrollmentsRes.data); setSessions(sessionsRes.data);
        } catch (err) { setError(err.response?.data?.error || 'Error dropping enrollment'); }
    };

    const handleDelete = async (enrollmentId) => {
        if (!window.confirm('Are you sure you want to permanently delete this enrollment record?')) return;
        setError(''); setSuccessMsg('');
        try {
            await api.delete(`/enrollments/${enrollmentId}`);
            setSuccessMsg(t('enrollments.successDelete'));
            const [enrollmentsRes, sessionsRes] = await Promise.all([api.get('/enrollments'), api.get('/sessions')]);
            setEnrollments(enrollmentsRes.data); setSessions(sessionsRes.data);
        } catch (err) { setError(err.response?.data?.error || 'Error deleting enrollment'); }
    };

    const statusBadge = (status) => {
        const map = { 'Active': 'badge-success', 'Dropped': 'badge-danger', 'Completed': 'badge-info' };
        return map[status] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('enrollments.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('enrollments.title')}</h1>

            {/* ENROLL FORM */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">📝 {t('enrollments.enrollStudent')}</div>

                {error && <div className="alert alert-danger">{error}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>{t('enrollments.selectStudent')}</label>
                        <select name="studentId" className="form-select" value={formData.studentId} onChange={handleInputChange} required>
                            {students.map(s => (<option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('enrollments.selectSession')}</label>
                        <select name="sessionId" className="form-select" value={formData.sessionId} onChange={handleInputChange} required>
                            {sessions.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.course?.title} — {s.teacher?.firstName} {s.teacher?.lastName} ({s.currentStudents}/{s.maxStudents})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="full-width">
                        <button type="submit" className="btn btn-success btn-block">{t('enrollments.enrollBtn')}</button>
                    </div>
                </form>
            </div>

            {/* ENROLLMENT LIST */}
            <div className="card-header" style={{ marginBottom: '16px' }}>
                📋 {t('enrollments.currentEnrollments')} ({enrollments.length})
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
                {enrollments.map((enrollment) => {
                    const session = enrollment.session;
                    const student = enrollment.student;
                    if (!session || !student) return null;

                    return (
                        <div key={enrollment._id} className="item-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 4px 0' }}>{student.firstName} {student.lastName}</h3>
                                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{student.email}</p>
                                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                        {t('enrollments.course')}: <strong style={{ color: 'var(--text-primary)' }}>{session.course?.title}</strong>
                                        {' — '}{t('enrollments.instructor')}: {session.teacher?.firstName} {session.teacher?.lastName}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <span className={`badge ${statusBadge(enrollment.status)}`}>{enrollment.status}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                    </span>
                                    <div className="btn-group" style={{ marginTop: '4px' }}>
                                        {enrollment.status === 'Active' && (
                                            <button onClick={() => handleDrop(enrollment._id)} className="btn btn-danger btn-sm">{t('enrollments.dropBtn')}</button>
                                        )}
                                        <button onClick={() => handleDelete(enrollment._id)} className="btn btn-secondary btn-sm">{t('enrollments.deleteBtn')}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ManageEnrollments;
