import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ManageAnnouncements = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [announcements, setAnnouncements] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        title: '', content: '', audience: 'all', session: '', priority: 'normal', expiresAt: ''
    });

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            const [annRes, sessRes] = await Promise.all([
                api.get('/announcements'),
                api.get('/sessions')
            ]);
            setAnnouncements(annRes.data);
            setSessions(sessRes.data);
            setLoading(false);
        } catch (err) { setError(t('announcements.errorLoad')); setLoading(false); }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        try {
            const payload = {
                ...formData,
                author: user.id || user._id,
                session: formData.audience === 'session' ? formData.session : undefined,
                expiresAt: formData.expiresAt || undefined
            };

            if (editingId) {
                await api.put(`/announcements/${editingId}`, payload);
                setSuccessMsg(t('announcements.successUpdate'));
                setEditingId(null);
            } else {
                const res = await api.post('/announcements', payload);
                setSuccessMsg(t('announcements.successCreate', { count: res.data.notifiedUsers }));
            }
            resetForm();
            const updated = await api.get('/announcements');
            setAnnouncements(updated.data);
        } catch (err) { setError(err.response?.data?.error || t('announcements.errorSave')); }
    };

    const handleEdit = (ann) => {
        setEditingId(ann._id);
        setFormData({
            title: ann.title,
            content: ann.content,
            audience: ann.audience,
            session: ann.session?._id || '',
            priority: ann.priority,
            expiresAt: ann.expiresAt ? new Date(ann.expiresAt).toISOString().split('T')[0] : ''
        });
        setError(''); setSuccessMsg('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('announcements.confirmDelete'))) return;
        setError(''); setSuccessMsg('');
        try {
            await api.delete(`/announcements/${id}`);
            setSuccessMsg(t('announcements.successDelete'));
            setAnnouncements(announcements.filter(a => a._id !== id));
            if (editingId === id) resetForm();
        } catch (err) { setError(t('announcements.errorDelete')); }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ title: '', content: '', audience: 'all', session: '', priority: 'normal', expiresAt: '' });
    };

    const priorityBadge = (priority) => {
        const map = { urgent: 'badge-danger', important: 'badge-warning', normal: 'badge-info' };
        return map[priority] || 'badge-info';
    };

    const audienceLabel = (audience) => {
        const map = { all: t('announcements.audienceAll'), students: t('announcements.audienceStudents'), teachers: t('announcements.audienceTeachers'), session: t('announcements.audienceSession') };
        return map[audience] || audience;
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('announcements.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('announcements.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {/* FORM */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">
                    {editingId ? `✏️ ${t('announcements.editTitle')}` : `📢 ${t('announcements.createTitle')}`}
                </div>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>{t('announcements.titleLabel')}</label>
                        <input type="text" name="title" className="form-input" value={formData.title} onChange={handleInputChange} required placeholder={t('announcements.titlePlaceholder')} />
                    </div>
                    <div className="form-group">
                        <label>{t('announcements.priorityLabel')}</label>
                        <select name="priority" className="form-select" value={formData.priority} onChange={handleInputChange}>
                            <option value="normal">{t('announcements.priorityNormal')}</option>
                            <option value="important">{t('announcements.priorityImportant')}</option>
                            <option value="urgent">{t('announcements.priorityUrgent')}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('announcements.audienceLabel')}</label>
                        <select name="audience" className="form-select" value={formData.audience} onChange={handleInputChange}>
                            <option value="all">{t('announcements.audienceAll')}</option>
                            <option value="students">{t('announcements.audienceStudents')}</option>
                            <option value="teachers">{t('announcements.audienceTeachers')}</option>
                            <option value="session">{t('announcements.audienceSession')}</option>
                        </select>
                    </div>
                    {formData.audience === 'session' && (
                        <div className="form-group">
                            <label>{t('announcements.sessionLabel')}</label>
                            <select name="session" className="form-select" value={formData.session} onChange={handleInputChange} required>
                                <option value="">{t('announcements.selectSession')}</option>
                                {sessions.map(s => (
                                    <option key={s._id} value={s._id}>{s.course?.title} ({new Date(s.startDate).toLocaleDateString()})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="form-group">
                        <label>{t('announcements.expiresLabel')}</label>
                        <input type="date" name="expiresAt" className="form-input" value={formData.expiresAt} onChange={handleInputChange} />
                    </div>
                    <div className="form-group full-width">
                        <label>{t('announcements.contentLabel')}</label>
                        <textarea name="content" className="form-textarea" rows="3" value={formData.content} onChange={handleInputChange} required placeholder={t('announcements.contentPlaceholder')} />
                    </div>
                    <div className="full-width btn-group">
                        <button type="submit" className={`btn ${editingId ? 'btn-warning' : 'btn-primary'}`} style={{ flex: 1 }}>
                            {editingId ? t('announcements.updateBtn') : t('announcements.createBtn')}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="btn btn-secondary">{t('announcements.cancelBtn')}</button>
                        )}
                    </div>
                </form>
            </div>

            {/* ANNOUNCEMENTS LIST */}
            <div className="card-header" style={{ marginBottom: '16px' }}>📋 {t('announcements.listTitle')}</div>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('announcements.colTitle')}</th>
                            <th>{t('announcements.colAudience')}</th>
                            <th>{t('announcements.colPriority')}</th>
                            <th>{t('announcements.colAuthor')}</th>
                            <th>{t('announcements.colDate')}</th>
                            <th>{t('announcements.colActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('announcements.noAnnouncements')}</td></tr>
                        ) : (
                            announcements.map(ann => (
                                <tr key={ann._id}>
                                    <td>
                                        <strong>{ann.title}</strong>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {ann.content?.substring(0, 60)}{ann.content?.length > 60 ? '...' : ''}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-primary">{audienceLabel(ann.audience)}</span></td>
                                    <td><span className={`badge ${priorityBadge(ann.priority)}`}>{ann.priority}</span></td>
                                    <td>{ann.author?.firstName} {ann.author?.lastName}</td>
                                    <td>{new Date(ann.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="btn-group">
                                            <button onClick={() => handleEdit(ann)} className="btn btn-warning btn-sm">{t('announcements.editBtn')}</button>
                                            <button onClick={() => handleDelete(ann._id)} className="btn btn-danger btn-sm">{t('announcements.deleteBtn')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageAnnouncements;
