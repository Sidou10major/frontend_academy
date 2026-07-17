import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const StudentProgress = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const studentId = user?.id || user?._id;

    const [enrollments, setEnrollments] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [grades, setGrades] = useState([]);
    const [averageData, setAverageData] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [progressReport, setProgressReport] = useState(null);
    const [activeTab, setActiveTab] = useState('grades');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const skillNames = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary', 'pronunciation'];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const enrollmentsRes = await api.get(`/enrollments/student/${studentId}`);
                const validEnrollments = (enrollmentsRes.data || []).filter(e => e && e.session);
                setEnrollments(validEnrollments);
                
                if (validEnrollments.length > 0) {
                    const firstSession = validEnrollments[0].session._id;
                    setSelectedSessionId(firstSession);
                    await fetchSessionSpecificData(firstSession);
                }
                
                // Fetch progress report (earliest vs latest)
                const progressRes = await api.get(`/skill-assessments/student/${studentId}/progress`);
                setProgressReport(progressRes.data);
                
                setLoading(false);
            } catch (err) {
                setError(t('studentProgress.errorLoad'));
                setLoading(false);
            }
        };
        if (studentId) fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    const fetchSessionSpecificData = async (sessionId) => {
        try {
            const [gradesRes, averageRes, assessmentsRes] = await Promise.all([
                api.get(`/grades/student/${studentId}/session/${sessionId}`),
                api.get(`/grades/student/${studentId}/session/${sessionId}/average`),
                api.get(`/skill-assessments/student/${studentId}/session/${sessionId}`)
            ]);
            setGrades(gradesRes.data);
            setAverageData(averageRes.data);
            setAssessments(assessmentsRes.data);
        } catch (err) {
            console.error('Failed to fetch session details');
        }
    };

    const handleSessionChange = async (e) => {
        const sessionId = e.target.value;
        setSelectedSessionId(sessionId);
        if (sessionId) {
            await fetchSessionSpecificData(sessionId);
        } else {
            setGrades([]);
            setAverageData(null);
            setAssessments([]);
        }
    };

    const gradeTypeBadge = (type) => {
        const map = { quiz: 'badge-info', exam: 'badge-danger', oral: 'badge-warning', homework: 'badge-primary', project: 'badge-success', participation: 'badge-primary' };
        return map[type] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('studentProgress.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('studentProgress.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {enrollments.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📈</div>
                    <p>{t('studentProgress.noEnrollments')}</p>
                </div>
            ) : (
                <>
                    {/* Class Selector */}
                    <div className="filter-bar">
                        <div className="filter-group" style={{ flex: 1 }}>
                            <label>{t('studentProgress.selectClass')}</label>
                            <select className="form-select" value={selectedSessionId} onChange={handleSessionChange}>
                                {enrollments.map(e => (
                                    <option key={e.session._id} value={e.session._id}>
                                        {e.session.course?.title} (Level: {e.session.course?.level})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px' }}>
                        {/* LEFT: Session specific details */}
                        <div>
                            <div className="card">
                                <div className="tab-nav">
                                    <button className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => setActiveTab('grades')}>
                                        📊 {t('studentProgress.gradesTab')}
                                    </button>
                                    <button className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>
                                        🎯 {t('studentProgress.skillsTab')}
                                    </button>
                                </div>

                                {activeTab === 'grades' && (
                                    <div>
                                        <h3 className="card-header" style={{ padding: 0 }}>📋 {t('studentProgress.gradesTitle')}</h3>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('studentProgress.colTitle')}</th>
                                                    <th>{t('studentProgress.colType')}</th>
                                                    <th>{t('studentProgress.colScore')}</th>
                                                    <th>{t('studentProgress.colDate')}</th>
                                                    <th>{t('studentProgress.colRemarks')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grades.length === 0 ? (
                                                    <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('studentProgress.noGrades')}</td></tr>
                                                ) : (
                                                    grades.map(g => (
                                                        <tr key={g._id}>
                                                            <td><strong>{g.title}</strong></td>
                                                            <td><span className={`badge ${gradeTypeBadge(g.type)}`}>{t(`gradeBook.type_${g.type}`)}</span></td>
                                                            <td style={{ fontWeight: 600 }}>{g.score}/{g.maxScore}</td>
                                                            <td>{new Date(g.date).toLocaleDateString()}</td>
                                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{g.remarks || '—'}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'skills' && (
                                    <div>
                                        <h3 className="card-header" style={{ padding: 0 }}>🎯 {t('studentProgress.assessmentsTitle')}</h3>
                                        {assessments.length === 0 ? (
                                            <div className="empty-state"><p>{t('studentProgress.noAssessments')}</p></div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {assessments.map(a => (
                                                    <div key={a._id} className="item-card" style={{ padding: '18px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                📅 {new Date(a.date).toLocaleDateString()} · {t('studentProgress.by')} {a.teacher?.firstName} {a.teacher?.lastName}
                                                            </span>
                                                            {a.overallLevel && <span className="badge badge-primary">{t('studentProgress.assessedLevel')}: {a.overallLevel}</span>}
                                                        </div>
                                                        <div className="skill-bar-group" style={{ marginBottom: '12px' }}>
                                                            {skillNames.map(skill => (
                                                                <div key={skill} className="skill-bar">
                                                                    <span className="skill-label" style={{ width: '120px' }}>{t(`gradeBook.skill_${skill}`)}</span>
                                                                    <div className="skill-track">
                                                                        <div className="skill-fill" style={{ width: `${(a.skills[skill] / 5) * 100}%` }} />
                                                                    </div>
                                                                    <span className="skill-value">{a.skills[skill]}/5</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {a.remarks && (
                                                            <div style={{ fontSize: '0.88rem', padding: '10px', background: 'var(--bg-table-stripe)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                                                                <strong>💬 {t('studentProgress.remarks')}:</strong> {a.remarks}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Weighted Averages and General Growth */}
                        <div>
                            {/* Course / Average Box */}
                            <div className="card" style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {t('studentProgress.cohortAverage')}
                                </h3>
                                {averageData && averageData.weightedAverage !== null ? (
                                    <div>
                                        <p style={{ fontSize: '3rem', fontWeight: 800, margin: '10px 0', color: 'var(--primary)' }}>
                                            {averageData.weightedAverage}%
                                        </p>
                                        <span className="badge badge-success">{t('studentProgress.weightedAvg')}</span>
                                        {averageData.typeBreakdown && Object.keys(averageData.typeBreakdown).length > 0 && (
                                            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', textAlign: 'left' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('studentProgress.breakdown')}</h4>
                                                {Object.entries(averageData.typeBreakdown).map(([type, data]) => (
                                                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                                                        <span style={{ textTransform: 'capitalize' }}>{t(`gradeBook.type_${type}`)}</span>
                                                        <strong>{data.average}%</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('studentProgress.noGradesYet')}</p>
                                )}
                            </div>

                            {/* Growth Report */}
                            {progressReport && progressReport.totalAssessments >= 2 && (
                                <div className="card">
                                    <h3 className="card-header" style={{ padding: 0, marginBottom: '16px' }}>📈 {t('studentProgress.growthReport')}</h3>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                        {t('studentProgress.comparingFirstLatest', { count: progressReport.totalAssessments })}
                                    </p>
                                    <div className="skill-bar-group">
                                        {skillNames.map(skill => {
                                            const g = progressReport.growth[skill];
                                            if (!g) return null;
                                            const sign = g.change > 0 ? '+' : '';
                                            const trendClass = g.change > 0 ? 'positive' : g.change < 0 ? 'negative' : 'neutral';
                                            return (
                                                <div key={skill} className="skill-bar">
                                                    <span className="skill-label" style={{ width: '100px', fontSize: '0.8rem' }}>{t(`gradeBook.skill_${skill}`)}</span>
                                                    <div className="skill-track">
                                                        <div className="skill-fill" style={{ width: `${(g.current / 5) * 100}%` }} />
                                                    </div>
                                                    <span className="skill-value" style={{ fontSize: '0.8rem' }}>{g.current}/5</span>
                                                    <span className={`skill-change ${trendClass}`} style={{ fontSize: '0.78rem' }}>
                                                        {sign}{g.change}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentProgress;
