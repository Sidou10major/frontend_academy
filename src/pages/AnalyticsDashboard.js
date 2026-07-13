import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const AnalyticsDashboard = () => {
    const { t } = useTranslation();
    const [overview, setOverview] = useState(null);
    const [revenueTrends, setRevenueTrends] = useState([]);
    const [enrollmentTrends, setEnrollmentTrends] = useState([]);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [courseStats, setCourseStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter state
    const [groupBy, setGroupBy] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAll = async () => {
        try {
            const [overviewRes, courseRes] = await Promise.all([
                api.get('/analytics/overview'),
                api.get('/analytics/courses')
            ]);
            setOverview(overviewRes.data);
            setCourseStats(courseRes.data);
            await fetchTrends();
            setLoading(false);
        } catch (err) { setError(t('analytics.errorLoad')); setLoading(false); }
    };

    const fetchTrends = async () => {
        try {
            const params = new URLSearchParams();
            params.set('groupBy', groupBy);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            const q = params.toString();

            const [revRes, enrRes, attRes] = await Promise.all([
                api.get(`/analytics/revenue?${q}`),
                api.get(`/analytics/enrollments?${q}`),
                api.get(`/analytics/attendance?${q}`)
            ]);
            setRevenueTrends(revRes.data);
            setEnrollmentTrends(enrRes.data);
            setAttendanceStats(attRes.data);
        } catch (err) { console.error('Failed to fetch trends'); }
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchTrends();
    };

    const handleExportCSV = async (type) => {
        try {
            const params = new URLSearchParams();
            params.set('type', type);
            params.set('groupBy', groupBy);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await api.get(`/analytics/export?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) { setError(t('analytics.errorExport')); }
    };

    // Compute max for chart scaling
    const getMaxValue = (data, key) => {
        if (!data || data.length === 0) return 1;
        return Math.max(...data.map(d => d[key] || 0), 1);
    };

    if (loading) return (
        <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ⏳ {t('analytics.loading')}
        </div>
    );

    const revenueMax = getMaxValue(revenueTrends, 'totalRevenue');
    const enrollmentMax = getMaxValue(enrollmentTrends, 'newEnrollments');

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('analytics.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* OVERVIEW STAT CARDS */}
            {overview && (
                <div className="stat-grid">
                    <div className="stat-card primary">
                        <h3>{t('analytics.totalStudents')}</h3>
                        <p className="metric">{overview.totalStudents}</p>
                    </div>
                    <div className="stat-card info">
                        <h3>{t('analytics.totalTeachers')}</h3>
                        <p className="metric">{overview.totalTeachers}</p>
                    </div>
                    <div className="stat-card success">
                        <h3>{t('analytics.activeCourses')}</h3>
                        <p className="metric">{overview.activeCourses}</p>
                    </div>
                    <div className="stat-card warning">
                        <h3>{t('analytics.activeSessions')}</h3>
                        <p className="metric">{overview.activeSessions}</p>
                    </div>
                    <div className="stat-card danger">
                        <h3>{t('analytics.totalRevenue')}</h3>
                        <p className="metric">${overview.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="stat-card info">
                        <h3>{t('analytics.pendingPayments')}</h3>
                        <p className="metric">{overview.pendingPayments}</p>
                    </div>
                </div>
            )}

            {/* FILTERS */}
            <form className="filter-bar" onSubmit={handleApplyFilters}>
                <div className="filter-group">
                    <label>{t('analytics.groupBy')}</label>
                    <select className="form-select" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{ width: 'auto' }}>
                        <option value="day">{t('analytics.day')}</option>
                        <option value="week">{t('analytics.week')}</option>
                        <option value="month">{t('analytics.month')}</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>{t('analytics.startDate')}</label>
                    <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 'auto' }} />
                </div>
                <div className="filter-group">
                    <label>{t('analytics.endDate')}</label>
                    <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 'auto' }} />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">🔍 {t('analytics.apply')}</button>
            </form>

            {/* REVENUE CHART */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>💰 {t('analytics.revenueTrends')}</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleExportCSV('revenue')}>
                        📥 {t('analytics.exportCSV')}
                    </button>
                </div>
                {revenueTrends.length === 0 ? (
                    <div className="empty-state"><p>{t('analytics.noData')}</p></div>
                ) : (
                    <div className="bar-chart">
                        {revenueTrends.map((item, i) => (
                            <div key={i} className="bar-chart-col">
                                <div
                                    className="bar-chart-bar"
                                    style={{ height: `${(item.totalRevenue / revenueMax) * 100}%` }}
                                >
                                    <div className="bar-tooltip">${item.totalRevenue.toLocaleString()}</div>
                                </div>
                                <div className="bar-chart-label">{item.period}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ENROLLMENT CHART */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📈 {t('analytics.enrollmentTrends')}</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleExportCSV('enrollments')}>
                        📥 {t('analytics.exportCSV')}
                    </button>
                </div>
                {enrollmentTrends.length === 0 ? (
                    <div className="empty-state"><p>{t('analytics.noData')}</p></div>
                ) : (
                    <div className="bar-chart">
                        {enrollmentTrends.map((item, i) => (
                            <div key={i} className="bar-chart-col">
                                <div
                                    className="bar-chart-bar accent"
                                    style={{ height: `${(item.newEnrollments / enrollmentMax) * 100}%` }}
                                >
                                    <div className="bar-tooltip">{item.newEnrollments}</div>
                                </div>
                                <div className="bar-chart-label">{item.period}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ATTENDANCE BREAKDOWN */}
            <div className="card">
                <div className="card-header">✅ {t('analytics.attendanceBreakdown')}</div>
                {!attendanceStats || attendanceStats.total === 0 ? (
                    <div className="empty-state"><p>{t('analytics.noData')}</p></div>
                ) : (
                    <>
                        <div className="breakdown-bar">
                            {['Present', 'Late', 'Absent', 'Excused'].map(status => {
                                const data = attendanceStats.breakdown[status];
                                if (!data || data.percentage === 0) return null;
                                return (
                                    <div
                                        key={status}
                                        className={`breakdown-segment ${status.toLowerCase()}`}
                                        style={{ width: `${data.percentage}%` }}
                                        title={`${status}: ${data.percentage}%`}
                                    >
                                        {data.percentage > 8 ? `${data.percentage}%` : ''}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                            {['Present', 'Late', 'Absent', 'Excused'].map(status => {
                                const data = attendanceStats.breakdown[status];
                                if (!data) return null;
                                const colors = { Present: 'var(--success)', Late: 'var(--warning)', Absent: 'var(--danger)', Excused: 'var(--info)' };
                                return (
                                    <span key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status] }} />
                                        {t(`analytics.${status.toLowerCase()}`)} — {data.count} ({data.percentage}%)
                                    </span>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* COURSE PERFORMANCE TABLE */}
            <div className="card">
                <div className="card-header">📚 {t('analytics.coursePerformance')}</div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('analytics.colCourse')}</th>
                                <th>{t('analytics.colLanguage')}</th>
                                <th>{t('analytics.colLevel')}</th>
                                <th>{t('analytics.colSessions')}</th>
                                <th>{t('analytics.colEnrollments')}</th>
                                <th>{t('analytics.colRevenue')}</th>
                                <th>{t('analytics.colAttendance')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courseStats.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('analytics.noData')}</td></tr>
                            ) : (
                                courseStats.map((cs) => (
                                    <tr key={cs.course._id}>
                                        <td><strong>{cs.course.title}</strong></td>
                                        <td>{cs.course.language}</td>
                                        <td><span className="badge badge-primary">{cs.course.level}</span></td>
                                        <td>{cs.activeSessions}</td>
                                        <td>{cs.activeEnrollments}</td>
                                        <td style={{ fontWeight: 600 }}>${cs.totalRevenue.toLocaleString()}</td>
                                        <td>
                                            {cs.attendanceRate !== null ? (
                                                <span className={`badge ${cs.attendanceRate >= 80 ? 'badge-success' : cs.attendanceRate >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                                                    {cs.attendanceRate}%
                                                </span>
                                            ) : (
                                                <span className="badge badge-info">{t('analytics.noData')}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
