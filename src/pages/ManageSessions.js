import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManageSessions = () => {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [editingSessionId, setEditingSessionId] = useState(null);

    const defaultScheduleBlock = { day: 'Monday', startTime: '18:00', endTime: '19:30' };
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const [formData, setFormData] = useState({
        course: '', teacher: '', startDate: '', endDate: '', maxStudents: 15, meetingLink: '', schedule: [{ ...defaultScheduleBlock }]
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [sessionsRes, coursesRes, teachersRes] = await Promise.all([
                api.get('/sessions'), api.get('/courses'), api.get('/users?role=teacher')
            ]);
            setSessions(sessionsRes.data);
            setCourses(coursesRes.data);
            setTeachers(teachersRes.data);
            if (coursesRes.data.length > 0 && teachersRes.data.length > 0) {
                setFormData(prev => ({ ...prev, course: coursesRes.data[0]._id, teacher: teachersRes.data[0]._id }));
            }
            setLoading(false);
        } catch (err) {
            setError('Failed to load dashboard data.');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleScheduleChange = (index, field, value) => {
        const updatedSchedule = [...formData.schedule];
        updatedSchedule[index][field] = value;
        setFormData({ ...formData, schedule: updatedSchedule });
    };
    const addScheduleBlock = () => { setFormData({ ...formData, schedule: [...formData.schedule, { ...defaultScheduleBlock }] }); };
    const removeScheduleBlock = (index) => { setFormData({ ...formData, schedule: formData.schedule.filter((_, i) => i !== index) }); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        try {
            if (editingSessionId) {
                const response = await api.put(`/sessions/${editingSessionId}`, formData);
                setSuccessMsg(t('manageSessions.successUpdate'));
                setSessions(sessions.map(s => s._id === editingSessionId ? response.data : s));
                setEditingSessionId(null);
            } else {
                await api.post('/sessions', formData);
                setSuccessMsg(t('manageSessions.successCreate'));
                const updatedSessions = await api.get('/sessions');
                setSessions(updatedSessions.data);
            }
            setFormData({ course: courses.length > 0 ? courses[0]._id : '', teacher: teachers.length > 0 ? teachers[0]._id : '', startDate: '', endDate: '', maxStudents: 15, meetingLink: '', schedule: [{ ...defaultScheduleBlock }] });
        } catch (err) { setError(err.response?.data?.error || 'Error saving session'); }
    };

    const handleEdit = (session) => {
        setEditingSessionId(session._id);
        setFormData({
            course: session.course?._id || '', teacher: session.teacher?._id || '',
            startDate: session.startDate ? new Date(session.startDate).toISOString().split('T')[0] : '',
            endDate: session.endDate ? new Date(session.endDate).toISOString().split('T')[0] : '',
            maxStudents: session.maxStudents, meetingLink: session.meetingLink || '',
            schedule: session.schedule && session.schedule.length > 0 ? session.schedule.map(s => ({ day: s.day, startTime: s.startTime, endTime: s.endTime })) : [{ ...defaultScheduleBlock }]
        });
        setError(''); setSuccessMsg('');
    };

    const handleCancelEdit = () => {
        setEditingSessionId(null);
        setFormData({ course: courses.length > 0 ? courses[0]._id : '', teacher: teachers.length > 0 ? teachers[0]._id : '', startDate: '', endDate: '', maxStudents: 15, meetingLink: '', schedule: [{ ...defaultScheduleBlock }] });
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('manageSessions.confirmDelete'))) return;
        setError(''); setSuccessMsg('');
        try {
            await api.delete(`/sessions/${id}`);
            setSuccessMsg(t('manageSessions.successDelete'));
            setSessions(sessions.filter(s => s._id !== id));
            if (editingSessionId === id) handleCancelEdit();
        } catch (err) { setError(err.response?.data?.error || 'Error deleting session'); }
    };

    const statusBadge = (status) => {
        const map = { 'Upcoming': 'badge-info', 'Active': 'badge-success', 'Completed': 'badge-primary', 'Cancelled': 'badge-danger' };
        return map[status] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('manageSessions.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('manageSessions.title')}</h1>

            {/* FORM CARD */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">
                    {editingSessionId ? `✏️ ${t('manageSessions.editTitle')}` : `📅 ${t('manageSessions.createTitle')}`}
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>{t('manageSessions.courseLabel')}</label>
                        <select name="course" className="form-select" value={formData.course} onChange={handleInputChange} required>
                            {courses.map(c => (<option key={c._id} value={c._id}>{c.title} ({c.language} - {c.level})</option>))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('manageSessions.teacherLabel')}</label>
                        <select name="teacher" className="form-select" value={formData.teacher} onChange={handleInputChange} required>
                            {teachers.map(tc => (<option key={tc._id} value={tc._id}>{tc.firstName} {tc.lastName} ({tc.languages.join(', ')})</option>))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('manageSessions.startDateLabel')}</label>
                        <input type="date" name="startDate" className="form-input" value={formData.startDate} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label>{t('manageSessions.endDateLabel')}</label>
                        <input type="date" name="endDate" className="form-input" value={formData.endDate} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label>{t('manageSessions.maxStudentsLabel')}</label>
                        <input type="number" name="maxStudents" className="form-input" value={formData.maxStudents} onChange={handleInputChange} min="1" required />
                    </div>

                    <div className="form-group">
                        <label>{t('manageSessions.meetingLinkLabel')}</label>
                        <input type="url" name="meetingLink" className="form-input" value={formData.meetingLink} onChange={handleInputChange} placeholder="https://zoom.us/j/..." />
                    </div>

                    {/* DYNAMIC WEEKLY SCHEDULE */}
                    <div className="form-group full-width" style={{ background: 'var(--bg-table-stripe)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label style={{ margin: 0 }}>{t('manageSessions.weeklyScheduleLabel')}</label>
                            <button type="button" onClick={addScheduleBlock} className="btn btn-warning btn-sm">
                                + {t('manageSessions.addDayBtn')}
                            </button>
                        </div>

                        {formData.schedule.map((block, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                <select value={block.day} className="form-select" onChange={(e) => handleScheduleChange(index, 'day', e.target.value)} style={{ flex: 1 }}>
                                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input type="time" className="form-input" value={block.startTime} onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)} required style={{ flex: 1 }} />
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>→</span>
                                <input type="time" className="form-input" value={block.endTime} onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)} required style={{ flex: 1 }} />
                                {formData.schedule.length > 1 && (
                                    <button type="button" onClick={() => removeScheduleBlock(index)} className="btn btn-danger btn-sm">✕</button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="full-width btn-group">
                        <button type="submit" className={`btn ${editingSessionId ? 'btn-warning' : 'btn-success'}`} style={{ flex: 1 }}>
                            {editingSessionId ? t('manageSessions.updateBtn') : t('manageSessions.addBtn')}
                        </button>
                        {editingSessionId && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">{t('manageSessions.cancelBtn')}</button>
                        )}
                    </div>
                </form>
            </div>

            {/* SESSIONS LIST */}
            <div className="card-header" style={{ marginBottom: '16px' }}>
                📅 {t('manageSessions.sessionsListTitle')} ({sessions.length})
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
                {sessions.map((session) => (
                    <div key={session._id} className="item-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 6px 0' }}>{session.course?.title}</h3>
                                <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {t('manageSessions.instructorLabel')}: <strong style={{ color: 'var(--text-primary)' }}>{session.teacher?.firstName} {session.teacher?.lastName}</strong>
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className={`badge ${statusBadge(session.status)}`}>{session.status}</span>
                                <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {session.currentStudents} / {session.maxStudents} {t('manageSessions.enrolledLabel')}
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-table-stripe)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{t('manageSessions.meetsOnLabel')}: </strong>
                            {session.schedule.map((s, i) => (
                                <span key={i}>{s.day}s ({s.startTime}-{s.endTime}){i < session.schedule.length - 1 ? ', ' : ''}</span>
                            ))}
                            <br />
                            <span style={{ fontSize: '0.82rem' }}>
                                📆 {new Date(session.startDate).toLocaleDateString()} → {new Date(session.endDate).toLocaleDateString()}
                            </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => handleEdit(session)} className="btn btn-warning btn-sm">{t('manageSessions.editBtn')}</button>
                            <button onClick={() => handleDelete(session._id)} className="btn btn-danger btn-sm">{t('manageSessions.deleteBtn')}</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageSessions;