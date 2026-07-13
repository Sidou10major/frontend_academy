import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TeacherGradeBook = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const teacherId = user?.id || user?._id;

    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [roster, setRoster] = useState([]);
    const [activeTab, setActiveTab] = useState('grades');

    // Grades
    const [grades, setGrades] = useState([]);
    const [gradeForm, setGradeForm] = useState({ student: '', type: 'quiz', title: '', score: '', maxScore: '100', weight: '1', date: new Date().toISOString().split('T')[0], remarks: '' });
    const [editingGradeId, setEditingGradeId] = useState(null);

    // Skills
    const [assessments, setAssessments] = useState([]);
    const [skillForm, setSkillForm] = useState({
        student: '', date: new Date().toISOString().split('T')[0], overallLevel: '', remarks: '',
        speaking: 0, listening: 0, reading: 0, writing: 0, grammar: 0, vocabulary: 0, pronunciation: 0
    });
    const [editingSkillId, setEditingSkillId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const skillNames = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary', 'pronunciation'];

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await api.get(`/sessions?teacher=${teacherId}`);
                setSessions(res.data);
                setLoading(false);
            } catch (err) { setError(t('gradeBook.errorLoad')); setLoading(false); }
        };
        fetchSessions();
    }, [teacherId, t]);

    const handleSelectSession = async (session) => {
        setSelectedSession(session); setError(''); setSuccessMsg('');
        try {
            const [rosterRes, gradesRes, skillsRes] = await Promise.all([
                api.get(`/enrollments/session/${session._id}`),
                api.get(`/grades/session/${session._id}`),
                api.get(`/skill-assessments/session/${session._id}`)
            ]);
            setRoster(rosterRes.data);
            setGrades(gradesRes.data);
            setAssessments(skillsRes.data);
            if (rosterRes.data.length > 0) {
                setGradeForm(prev => ({ ...prev, student: rosterRes.data[0].student._id }));
                setSkillForm(prev => ({ ...prev, student: rosterRes.data[0].student._id }));
            }
        } catch (err) { setError(t('gradeBook.errorLoad')); }
    };

    // ── Grade Handlers ──
    const handleGradeChange = (e) => setGradeForm({ ...gradeForm, [e.target.name]: e.target.value });

    const handleGradeSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        try {
            const payload = { ...gradeForm, session: selectedSession._id, teacher: teacherId };
            if (editingGradeId) {
                await api.put(`/grades/${editingGradeId}`, payload);
                setSuccessMsg(t('gradeBook.successGradeUpdate'));
                setEditingGradeId(null);
            } else {
                await api.post('/grades', payload);
                setSuccessMsg(t('gradeBook.successGradeCreate'));
            }
            const res = await api.get(`/grades/session/${selectedSession._id}`);
            setGrades(res.data);
            resetGradeForm();
        } catch (err) { setError(err.response?.data?.error || t('gradeBook.errorSave')); }
    };

    const handleEditGrade = (grade) => {
        setEditingGradeId(grade._id);
        setGradeForm({
            student: grade.student?._id || '', type: grade.type, title: grade.title,
            score: grade.score, maxScore: grade.maxScore, weight: grade.weight,
            date: new Date(grade.date).toISOString().split('T')[0], remarks: grade.remarks || ''
        });
    };

    const handleDeleteGrade = async (id) => {
        if (!window.confirm(t('gradeBook.confirmDelete'))) return;
        try {
            await api.delete(`/grades/${id}`);
            setGrades(grades.filter(g => g._id !== id));
            setSuccessMsg(t('gradeBook.successDelete'));
        } catch (err) { setError(t('gradeBook.errorDelete')); }
    };

    const resetGradeForm = () => {
        setEditingGradeId(null);
        setGradeForm({ student: roster.length > 0 ? roster[0].student._id : '', type: 'quiz', title: '', score: '', maxScore: '100', weight: '1', date: new Date().toISOString().split('T')[0], remarks: '' });
    };

    // ── Skill Assessment Handlers ──
    const handleSkillChange = (e) => setSkillForm({ ...skillForm, [e.target.name]: e.target.value });
    const handleSkillSlider = (skill, value) => setSkillForm({ ...skillForm, [skill]: Number(value) });

    const handleSkillSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        try {
            const skills = {};
            skillNames.forEach(s => { skills[s] = Number(skillForm[s]); });
            const payload = {
                student: skillForm.student, session: selectedSession._id, teacher: teacherId,
                skills, overallLevel: skillForm.overallLevel || undefined,
                remarks: skillForm.remarks, date: skillForm.date
            };
            if (editingSkillId) {
                await api.put(`/skill-assessments/${editingSkillId}`, payload);
                setSuccessMsg(t('gradeBook.successSkillUpdate'));
                setEditingSkillId(null);
            } else {
                await api.post('/skill-assessments', payload);
                setSuccessMsg(t('gradeBook.successSkillCreate'));
            }
            const res = await api.get(`/skill-assessments/session/${selectedSession._id}`);
            setAssessments(res.data);
            resetSkillForm();
        } catch (err) { setError(err.response?.data?.error || t('gradeBook.errorSave')); }
    };

    const handleEditSkill = (a) => {
        setEditingSkillId(a._id);
        setSkillForm({
            student: a.student?._id || '', date: new Date(a.date).toISOString().split('T')[0],
            overallLevel: a.overallLevel || '', remarks: a.remarks || '',
            ...a.skills
        });
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm(t('gradeBook.confirmDelete'))) return;
        try {
            await api.delete(`/skill-assessments/${id}`);
            setAssessments(assessments.filter(a => a._id !== id));
            setSuccessMsg(t('gradeBook.successDelete'));
        } catch (err) { setError(t('gradeBook.errorDelete')); }
    };

    const resetSkillForm = () => {
        setEditingSkillId(null);
        setSkillForm({
            student: roster.length > 0 ? roster[0].student._id : '', date: new Date().toISOString().split('T')[0],
            overallLevel: '', remarks: '', speaking: 0, listening: 0, reading: 0, writing: 0, grammar: 0, vocabulary: 0, pronunciation: 0
        });
    };

    const gradeTypeBadge = (type) => {
        const map = { quiz: 'badge-info', exam: 'badge-danger', oral: 'badge-warning', homework: 'badge-primary', project: 'badge-success', participation: 'badge-primary' };
        return map[type] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('gradeBook.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('gradeBook.title')}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', marginTop: '8px' }}>
                {/* LEFT: Session selector */}
                <div>
                    <div className="card-header" style={{ marginBottom: '16px' }}>📚 {t('gradeBook.myClasses')}</div>
                    {sessions.length === 0 ? (
                        <div className="empty-state"><div className="icon">📚</div><p>{t('gradeBook.noClasses')}</p></div>
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
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {session.currentStudents} / {session.maxStudents} {t('gradeBook.students')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Grade Book */}
                <div>
                    {selectedSession ? (
                        <div className="card">
                            <div className="card-header">📝 {selectedSession.course?.title} — {t('gradeBook.title')}</div>

                            {error && <div className="alert alert-danger">{error}</div>}
                            {successMsg && <div className="alert alert-success">{successMsg}</div>}

                            {/* TABS */}
                            <div className="tab-nav">
                                <button className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => setActiveTab('grades')}>
                                    📊 {t('gradeBook.gradesTab')}
                                </button>
                                <button className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>
                                    🎯 {t('gradeBook.skillsTab')}
                                </button>
                            </div>

                            {/* GRADES TAB */}
                            {activeTab === 'grades' && (
                                <>
                                    <form onSubmit={handleGradeSubmit} className="form-grid" style={{ marginBottom: '24px' }}>
                                        <div className="form-group">
                                            <label>{t('gradeBook.studentLabel')}</label>
                                            <select name="student" className="form-select" value={gradeForm.student} onChange={handleGradeChange} required>
                                                {roster.map(r => <option key={r.student._id} value={r.student._id}>{r.student.firstName} {r.student.lastName}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>{t('gradeBook.typeLabel')}</label>
                                            <select name="type" className="form-select" value={gradeForm.type} onChange={handleGradeChange}>
                                                {['quiz', 'exam', 'oral', 'homework', 'project', 'participation'].map(t2 => (
                                                    <option key={t2} value={t2}>{t(`gradeBook.type_${t2}`)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>{t('gradeBook.gradeTitle')}</label>
                                            <input type="text" name="title" className="form-input" value={gradeForm.title} onChange={handleGradeChange} required placeholder={t('gradeBook.gradeTitlePlaceholder')} />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('gradeBook.dateLabel')}</label>
                                            <input type="date" name="date" className="form-input" value={gradeForm.date} onChange={handleGradeChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('gradeBook.scoreLabel')}</label>
                                            <input type="number" name="score" className="form-input" value={gradeForm.score} onChange={handleGradeChange} min="0" max="100" required />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('gradeBook.maxScoreLabel')}</label>
                                            <input type="number" name="maxScore" className="form-input" value={gradeForm.maxScore} onChange={handleGradeChange} min="1" />
                                        </div>
                                        <div className="full-width btn-group">
                                            <button type="submit" className={`btn ${editingGradeId ? 'btn-warning' : 'btn-primary'}`} style={{ flex: 1 }}>
                                                {editingGradeId ? t('gradeBook.updateBtn') : t('gradeBook.addGradeBtn')}
                                            </button>
                                            {editingGradeId && <button type="button" onClick={resetGradeForm} className="btn btn-secondary">{t('gradeBook.cancelBtn')}</button>}
                                        </div>
                                    </form>

                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('gradeBook.colStudent')}</th>
                                                <th>{t('gradeBook.colType')}</th>
                                                <th>{t('gradeBook.colTitle')}</th>
                                                <th>{t('gradeBook.colScore')}</th>
                                                <th>{t('gradeBook.colDate')}</th>
                                                <th>{t('gradeBook.colActions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grades.length === 0 ? (
                                                <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('gradeBook.noGrades')}</td></tr>
                                            ) : (
                                                grades.map(g => (
                                                    <tr key={g._id}>
                                                        <td><strong>{g.student?.firstName} {g.student?.lastName}</strong></td>
                                                        <td><span className={`badge ${gradeTypeBadge(g.type)}`}>{g.type}</span></td>
                                                        <td>{g.title}</td>
                                                        <td style={{ fontWeight: 600 }}>{g.score}/{g.maxScore}</td>
                                                        <td>{new Date(g.date).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="btn-group">
                                                                <button onClick={() => handleEditGrade(g)} className="btn btn-warning btn-sm">{t('gradeBook.editBtn')}</button>
                                                                <button onClick={() => handleDeleteGrade(g._id)} className="btn btn-danger btn-sm">{t('gradeBook.deleteBtn')}</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {/* SKILLS TAB */}
                            {activeTab === 'skills' && (
                                <>
                                    <form onSubmit={handleSkillSubmit} style={{ marginBottom: '24px' }}>
                                        <div className="form-grid" style={{ marginBottom: '16px' }}>
                                            <div className="form-group">
                                                <label>{t('gradeBook.studentLabel')}</label>
                                                <select name="student" className="form-select" value={skillForm.student} onChange={handleSkillChange} required>
                                                    {roster.map(r => <option key={r.student._id} value={r.student._id}>{r.student.firstName} {r.student.lastName}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>{t('gradeBook.dateLabel')}</label>
                                                <input type="date" name="date" className="form-input" value={skillForm.date} onChange={handleSkillChange} required />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('gradeBook.overallLevel')}</label>
                                                <select name="overallLevel" className="form-select" value={skillForm.overallLevel} onChange={handleSkillChange}>
                                                    <option value="">{t('gradeBook.selectLevel')}</option>
                                                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                                            <div className="skill-bar-group">
                                                {skillNames.map(skill => (
                                                    <div key={skill} className="skill-bar">
                                                        <span className="skill-label">{t(`gradeBook.skill_${skill}`)}</span>
                                                        <div className="skill-track">
                                                            <div className="skill-fill" style={{ width: `${(skillForm[skill] / 5) * 100}%` }} />
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="5" step="0.5"
                                                            value={skillForm[skill]}
                                                            onChange={(e) => handleSkillSlider(skill, e.target.value)}
                                                            style={{ width: '80px' }}
                                                        />
                                                        <span className="skill-value">{skillForm[skill]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="btn-group">
                                            <button type="submit" className={`btn ${editingSkillId ? 'btn-warning' : 'btn-primary'}`} style={{ flex: 1 }}>
                                                {editingSkillId ? t('gradeBook.updateBtn') : t('gradeBook.addSkillBtn')}
                                            </button>
                                            {editingSkillId && <button type="button" onClick={resetSkillForm} className="btn btn-secondary">{t('gradeBook.cancelBtn')}</button>}
                                        </div>
                                    </form>

                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>{t('gradeBook.colStudent')}</th>
                                                <th>{t('gradeBook.colLevel')}</th>
                                                <th>{t('gradeBook.colDate')}</th>
                                                <th>{t('gradeBook.colActions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assessments.length === 0 ? (
                                                <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('gradeBook.noAssessments')}</td></tr>
                                            ) : (
                                                assessments.map(a => (
                                                    <tr key={a._id}>
                                                        <td><strong>{a.student?.firstName} {a.student?.lastName}</strong></td>
                                                        <td>{a.overallLevel ? <span className="badge badge-primary">{a.overallLevel}</span> : '—'}</td>
                                                        <td>{new Date(a.date).toLocaleDateString()}</td>
                                                        <td>
                                                            <div className="btn-group">
                                                                <button onClick={() => handleEditSkill(a)} className="btn btn-warning btn-sm">{t('gradeBook.editBtn')}</button>
                                                                <button onClick={() => handleDeleteSkill(a._id)} className="btn btn-danger btn-sm">{t('gradeBook.deleteBtn')}</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}>
                            <h3>👈 {t('gradeBook.selectClass')}</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherGradeBook;
