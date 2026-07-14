import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TeacherSelfService = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const userId = user?.id || user?._id;

    const [activeTab, setActiveTab] = useState('availability');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Availability state
    const [availabilitySlots, setAvailabilitySlots] = useState([]);
    const [newSlot, setNewSlot] = useState({ day: 'Monday', startTime: '09:00', endTime: '17:00' });

    // Leave request state
    const [leaves, setLeaves] = useState([]);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });

    // Attendance history state
    const [attendance, setAttendance] = useState([]);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        if (userId) {
            fetchAvailability();
            fetchLeaves();
            fetchAttendance();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchAvailability = async () => {
        try {
            const res = await api.get(`/teacher-portal/availability/${userId}`);
            setAvailabilitySlots(res.data.slots || []);
        } catch (err) {
            console.error('Failed to fetch availability');
        }
    };

    const fetchLeaves = async () => {
        try {
            const res = await api.get(`/teacher-portal/leave/${userId}`);
            setLeaves(res.data);
        } catch (err) {
            console.error('Failed to fetch leaves');
        }
    };

    const fetchAttendance = async () => {
        try {
            const res = await api.get(`/teacher-portal/attendance/${userId}`);
            setAttendance(res.data);
        } catch (err) {
            console.error('Failed to fetch attendance history');
        }
    };

    // Availability Actions
    const handleAddSlot = (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg('');
        // Check if overlaps or same slot exists
        const exists = availabilitySlots.some(s => s.day === newSlot.day && s.startTime === newSlot.startTime && s.endTime === newSlot.endTime);
        if (exists) {
            setError(t('teacherPortal.duplicateSlot') || 'This availability slot already exists.');
            return;
        }
        setAvailabilitySlots([...availabilitySlots, newSlot]);
        setSuccessMsg(t('teacherPortal.slotAddedTemp') || 'Slot added to list. Remember to save changes.');
    };

    const handleRemoveSlot = (index) => {
        setError(''); setSuccessMsg('');
        setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index));
    };

    const handleSaveAvailability = async () => {
        setLoading(true); setError(''); setSuccessMsg('');
        try {
            await api.post('/teacher-portal/availability', {
                teacher: userId,
                slots: availabilitySlots
            });
            setSuccessMsg(t('teacherPortal.availabilitySaved') || 'Availability schedule successfully saved!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save availability schedule');
        } finally {
            setLoading(false);
        }
    };

    // Leave Actions
    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccessMsg('');
        try {
            const res = await api.post('/teacher-portal/leave', {
                teacher: userId,
                ...leaveForm
            });
            setLeaves([res.data, ...leaves]);
            setLeaveForm({ startDate: '', endDate: '', reason: '' });
            setSuccessMsg(t('teacherPortal.leaveRequested') || 'Leave request successfully submitted!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit leave request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 className="page-title">🧑‍🏫 {t('teacherPortal.title') || 'Teacher Self-Service Portal'}</h1>

            {/* Premium Tab Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
                <button
                    onClick={() => { setActiveTab('availability'); setError(''); setSuccessMsg(''); }}
                    className={`btn ${activeTab === 'availability' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontWeight: 600 }}
                >
                    📅 {t('teacherPortal.tabAvailability') || 'Schedule Availability'}
                </button>
                <button
                    onClick={() => { setActiveTab('leaves'); setError(''); setSuccessMsg(''); }}
                    className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontWeight: 600 }}
                >
                    🤒 {t('teacherPortal.tabLeaves') || 'Leave Requests'}
                </button>
                <button
                    onClick={() => { setActiveTab('attendance'); setError(''); setSuccessMsg(''); }}
                    className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontWeight: 600 }}
                >
                    ✅ {t('teacherPortal.tabAttendance') || 'Attendance History'}
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {/* TAB: AVAILABILITY */}
            {activeTab === 'availability' && (
                <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
                    <div className="card">
                        <div className="card-header">➕ {t('teacherPortal.addSlotTitle') || 'Add Availability Slot'}</div>
                        <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
                            <div className="form-group">
                                <label>{t('teacherPortal.labelDay') || 'Day of Week'}</label>
                                <select
                                    className="form-select"
                                    value={newSlot.day}
                                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                                >
                                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('teacherPortal.labelStart') || 'Start Time'}</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={newSlot.startTime}
                                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('teacherPortal.labelEnd') || 'End Time'}</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={newSlot.endTime}
                                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-success" style={{ marginTop: '10px' }}>
                                ➕ {t('teacherPortal.addSlotBtn') || 'Add Slot'}
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>📋 {t('teacherPortal.availabilitySlots') || 'Your Availability Schedule'}</span>
                            <button
                                onClick={handleSaveAvailability}
                                disabled={loading}
                                className="btn btn-primary btn-sm"
                            >
                                {loading ? '...' : `💾 ${t('teacherPortal.saveBtn') || 'Save Availability'}`}
                            </button>
                        </div>
                        <div style={{ padding: '15px' }}>
                            {availabilitySlots.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                                    {t('teacherPortal.noSlots') || 'No availability slots added yet. Add slots on the left and save.'}
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {availabilitySlots.map((slot, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: 'var(--bg-body)',
                                                padding: '10px 16px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border)'
                                            }}
                                        >
                                            <div>
                                                <strong>{slot.day}</strong>
                                                <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>
                                                    🕒 {slot.startTime} - {slot.endTime}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSlot(index)}
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '4px 8px', color: 'var(--danger)' }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: LEAVES */}
            {activeTab === 'leaves' && (
                <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
                    <div className="card">
                        <div className="card-header">🤒 {t('teacherPortal.requestLeaveTitle') || 'Submit Leave Request'}</div>
                        <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
                            <div className="form-group">
                                <label>{t('teacherPortal.leaveStart') || 'Start Date'}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={leaveForm.startDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('teacherPortal.leaveEnd') || 'End Date'}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={leaveForm.endDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('teacherPortal.leaveReason') || 'Reason for Leave'}</label>
                                <textarea
                                    className="form-input"
                                    rows="4"
                                    value={leaveForm.reason}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    placeholder="Medical checkup, personal holiday, etc..."
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                                🚀 {t('teacherPortal.submitLeaveBtn') || 'Submit Request'}
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <div className="card-header">📋 {t('teacherPortal.myLeavesTitle') || 'Your Leave Request History'}</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('teacherPortal.colDates') || 'Dates'}</th>
                                        <th>{t('teacherPortal.colReason') || 'Reason'}</th>
                                        <th>{t('teacherPortal.colStatus') || 'Status'}</th>
                                        <th>{t('teacherPortal.colRemarks') || 'Admin Remarks'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                                {t('teacherPortal.noLeaves') || 'No leave requests recorded yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.map((l) => (
                                            <tr key={l._id}>
                                                <td>
                                                    <strong>{new Date(l.startDate).toLocaleDateString()}</strong> - <br />
                                                    <strong>{new Date(l.endDate).toLocaleDateString()}</strong>
                                                </td>
                                                <td>{l.reason}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        l.status === 'Approved' ? 'badge-success' :
                                                        l.status === 'Rejected' ? 'badge-danger' :
                                                        'badge-warning'
                                                    }`}>
                                                        {l.status}
                                                    </span>
                                                </td>
                                                <td>{l.remarks || '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ATTENDANCE */}
            {activeTab === 'attendance' && (
                <div className="card">
                    <div className="card-header">📊 {t('teacherPortal.attendanceTitle') || 'Your Attendance History'}</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('teacherPortal.colDate') || 'Date'}</th>
                                    <th>{t('teacherPortal.colSession') || 'Class Session / Course'}</th>
                                    <th>{t('teacherPortal.colAttStatus') || 'Attendance Status'}</th>
                                    <th>{t('teacherPortal.colRemarks') || 'Remarks'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                            {t('teacherPortal.noAttendance') || 'No attendance history recorded yet.'}
                                        </td>
                                    </tr>
                                ) : (
                                    attendance.map((a) => (
                                        <tr key={a._id}>
                                            <td><strong>{new Date(a.date).toLocaleDateString()}</strong></td>
                                            <td>
                                                <strong>{a.session?.course?.title || 'Unknown Course'}</strong>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>
                                                    {a.session?.course?.language} ({a.session?.course?.level})
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    a.status === 'Present' ? 'badge-success' :
                                                    a.status === 'Late' ? 'badge-warning' :
                                                    'badge-danger'
                                                }`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td>{a.remarks || '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherSelfService;
