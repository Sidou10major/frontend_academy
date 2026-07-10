import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManageCourses = () => {
    const { t } = useTranslation();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [editingCourseId, setEditingCourseId] = useState(null);

    const [formData, setFormData] = useState({
        title: '', language: 'English', level: 'A1 (Beginner)', format: 'Group Class', price: 0, description: ''
    });

    const languages = ['Arabic', 'Darija', 'French', 'English', 'German', 'Spanish', 'Italian', 'Chinese'];
    const levels = ['A1 (Beginner)', 'A2 (Elementary)', 'B1 (Intermediate)', 'B2 (Upper Intermediate)', 'C1 (Advanced)', 'C2 (Mastery)'];
    const formats = ['1-on-1', 'Group Class'];

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load courses.');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg('');
        try {
            if (editingCourseId) {
                const response = await api.put(`/courses/${editingCourseId}`, formData);
                setSuccessMsg(t('manageCourses.successUpdate'));
                setCourses(courses.map(c => c._id === editingCourseId ? response.data : c));
                setEditingCourseId(null);
            } else {
                const response = await api.post('/courses', formData);
                setSuccessMsg(t('manageCourses.successCreate'));
                setCourses([...courses, response.data]);
            }
            setFormData({ title: '', language: 'English', level: 'A1 (Beginner)', format: 'Group Class', price: 0, description: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Error saving course');
        }
    };

    const handleEdit = (course) => {
        setEditingCourseId(course._id);
        setFormData({ title: course.title, language: course.language, level: course.level, format: course.format, price: course.price, description: course.description || '' });
        setError(''); setSuccessMsg('');
    };

    const handleCancelEdit = () => {
        setEditingCourseId(null);
        setFormData({ title: '', language: 'English', level: 'A1 (Beginner)', format: 'Group Class', price: 0, description: '' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('manageCourses.confirmDelete'))) return;
        setError(''); setSuccessMsg('');
        try {
            await api.delete(`/courses/${id}`);
            setSuccessMsg(t('manageCourses.successDelete'));
            setCourses(courses.filter(c => c._id !== id));
            if (editingCourseId === id) handleCancelEdit();
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting course');
        }
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('manageCourses.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="page-title">{t('manageCourses.title')}</h1>

            {/* FORM CARD */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">
                    {editingCourseId ? `✏️ ${t('manageCourses.editTitle')}` : `➕ ${t('manageCourses.createTitle')}`}
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group full-width">
                        <label>{t('manageCourses.titleLabel')}</label>
                        <input type="text" name="title" className="form-input" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Intensive Business English" />
                    </div>

                    <div className="form-group">
                        <label>{t('manageCourses.languageLabel')}</label>
                        <select name="language" className="form-select" value={formData.language} onChange={handleInputChange}>
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('manageCourses.levelLabel')}</label>
                        <select name="level" className="form-select" value={formData.level} onChange={handleInputChange}>
                            {levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('manageCourses.formatLabel')}</label>
                        <select name="format" className="form-select" value={formData.format} onChange={handleInputChange}>
                            {formats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('manageCourses.priceLabel')}</label>
                        <input type="number" name="price" className="form-input" value={formData.price} onChange={handleInputChange} required min="0" />
                    </div>

                    <div className="form-group full-width">
                        <label>{t('manageCourses.descriptionLabel')}</label>
                        <textarea name="description" className="form-textarea" value={formData.description} onChange={handleInputChange} rows="3" placeholder={t('manageCourses.descriptionPlaceholder')} />
                    </div>

                    <div className="full-width btn-group">
                        <button type="submit" className={`btn ${editingCourseId ? 'btn-warning' : 'btn-primary'}`} style={{ flex: 1 }}>
                            {editingCourseId ? t('manageCourses.updateBtn') : t('manageCourses.addBtn')}
                        </button>
                        {editingCourseId && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                {t('manageCourses.cancelBtn')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* COURSE LIST */}
            <div className="card-header" style={{ marginBottom: '16px' }}>
                📚 {t('manageCourses.activeCourses')} ({courses.length})
            </div>

            {courses.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📚</div>
                    <p>{t('manageCourses.noCourses')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {courses.map((course) => (
                        <div key={course._id} className="item-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0' }}>{course.title}</h3>
                                    <div className="meta" style={{ marginBottom: '8px' }}>
                                        <span>🌍 {course.language}</span>
                                        <span>📈 {course.level}</span>
                                        <span>👥 {course.format}</span>
                                    </div>
                                    {course.description && <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{course.description}</p>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>${course.price}</span>
                                    <div className="btn-group">
                                        <button onClick={() => handleEdit(course)} className="btn btn-warning btn-sm">
                                            {t('manageCourses.editBtn')}
                                        </button>
                                        <button onClick={() => handleDelete(course._id)} className="btn btn-danger btn-sm">
                                            {t('manageCourses.deleteBtn')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageCourses;