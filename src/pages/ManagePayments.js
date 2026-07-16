import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ManagePayments = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [editingPaymentId, setEditingPaymentId] = useState(null);

    const [formData, setFormData] = useState({ student: '', session: '', amount: '', dueDate: '', currency: 'DZD' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [paymentsRes, sessionsRes, usersRes] = await Promise.all([
                api.get('/payments'), api.get('/sessions'), api.get('/users?role=student')
            ]);
            setPayments(paymentsRes.data); setSessions(sessionsRes.data); setStudents(usersRes.data);
            if (usersRes.data.length > 0 && sessionsRes.data.length > 0) {
                setFormData(prev => ({ ...prev, student: usersRes.data[0]._id, session: sessionsRes.data[0]._id }));
            }
            setLoading(false);
        } catch (err) { setError('Failed to load financial data.'); setLoading(false); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'student') {
            const selectedStudent = students.find(s => s._id === value);
            setFormData(prev => ({
                ...prev,
                student: value,
                currency: selectedStudent?.currency || 'DZD'
            }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleGenerateFee = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg('');
        try {
            if (editingPaymentId) {
                await api.put(`/payments/${editingPaymentId}`, formData);
                setSuccessMsg(t('managePayments.successUpdate'));
                setEditingPaymentId(null);
            } else {
                await api.post('/payments', formData);
                setSuccessMsg(t('managePayments.successCreate'));
            }
            const updatedPayments = await api.get('/payments');
            setPayments(updatedPayments.data);
            setFormData({ student: students.length > 0 ? students[0]._id : '', session: sessions.length > 0 ? sessions[0]._id : '', amount: '', dueDate: '', currency: 'DZD' });
        } catch (err) { setError(err.response?.data?.error || 'Failed to save fee.'); }
    };

    const handleEdit = (payment) => {
        setEditingPaymentId(payment._id);
        setFormData({ student: payment.student?._id || '', session: payment.session?._id || '', amount: payment.amount, dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '', currency: payment.currency || 'DZD' });
        setError(''); setSuccessMsg('');
    };

    const handleCancelEdit = () => {
        setEditingPaymentId(null);
        setFormData({ student: students.length > 0 ? students[0]._id : '', session: sessions.length > 0 ? sessions[0]._id : '', amount: '', dueDate: '', currency: 'DZD' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('managePayments.confirmDelete'))) return;
        setError(''); setSuccessMsg('');
        try {
            await api.delete(`/payments/${id}`);
            setSuccessMsg(t('managePayments.successDelete'));
            setPayments(payments.filter(p => p._id !== id));
            if (editingPaymentId === id) handleCancelEdit();
        } catch (err) { setError(err.response?.data?.error || 'Failed to delete payment.'); }
    };

    const handleConfirmPayment = async (paymentId) => {
        if (!window.confirm(t('managePayments.confirmPay'))) return;
        setError(''); setSuccessMsg('');
        try {
            await api.put(`/payments/${paymentId}/confirm`, { adminId: user.id || user._id, remarks: 'Confirmed via Admin Dashboard' });
            setSuccessMsg(t('managePayments.successConfirm'));
            const updatedPayments = await api.get('/payments');
            setPayments(updatedPayments.data);
        } catch (err) { setError(err.response?.data?.error || 'Failed to confirm payment.'); }
    };

    const handleEnforceBlocks = async () => {
        if (!window.confirm(t('managePayments.confirmBlock'))) return;
        setError(''); setSuccessMsg('');
        try {
            const response = await api.put('/payments/enforce-blocks');
            setSuccessMsg(response.data.message);
            const updatedPayments = await api.get('/payments');
            setPayments(updatedPayments.data);
        } catch (err) { setError('Failed to run the enforcement protocol.'); }
    };

    const paymentBadge = (status) => {
        const map = { 'Paid': 'badge-success', 'Overdue': 'badge-danger', 'Pending': 'badge-warning' };
        return map[status] || 'badge-primary';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('managePayments.loading')}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>{t('managePayments.title')}</h1>
                <button onClick={handleEnforceBlocks} className="btn btn-danger">
                    🚨 {t('managePayments.enforceBtn')}
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {/* FORM CARD */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">
                    {editingPaymentId ? `✏️ ${t('managePayments.editTitle')}` : `💰 ${t('managePayments.createTitle')}`}
                </div>
                <form onSubmit={handleGenerateFee} className="form-grid">
                    <div className="form-group">
                        <label>{t('managePayments.studentLabel')}</label>
                        <select name="student" className="form-select" value={formData.student} onChange={handleInputChange} required>
                            {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('managePayments.sessionLabel')}</label>
                        <select name="session" className="form-select" value={formData.session} onChange={handleInputChange} required>
                            {sessions.map(s => <option key={s._id} value={s._id}>{s.course?.title} (Starts {new Date(s.startDate).toLocaleDateString()})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('managePayments.amountLabel')}</label>
                        <input type="number" name="amount" className="form-input" value={formData.amount} onChange={handleInputChange} min="0" required />
                    </div>
                    <div className="form-group">
                        <label>{t('managePayments.currencyLabel') || 'Currency'}</label>
                        <select name="currency" className="form-select" value={formData.currency} onChange={handleInputChange} required>
                            <option value="DZD">DZD</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('managePayments.dueDateLabel')}</label>
                        <input type="date" name="dueDate" className="form-input" value={formData.dueDate} onChange={handleInputChange} required />
                    </div>
                    <div className="full-width btn-group">
                        <button type="submit" className={`btn ${editingPaymentId ? 'btn-warning' : 'btn-primary'}`} style={{ flex: 1 }}>
                            {editingPaymentId ? t('managePayments.updateBtn') : t('managePayments.addBtn')}
                        </button>
                        {editingPaymentId && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">{t('managePayments.cancelBtn')}</button>
                        )}
                    </div>
                </form>
            </div>

            {/* PAYMENT LEDGER */}
            <div className="card-header" style={{ marginBottom: '16px' }}>📒 {t('managePayments.ledgerTitle')}</div>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('managePayments.colStudent')}</th>
                            <th>{t('managePayments.colSession')}</th>
                            <th>{t('managePayments.colAmount')}</th>
                            <th>{t('managePayments.colDueDate')}</th>
                            <th>{t('managePayments.colStatus')}</th>
                            <th>{t('managePayments.colAction')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('managePayments.noPayments')}</td></tr>
                        ) : (
                            payments.map((p) => (
                                <tr key={p._id}>
                                    <td><strong>{p.student?.firstName} {p.student?.lastName}</strong></td>
                                    <td>{p.session?.course?.title || 'Unknown Course'}</td>
                                    <td style={{ fontWeight: 600 }}>{p.amount} {p.currency || 'DZD'}</td>
                                    <td>{new Date(p.dueDate).toLocaleDateString()}</td>
                                    <td><span className={`badge ${paymentBadge(p.status)}`}>{t(`managePayments.${p.status.toLowerCase()}Badge`)}</span></td>
                                    <td>
                                        <div className="btn-group">
                                            {p.status !== 'Paid' && (
                                                <button onClick={() => handleConfirmPayment(p._id)} className="btn btn-success btn-sm">{t('managePayments.markPaidBtn')}</button>
                                            )}
                                            {p.status === 'Paid' && <span className="badge badge-success">{t('managePayments.confirmedLabel')}</span>}
                                            <button onClick={() => handleEdit(p)} className="btn btn-warning btn-sm">{t('managePayments.editBtn')}</button>
                                            <button onClick={() => handleDelete(p._id)} className="btn btn-danger btn-sm">{t('managePayments.deleteBtn')}</button>
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

export default ManagePayments;