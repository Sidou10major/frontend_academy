import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const StudentPayments = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await api.get(`/payments/student/${user.id || user._id}`);
                setPayments(response.data);
                setLoading(false);
            } catch (err) { setError('Failed to load your payment ledger.'); setLoading(false); }
        };
        fetchPayments();
    }, [user]);

    const paymentBadge = (status) => {
        const map = { 'Paid': 'badge-success', 'Overdue': 'badge-danger', 'Pending': 'badge-warning' };
        return map[status] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('studentPayments.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="page-title">{t('studentPayments.title')}</h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {payments.length === 0 ? (
                <div className="empty-state"><div className="icon">💳</div><p>{t('studentPayments.noPayments')}</p></div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('studentPayments.colSession')}</th>
                                <th>{t('studentPayments.colAmount')}</th>
                                <th>{t('studentPayments.colDueDate')}</th>
                                <th>{t('studentPayments.colStatus')}</th>
                                <th>{t('studentPayments.colAction')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(payment => (
                                <tr key={payment._id}>
                                    <td><strong>{payment.session?.course?.title || 'Language Course'}</strong></td>
                                    <td style={{ fontWeight: 600, fontSize: '1.05rem' }}>{payment.amount} {payment.currency || 'DZD'}</td>
                                    <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${paymentBadge(payment.status)}`}>
                                            {t(`studentPayments.${payment.status.toLowerCase()}Badge`)}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.88rem' }}>
                                        {payment.status === 'Paid' ? (
                                            <span style={{ color: 'var(--success-text)' }}>
                                                ✅ {t('studentPayments.paidLabel')} {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>
                                                ⚠️ {t('studentPayments.pleasePayLabel')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentPayments;