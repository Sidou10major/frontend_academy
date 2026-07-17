import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManageGradesAdmin = () => {
    const { t } = useTranslation();
    const [grades, setGrades] = useState([]);
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    
    // Filters
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedType, setSelectedType] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Average Stats
    const [averageStats, setAverageStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    const gradeTypes = ['quiz', 'exam', 'oral', 'homework', 'project', 'participation'];

    useEffect(() => {
        fetchMetadata();
        fetchGrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStudent, selectedSession, selectedType]);

    // Fetch student-session average if both are selected
    useEffect(() => {
        if (selectedStudent && selectedSession) {
            fetchAverageStats();
        } else {
            setAverageStats(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStudent, selectedSession]);

    const fetchMetadata = async () => {
        try {
            const [studentsRes, sessionsRes] = await Promise.all([
                api.get('/users?role=student'),
                api.get('/sessions')
            ]);
            setStudents(studentsRes.data);
            setSessions(sessionsRes.data);
        } catch (err) {
            console.error('Failed to load filter metadata.');
        }
    };

    const fetchGrades = async () => {
        try {
            setLoading(true);
            let params = {};
            if (selectedStudent) params.student = selectedStudent;
            if (selectedSession) params.session = selectedSession;
            if (selectedType) params.type = selectedType;

            const res = await api.get('/grades', { params });
            setGrades(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to retrieve student grades.');
            setLoading(false);
        }
    };

    const fetchAverageStats = async () => {
        try {
            setStatsLoading(true);
            const res = await api.get(`/grades/student/${selectedStudent}/session/${selectedSession}/average`);
            setAverageStats(res.data);
            setStatsLoading(false);
        } catch (err) {
            console.error('Failed to calculate average stats');
            setStatsLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">📝 {t('adminGrades.title') || 'Student Progress & Grades Directory'}</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* FILTER PANEL */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">🔍 Filter Student Grades</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', padding: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Student</label>
                        <select
                            className="form-select"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                        >
                            <option value="">All Students</option>
                            {students.map(s => (
                                <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Class Session / Cohort</label>
                        <select
                            className="form-select"
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                        >
                            <option value="">All Sessions</option>
                            {sessions.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.course?.title} - {s.course?.language} ({s.course?.level})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Grade Type</label>
                        <select
                            className="form-select"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {gradeTypes.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* STATS OVERVIEW FOR INDIVIDUAL STUDENT-SESSION */}
            {selectedStudent && selectedSession && averageStats && (
                <div className="card" style={{ marginBottom: '24px', border: '1.5px solid var(--primary)', background: 'var(--primary-glow)' }}>
                    <div className="card-header" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        📈 Progress Summary Report
                    </div>
                    <div style={{ padding: '20px' }}>
                        {statsLoading ? (
                            <p style={{ textAlign: 'center', margin: 0 }}>Calculating average metrics...</p>
                        ) : averageStats.average === null && averageStats.gradeCount === 0 ? (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No grades recorded for this student in this session.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Weighted Average</span>
                                    <h2 style={{ fontSize: '2.8rem', margin: '10px 0', color: 'var(--primary)' }}>
                                        {averageStats.weightedAverage}%
                                    </h2>
                                    <span className="badge badge-info">{averageStats.gradeCount} Grade Entries</span>
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Averages by Category</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {Object.entries(averageStats.typeBreakdown || {}).map(([type, details]) => (
                                            <div key={type} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', minWidth: '110px' }}>
                                                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                                    {type}
                                                </strong>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                                    {details.average}%
                                                </span>
                                                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                    {details.count} entries
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* GRADES TABLE */}
            <div className="card">
                <div className="card-header">📋 Grades Records List ({grades.length})</div>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ Loading grades table...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class Session / Course</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Score</th>
                                    <th>Weight</th>
                                    <th>Remarks</th>
                                    <th>Graded By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                            No grade entries found matching the filter options.
                                        </td>
                                    </tr>
                                ) : (
                                    grades.map((g) => (
                                        <tr key={g._id}>
                                            <td>
                                                <strong>{g.student?.firstName} {g.student?.lastName}</strong>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>{g.student?.email}</span>
                                            </td>
                                            <td>
                                                <strong>{g.session?.course?.title || 'Unknown Course'}</strong>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>
                                                    {g.session?.course?.language} ({g.session?.course?.level})
                                                </span>
                                            </td>
                                            <td>{g.title}</td>
                                            <td>
                                                <span className={`badge ${
                                                    g.type === 'exam' ? 'badge-danger' :
                                                    g.type === 'quiz' ? 'badge-warning' :
                                                    g.type === 'homework' ? 'badge-info' :
                                                    'badge-success'
                                                }`}>
                                                    {g.type}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{g.score}</strong> / {g.maxScore}
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    ({Math.round((g.score / g.maxScore) * 100)}%)
                                                </span>
                                            </td>
                                            <td>x{g.weight}</td>
                                            <td>{g.remarks || '—'}</td>
                                            <td>{g.teacher?.firstName} {g.teacher?.lastName}</td>
                                            <td>{new Date(g.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageGradesAdmin;
