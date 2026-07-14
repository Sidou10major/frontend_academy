import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManageUsers = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'student', languages: [], phone: ''
    });

    const languageOptions = ['Arabic', 'Darija', 'French', 'English', 'German', 'Spanish', 'Italian', 'Chinese'];
    const roleOptions = ['student', 'teacher', 'admin'];

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load users.');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLanguageToggle = (lang) => {
        setFormData((prev) => {
            const currentLanguages = prev.languages;
            if (currentLanguages.includes(lang)) {
                return { ...prev, languages: currentLanguages.filter(l => l !== lang) };
            } else {
                return { ...prev, languages: [...currentLanguages, lang] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg('');
        try {
            if (editingUserId) {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                const response = await api.put(`/users/${editingUserId}`, updateData);
                setSuccessMsg(t('manageUsers.successUpdate'));
                setUsers(users.map(u => u._id === editingUserId ? response.data : u));
                setEditingUserId(null);
            } else {
                const response = await api.post('/users', formData);
                setSuccessMsg(t('manageUsers.successCreate', { role: formData.role }));
                setUsers([...users, response.data]);
            }
            setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'student', languages: [], phone: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Error saving user');
        }
    };

    const handleEdit = (user) => {
        setEditingUserId(user._id);
        setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role, languages: user.languages || [], phone: user.phone || '' });
        setError(''); setSuccessMsg('');
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'student', languages: [], phone: '' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('manageUsers.confirmDelete'))) return;
        setError(''); setSuccessMsg('');
        try {
            await api.delete(`/users/${id}`);
            setSuccessMsg(t('manageUsers.successDelete'));
            setUsers(users.filter(u => u._id !== id));
            if (editingUserId === id) handleCancelEdit();
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting user');
        }
    };

    const handleToggleStatus = async (user) => {
        const nextStatus = !user.isActive;
        setError(''); setSuccessMsg('');
        try {
            const response = await api.put(`/users/${user._id}`, { isActive: nextStatus });
            setSuccessMsg(t('manageUsers.successStatus', { status: nextStatus ? t('manageUsers.statusActive') : t('manageUsers.statusBlocked') }));
            setUsers(users.map(u => u._id === user._id ? response.data : u));
        } catch (err) {
            setError('Failed to update user status.');
        }
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('manageUsers.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('manageUsers.title')}</h1>

            {/* FORM CARD */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">
                    {editingUserId ? `✏️ ${t('manageUsers.editTitle')}` : `👤 ${t('manageUsers.createTitle')}`}
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>{t('manageUsers.firstNameLabel')}</label>
                        <input type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleInputChange} required placeholder="e.g., Sid Ahmed" />
                    </div>

                    <div className="form-group">
                        <label>{t('manageUsers.lastNameLabel')}</label>
                        <input type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleInputChange} required placeholder="e.g., Boudaoud" />
                    </div>

                    <div className="form-group">
                        <label>{t('manageUsers.emailLabel')}</label>
                        <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} required placeholder="contact@academy.com" />
                    </div>

                    <div className="form-group">
                        <label>{editingUserId ? t('manageUsers.passwordLabelEdit') : t('manageUsers.passwordLabelCreate')}</label>
                        <input type="password" name="password" className="form-input" value={formData.password} onChange={handleInputChange} required={!editingUserId} placeholder={editingUserId ? t('manageUsers.passwordPlaceholderEdit') : t('manageUsers.passwordPlaceholderCreate')} />
                    </div>

                    <div className="form-group">
                        <label>{t('manageUsers.phoneLabel') || '📱 WhatsApp Phone'}</label>
                        <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleInputChange} placeholder="+213xxxxxxxxx" />
                    </div>

                    <div className="form-group full-width">
                        <label>{t('manageUsers.roleLabel')}</label>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                            {roleOptions.map(role => (
                                <label key={role} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize', padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: formData.role === role ? 'var(--primary-glow)' : 'transparent', border: formData.role === role ? '1.5px solid var(--primary)' : '1.5px solid var(--border)', color: formData.role === role ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: formData.role === role ? 600 : 400, transition: 'var(--transition)' }}>
                                    <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleInputChange} style={{ display: 'none' }} />
                                    {role}
                                </label>
                            ))}
                        </div>
                    </div>

                    {formData.role !== 'admin' && (
                        <div className="form-group full-width">
                            <label>{t('manageUsers.langLabel')}</label>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
                                {formData.role === 'teacher' ? t('manageUsers.langTeacherDesc') : t('manageUsers.langStudentDesc')}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {languageOptions.map(lang => (
                                    <label key={lang} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: formData.languages.includes(lang) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)', background: formData.languages.includes(lang) ? 'var(--primary-glow)' : 'var(--bg-input)', color: formData.languages.includes(lang) ? 'var(--primary)' : 'var(--text-primary)', fontWeight: formData.languages.includes(lang) ? 600 : 400, fontSize: '0.88rem', transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input type="checkbox" checked={formData.languages.includes(lang)} onChange={() => handleLanguageToggle(lang)} style={{ display: 'none' }} />
                                        {lang}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="full-width btn-group">
                        <button type="submit" className={`btn ${editingUserId ? 'btn-warning' : 'btn-success'}`} style={{ flex: 1 }}>
                            {editingUserId ? t('manageUsers.updateBtn') : t('manageUsers.addBtn', { role: formData.role })}
                        </button>
                        {editingUserId && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                {t('manageUsers.cancelBtn')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* USERS TABLE */}
            <div className="card-header" style={{ marginBottom: '16px' }}>
                👥 {t('manageUsers.directoryTitle')} ({users.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('manageUsers.colName')}</th>
                            <th>{t('manageUsers.colEmail')}</th>
                            <th>{t('manageUsers.colPhone') || 'Phone'}</th>
                            <th>{t('manageUsers.colRole')}</th>
                            <th>{t('manageUsers.colLanguages')}</th>
                            <th>{t('manageUsers.colStatus')}</th>
                            <th>{t('manageUsers.colActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id}>
                                <td><strong>{u.firstName} {u.lastName}</strong></td>
                                <td>{u.email}</td>
                                <td>{u.phone || '—'}</td>
                                <td>
                                    <span className={`badge ${u.role === 'admin' ? 'badge-warning' : u.role === 'teacher' ? 'badge-info' : 'badge-success'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>{u.languages?.join(', ') || '-'}</td>
                                <td>
                                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {u.isActive ? t('manageUsers.statusActive') : t('manageUsers.statusBlocked')}
                                    </span>
                                </td>
                                <td>
                                    <div className="btn-group">
                                        <button onClick={() => handleEdit(u)} className="btn btn-warning btn-sm">
                                            {t('manageUsers.editBtn')}
                                        </button>
                                        <button onClick={() => handleToggleStatus(u)} className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}>
                                            {u.isActive ? t('manageUsers.blockBtn') : t('manageUsers.unblockBtn')}
                                        </button>
                                        <button onClick={() => handleDelete(u._id)} className="btn btn-secondary btn-sm">
                                            {t('manageUsers.deleteBtn')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;