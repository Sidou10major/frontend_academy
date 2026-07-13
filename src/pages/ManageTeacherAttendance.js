import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ManageTeacherAttendance = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);

    // Data sources
    const [sessions, setSessions] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [records, setRecords] = useState([]);

    // Form state
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('Present');
    const [remarks, setRemarks] = useState('');
    const [editingId, setEditingId] = useState(null);

    // Filter state
    const [filterTeacherId, setFilterTeacherId] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // UI state
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Fetch sessions, teachers, and records on mount
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch records when filters change
    useEffect(() => {
        fetchRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterTeacherId, filterDate]);

    const fetchData = async () => {
        try {
            const [sessionsRes, usersRes] = await Promise.all([
                api.get('/sessions'),
                api.get('/users')
            ]);
            const allSessions = sessionsRes.data;
            const allTeachers = usersRes.data.filter(u => u.role === 'teacher');

            setSessions(allSessions);
            setTeachers(allTeachers);

            if (allSessions.length > 0) {
                setSelectedSessionId(allSessions[0]._id);
                // Auto-select the teacher for the first session
                if (allSessions[0].teacher) {
                    const teacherId = typeof allSessions[0].teacher === 'object'
                        ? allSessions[0].teacher._id
                        : allSessions[0].teacher;
                    setSelectedTeacherId(teacherId);
                }
            }

            await fetchRecords();
            setLoading(false);
        } catch (err) {
            setError(t('teacherAttendanceMgmt.errorLoad'));
            setLoading(false);
        }
    };

    const fetchRecords = async () => {
        try {
            let queryParams = [];
            if (filterTeacherId) queryParams.push(`teacherId=${filterTeacherId}`);
            if (filterDate) queryParams.push(`date=${filterDate}`);
            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

            const res = await api.get(`/teacher-attendance${queryString}`);
            setRecords(res.data);
        } catch (err) {
            // Silently fail on filter fetch — records will just be empty
        }
    };

    // When session changes, auto-populate teacher
    const handleSessionChange = (sessionId) => {
        setSelectedSessionId(sessionId);
        const session = sessions.find(s => s._id === sessionId);
        if (session && session.teacher) {
            const teacherId = typeof session.teacher === 'object'
                ? session.teacher._id
                : session.teacher;
            setSelectedTeacherId(teacherId);
        } else {
            setSelectedTeacherId('');
        }
    };

    const resetForm = () => {
        setStatus('Present');
        setRemarks('');
        setEditingId(null);
        if (sessions.length > 0) {
            setSelectedSessionId(sessions[0]._id);
            handleSessionChange(sessions[0]._id);
        }
        setAttendanceDate(new Date().toISOString().split('T')[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/teacher-attendance', {
                teacher: selectedTeacherId,
                session: selectedSessionId,
                date: attendanceDate,
                status,
                remarks,
                markedBy: user?._id || user?.id
            });

            setSuccess(editingId
                ? t('teacherAttendanceMgmt.successUpdate')
                : t('teacherAttendanceMgmt.successRecord')
            );
            resetForm();
            await fetchRecords();
        } catch (err) {
            setError(err.response?.data?.error || t('teacherAttendanceMgmt.errorSave'));
        } finally {
            setSubmitting(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const handleEdit = (record) => {
        setEditingId(record._id);
        setSelectedSessionId(record.session?._id || '');
        setSelectedTeacherId(record.teacher?._id || '');
        setAttendanceDate(new Date(record.date).toISOString().split('T')[0]);
        setStatus(record.status);
        setRemarks(record.remarks || '');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('teacherAttendanceMgmt.confirmDelete'))) return;
        try {
            await api.delete(`/teacher-attendance/${id}`);
            setSuccess(t('teacherAttendanceMgmt.successDelete'));
            await fetchRecords();
        } catch (err) {
            setError(t('teacherAttendanceMgmt.errorDelete'));
        }
        setTimeout(() => setSuccess(''), 4000);
    };

    const getTeacherName = (teacher) => {
        if (!teacher) return '—';
        return `${teacher.firstName} ${teacher.lastName}`;
    };

    const getSessionLabel = (session) => {
        if (!session) return '—';
        const courseTitle = session.course?.title || 'Unknown Course';
        return courseTitle;
    };

    const statusBadgeClass = (st) => {
        const map = { 'Present': 'badge-success', 'Late': 'badge-warning', 'Absent': 'badge-danger' };
        return map[st] || 'badge-primary';
    };

    const statusIcon = (st) => {
        const map = { 'Present': '✅', 'Late': '⏰', 'Absent': '❌' };
        return map[st] || '—';
    };

    // Compute stats from current filtered records
    const stats = {
        total: records.length,
        present: records.filter(r => r.status === 'Present').length,
        late: records.filter(r => r.status === 'Late').length,
        absent: records.filter(r => r.status === 'Absent').length,
    };

    if (loading) return (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.2rem' }}>⏳ {t('teacherAttendanceMgmt.loading')}</span>
        </div>
    );

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('teacherAttendanceMgmt.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* ───── RECORD FORM ───── */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <div className="card-header">
                    {editingId ? `✏️ ${t('teacherAttendanceMgmt.editTitle')}` : `📋 ${t('teacherAttendanceMgmt.recordTitle')}`}
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* Session Select */}
                        <div className="form-group">
                            <label>{t('teacherAttendanceMgmt.sessionLabel')}</label>
                            <select
                                className="form-select"
                                value={selectedSessionId}
                                onChange={(e) => handleSessionChange(e.target.value)}
                                required
                            >
                                <option value="">{t('teacherAttendanceMgmt.selectSession')}</option>
                                {sessions.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.course?.title || 'Untitled'} — {s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : 'No Teacher'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Teacher (auto-populated, read-only visual) */}
                        <div className="form-group">
                            <label>{t('teacherAttendanceMgmt.teacherLabel')}</label>
                            <select
                                className="form-select"
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value)}
                                required
                            >
                                <option value="">{t('teacherAttendanceMgmt.selectTeacher')}</option>
                                {teachers.map(tc => (
                                    <option key={tc._id} value={tc._id}>
                                        {tc.firstName} {tc.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div className="form-group">
                            <label>{t('teacherAttendanceMgmt.dateLabel')}</label>
                            <input
                                type="date"
                                className="form-input"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Status Radio Buttons */}
                        <div className="form-group">
                            <label>{t('teacherAttendanceMgmt.statusLabel')}</label>
                            <div style={{ display: 'flex', gap: '10px', paddingTop: '6px' }}>
                                {['Present', 'Late', 'Absent'].map(s => (
                                    <label
                                        key={s}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 16px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: `2px solid ${status === s ? (s === 'Present' ? 'var(--success)' : s === 'Late' ? 'var(--warning)' : 'var(--danger)') : 'var(--border)'}`,
                                            background: status === s ? (s === 'Present' ? 'var(--success-bg)' : s === 'Late' ? 'var(--warning-bg)' : 'var(--danger-bg)') : 'var(--bg-input)',
                                            cursor: 'pointer',
                                            fontWeight: status === s ? 600 : 400,
                                            fontSize: '0.88rem',
                                            transition: 'var(--transition)',
                                            flex: 1,
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="status"
                                            value={s}
                                            checked={status === s}
                                            onChange={(e) => setStatus(e.target.value)}
                                            style={{ display: 'none' }}
                                        />
                                        {statusIcon(s)} {t(`teacherAttendanceMgmt.status_${s.toLowerCase()}`)}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="form-group full-width">
                            <label>{t('teacherAttendanceMgmt.remarksLabel')}</label>
                            <textarea
                                className="form-textarea"
                                rows="2"
                                placeholder={t('teacherAttendanceMgmt.remarksPlaceholder')}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting
                                ? '⏳ ...'
                                : editingId
                                    ? `✏️ ${t('teacherAttendanceMgmt.updateBtn')}`
                                    : `✅ ${t('teacherAttendanceMgmt.submitBtn')}`
                            }
                        </button>
                        {editingId && (
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                {t('teacherAttendanceMgmt.cancelBtn')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* ───── STAT CARDS ───── */}
            <div className="stat-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card primary">
                    <h3>{t('teacherAttendanceMgmt.totalRecords')}</h3>
                    <p className="metric">{stats.total}</p>
                </div>
                <div className="stat-card success">
                    <h3>{t('teacherAttendanceMgmt.presentCount')}</h3>
                    <p className="metric">{stats.present}</p>
                </div>
                <div className="stat-card warning">
                    <h3>{t('teacherAttendanceMgmt.lateCount')}</h3>
                    <p className="metric">{stats.late}</p>
                </div>
                <div className="stat-card danger">
                    <h3>{t('teacherAttendanceMgmt.absentCount')}</h3>
                    <p className="metric">{stats.absent}</p>
                </div>
            </div>

            {/* ───── FILTER BAR ───── */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">🔍 {t('teacherAttendanceMgmt.filterTitle')}</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>{t('teacherAttendanceMgmt.filterByTeacher')}</label>
                        <select
                            className="form-select"
                            value={filterTeacherId}
                            onChange={(e) => setFilterTeacherId(e.target.value)}
                        >
                            <option value="">{t('teacherAttendanceMgmt.allTeachers')}</option>
                            {teachers.map(tc => (
                                <option key={tc._id} value={tc._id}>
                                    {tc.firstName} {tc.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('teacherAttendanceMgmt.filterByDate')}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="date"
                                className="form-input"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                            {filterDate && (
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setFilterDate('')}
                                    title="Clear date filter"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ───── ATTENDANCE LEDGER TABLE ───── */}
            {records.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table" style={{ boxShadow: 'none', borderRadius: 0 }}>
                        <thead>
                            <tr>
                                <th>{t('teacherAttendanceMgmt.colTeacher')}</th>
                                <th>{t('teacherAttendanceMgmt.colCourse')}</th>
                                <th>{t('teacherAttendanceMgmt.colDate')}</th>
                                <th>{t('teacherAttendanceMgmt.colStatus')}</th>
                                <th>{t('teacherAttendanceMgmt.colRemarks')}</th>
                                <th>{t('teacherAttendanceMgmt.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((rec) => (
                                <tr key={rec._id}>
                                    <td><strong>{getTeacherName(rec.teacher)}</strong></td>
                                    <td>{getSessionLabel(rec.session)}</td>
                                    <td>{new Date(rec.date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${statusBadgeClass(rec.status)}`}>
                                            {statusIcon(rec.status)} {t(`teacherAttendanceMgmt.status_${rec.status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '200px' }}>
                                        {rec.remarks || '—'}
                                    </td>
                                    <td>
                                        <div className="btn-group">
                                            <button className="btn btn-warning btn-sm" onClick={() => handleEdit(rec)}>
                                                ✏️ {t('teacherAttendanceMgmt.editBtn')}
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rec._id)}>
                                                🗑 {t('teacherAttendanceMgmt.deleteBtn')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="icon">🧑‍🏫</div>
                    <h3 style={{ color: 'var(--text-secondary)' }}>{t('teacherAttendanceMgmt.noRecords')}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('teacherAttendanceMgmt.noRecordsHelp')}</p>
                </div>
            )}
        </div>
    );
};

export default ManageTeacherAttendance;
