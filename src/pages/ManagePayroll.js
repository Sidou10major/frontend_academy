import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManagePayroll = () => {
    const { t } = useTranslation();
    const [teachers, setTeachers] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form inputs for calculator
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    
    // Calculation result
    const [calculation, setCalculation] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [teachersRes, payrollsRes] = await Promise.all([
                api.get('/users?role=teacher'),
                api.get('/payroll')
            ]);
            setTeachers(teachersRes.data);
            setPayrolls(payrollsRes.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load initial payroll data.');
            setLoading(false);
        }
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        if (!selectedTeacher || !periodStart || !periodEnd) {
            setError('Please select a teacher, start date, and end date.');
            return;
        }

        setCalculating(true);
        setError('');
        setSuccessMsg('');
        setCalculation(null);

        try {
            const res = await api.post('/payroll/calculate', {
                teacherId: selectedTeacher,
                periodStart,
                periodEnd
            });
            setCalculation(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to calculate hours and pay.');
        } finally {
            setCalculating(false);
        }
    };

    const handleGenerateSlip = async () => {
        if (!calculation) return;
        setError('');
        setSuccessMsg('');

        try {
            const res = await api.post('/payroll', {
                teacher: calculation.teacherId,
                periodStart,
                periodEnd,
                totalHours: calculation.totalHours,
                hourlyRate: calculation.hourlyRate,
                calculatedPay: calculation.calculatedPay,
                remarks
            });

            // Update ledger list
            const existingIndex = payrolls.findIndex(p => p._id === res.data._id);
            if (existingIndex > -1) {
                const updated = [...payrolls];
                updated[existingIndex] = res.data;
                setPayrolls(updated);
            } else {
                setPayrolls([res.data, ...payrolls]);
            }

            setSuccessMsg('Payroll slip successfully created/updated in ledger!');
            setCalculation(null);
            setRemarks('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate payroll slip.');
        }
    };

    const handleMarkPaid = async (id) => {
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.put(`/payroll/${id}/pay`);
            setPayrolls(payrolls.map(p => p._id === id ? res.data : p));
            setSuccessMsg('Payroll record marked as PAID successfully.');
        } catch (err) {
            setError('Failed to process payment confirmation.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this payroll record?')) return;
        setError('');
        setSuccessMsg('');
        try {
            await api.delete(`/payroll/${id}`);
            setPayrolls(payrolls.filter(p => p._id !== id));
            setSuccessMsg('Payroll record successfully deleted.');
        } catch (err) {
            setError('Failed to delete payroll record.');
        }
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ Loading payroll module...</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">💰 {t('payroll.title') || 'Salary & Payroll Tracker'}</h1>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: '32px', marginBottom: '40px' }}>
                {/* Payroll Calculator Panel */}
                <div className="card">
                    <div className="card-header">📊 {t('payroll.calcTitle') || 'Run Pay Calculator'}</div>
                    <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
                        <div className="form-group">
                            <label>{t('payroll.selectTeacher') || 'Select Instructor'}</label>
                            <select
                                className="form-select"
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                required
                            >
                                <option value="">-- Choose teacher --</option>
                                {teachers.map(t => (
                                    <option key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('payroll.periodStart') || 'Start Date'}</label>
                            <input
                                type="date"
                                className="form-input"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('payroll.periodEnd') || 'End Date'}</label>
                            <input
                                type="date"
                                className="form-input"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                            {calculating ? 'Calculating...' : `⚙️ ${t('payroll.calculateBtn') || 'Calculate Hours & Pay'}`}
                        </button>
                    </form>
                </div>

                {/* Calculation Summary / Slip Draft */}
                <div className="card">
                    <div className="card-header">📋 {t('payroll.draftTitle') || 'Payroll Slip Draft'}</div>
                    <div style={{ padding: '20px' }}>
                        {!calculation ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                                {t('payroll.noCalc') || 'Select parameters and click Calculate on the left to review teacher pay hours.'}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Instructor</div>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{calculation.teacherName}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Attended Sessions</div>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{calculation.attendancesCount} classes</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Working Hours</div>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{calculation.totalHours.toFixed(1)} hrs</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculated Pay ({calculation.hourlyRate}/hr)</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--info-text)' }}>{calculation.calculatedPay.toFixed(2)} USD</div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Add Remarks / Notes</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Bonus, travel expense coverage, etc..."
                                    />
                                </div>

                                <button onClick={handleGenerateSlip} className="btn btn-success">
                                    📜 {t('payroll.generateBtn') || 'Confirm & Save Slip to Ledger'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payroll History Ledger */}
            <div className="card">
                <div className="card-header">📜 {t('payroll.ledgerTitle') || 'Salary Payroll Ledger'}</div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('payroll.colTeacher') || 'Teacher'}</th>
                                <th>{t('payroll.colPeriod') || 'Period'}</th>
                                <th>{t('payroll.colHours') || 'Hours'}</th>
                                <th>{t('payroll.colRate') || 'Rate'}</th>
                                <th>{t('payroll.colPay') || 'Calculated Pay'}</th>
                                <th>{t('payroll.colStatus') || 'Status'}</th>
                                <th>{t('payroll.colActions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                        No payroll history found in ledger.
                                    </td>
                                </tr>
                            ) : (
                                payrolls.map((p) => (
                                    <tr key={p._id}>
                                        <td>
                                            <strong>{p.teacher?.firstName} {p.teacher?.lastName}</strong>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block' }}>
                                                {p.teacher?.email}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(p.periodStart).toLocaleDateString()} - <br />
                                            {new Date(p.periodEnd).toLocaleDateString()}
                                        </td>
                                        <td>{p.totalHours?.toFixed(1)} hrs</td>
                                        <td>{p.hourlyRate} USD/hr</td>
                                        <td><strong>{p.calculatedPay?.toFixed(2)} USD</strong></td>
                                        <td>
                                            <span className={`badge ${p.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                                {p.status}
                                            </span>
                                            {p.paymentDate && (
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                    Paid: {new Date(p.paymentDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                {p.status === 'Draft' && (
                                                    <button onClick={() => handleMarkPaid(p._id)} className="btn btn-success btn-sm">
                                                        💸 Pay
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(p._id)} className="btn btn-secondary btn-sm">
                                                    🗑️ Delete
                                                </button>
                                            </div>
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

export default ManagePayroll;
