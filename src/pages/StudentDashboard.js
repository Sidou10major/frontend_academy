import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import SessionMaterials from '../components/SessionMaterials';

const StudentDashboard = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [enrollments, setEnrollments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStudentData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStudentData = async () => {
        try {
            const studentId = user.id || user._id;
            const [enrollmentsRes, paymentsRes] = await Promise.all([
                api.get(`/enrollments/student/${studentId}`),
                api.get(`/payments/student/${studentId}`)
            ]);
            setEnrollments(enrollmentsRes.data);
            setPayments(paymentsRes.data);
            setLoading(false);
        } catch (err) { setError('Failed to load your student profile.'); setLoading(false); }
    };

    const paymentBadge = (status) => {
        const map = { 'Paid': 'badge-success', 'Overdue': 'badge-danger', 'Pending': 'badge-warning' };
        return map[status] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('studentDash.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('studentDash.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', marginTop: '8px' }}>

                {/* LEFT: My Classes */}
                <div>
                    <div className="card-header" style={{ marginBottom: '16px' }}>📚 {t('studentDash.myClasses')}</div>
                    {enrollments.length === 0 ? (
                        <div className="empty-state"><div className="icon">📚</div><p>{t('studentDash.noClasses')}</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {enrollments.map(enrollment => {
                                const session = enrollment.session;
                                if (!session) return null;
                                return (
                                    <div key={enrollment._id} className="item-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 4px 0', color: 'var(--primary)' }}>{session.course?.title}</h3>
                                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                                    {t('studentDash.instructor')} <strong style={{ color: 'var(--text-primary)' }}>{session.teacher?.firstName} {session.teacher?.lastName}</strong>
                                                </p>
                                            </div>
                                            <span className={`badge ${enrollment.status === 'Active' ? 'badge-success' : 'badge-primary'}`}>{enrollment.status}</span>
                                        </div>

                                        <div style={{ background: 'var(--bg-table-stripe)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('studentDash.weeklySchedule')}</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                                {session.schedule.map((s, i) => (
                                                    <li key={i}>{s.day}s — {s.startTime} to {s.endTime}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {session.meetingLink ? (
                                            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                                                🔗 {t('studentDash.joinClass')}
                                            </a>
                                        ) : (
                                            <div className="alert alert-warning" style={{ marginBottom: '12px', padding: '8px 12px', fontSize: '0.85rem' }}>
                                                {t('studentDash.noLink')}
                                            </div>
                                        )}

                                        <SessionMaterials sessionId={session._id} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT: Financial Ledger */}
                <div>
                    <div className="card-header" style={{ marginBottom: '16px' }}>💳 {t('studentDash.tuitionTitle')}</div>
                    <div className="card">
                        {payments.length === 0 ? (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('studentDash.noPayments')}</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {payments.map(payment => (
                                    <div key={payment._id} style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{payment.amount} {payment.currency || 'DZD'}</span>
                                            <span className={`badge ${paymentBadge(payment.status)}`}>{payment.status}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <strong>{t('studentDash.due')}</strong> {new Date(payment.dueDate).toLocaleDateString()}
                                        </div>
                                        {payment.status === 'Paid' && payment.paymentDate && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--success-text)', marginTop: '4px' }}>
                                                ✅ {t('studentDash.paidOn')} {new Date(payment.paymentDate).toLocaleDateString()}
                                            </div>
                                        )}
                                        {payment.status !== 'Paid' && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--danger-text)', marginTop: '4px' }}>
                                                ⚠️ {t('studentDash.pleasePay')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Placement Test Card */}
                    <div className="card-header" style={{ marginBottom: '16px', marginTop: '24px' }}>📝 {t('studentDash.placementTitle') || 'Placement Test'}</div>
                    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {t('studentDash.placementDesc') || 'Want to test your proficiency level again? Try our online placement test.'}
                        </p>
                        <a href="/placement-test" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', textAlign: 'center' }}>
                            ✍️ {t('studentDash.placementBtn') || 'Take Placement Test'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;