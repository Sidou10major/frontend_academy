import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ManageTeacherRequests = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const adminId = user?.id || user?._id;

    const [activeTab, setActiveTab] = useState('leaves');
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    
    // Action state for leaves
    const [handlingLeaveId, setHandlingLeaveId] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [actionError, setActionError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (activeTab === 'leaves') {
            fetchLeaves();
        } else {
            fetchAvailabilities();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, statusFilter]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const endpoint = statusFilter 
                ? `/teacher-portal/leaves?status=${statusFilter}` 
                : '/teacher-portal/leaves';
            const res = await api.get(endpoint);
            setLeaves(res.data);
            setLoading(false);
        } catch (err) {
            setActionError('Failed to load leave requests.');
            setLoading(false);
        }
    };

    const fetchAvailabilities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/teacher-portal/availabilities');
            setAvailabilities(res.data);
            setLoading(false);
        } catch (err) {
            setActionError('Failed to load teacher availabilities.');
            setLoading(false);
        }
    };

    const handleActionClick = (leaveId) => {
        setHandlingLeaveId(leaveId);
        setRemarks('');
        setActionError('');
        setSuccessMsg('');
    };

    const submitLeaveDecision = async (status) => {
        setActionError('');
        setSuccessMsg('');
        try {
            const res = await api.put(`/teacher-portal/leave/${handlingLeaveId}/approve`, {
                status,
                remarks,
                adminId
            });
            setLeaves(leaves.map(l => l._id === handlingLeaveId ? res.data : l));
            setSuccessMsg(`Leave request successfully ${status.toLowerCase()}!`);
            setHandlingLeaveId(null);
            setRemarks('');
        } catch (err) {
            setActionError(err.response?.data?.error || 'Failed to update leave request status.');
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1050px', margin: '0 auto' }}>
            <h1 className="page-title">🧑‍🏫 {t('adminTeacherRequests.title') || 'Manage Teacher Requests'}</h1>

            {/* Premium Tab Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '10px' }}>
                <button
                    onClick={() => { setActiveTab('leaves'); setActionError(''); setSuccessMsg(''); }}
                    className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontWeight: 600 }}
                >
                    🤒 {t('adminTeacherRequests.tabLeaves') || 'Leave Requests'}
                </button>
                <button
                    onClick={() => { setActiveTab('availabilities'); setActionError(''); setSuccessMsg(''); }}
                    className={`btn ${activeTab === 'availabilities' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontWeight: 600 }}
                >
                    📅 {t('adminTeacherRequests.tabAvailabilities') || 'Teacher Availabilities'}
                </button>
            </div>

            {actionError && <div className="alert alert-danger">{actionError}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {/* TAB 1: LEAVE REQUESTS */}
            {activeTab === 'leaves' && (
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📋 {t('adminTeacherRequests.leavesCardTitle') || 'Incoming Teacher Leave Requests'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter by Status:</label>
                            <select
                                className="form-select"
                                style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto' }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ Loading leaves...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Teacher</th>
                                        <th>Dates Requested</th>
                                        <th>Reason for Leave</th>
                                        <th>Status</th>
                                        <th>Admin Remarks</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                                No leave requests matching the selection found.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.map((l) => (
                                            <tr key={l._id}>
                                                <td>
                                                    <strong>{l.teacher?.firstName} {l.teacher?.lastName}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>{l.teacher?.email}</span>
                                                </td>
                                                <td>
                                                    <strong>{new Date(l.startDate).toLocaleDateString()}</strong> to <br />
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
                                                <td>
                                                    {l.status === 'Pending' ? (
                                                        handlingLeaveId === l._id ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                                                    placeholder="Optional remarks..."
                                                                    value={remarks}
                                                                    onChange={(e) => setRemarks(e.target.value)}
                                                                />
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <button onClick={() => submitLeaveDecision('Approved')} className="btn btn-success btn-sm" style={{ flex: 1 }}>Approve</button>
                                                                    <button onClick={() => submitLeaveDecision('Rejected')} className="btn btn-danger btn-sm" style={{ flex: 1 }}>Reject</button>
                                                                    <button onClick={() => setHandlingLeaveId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleActionClick(l._id)} className="btn btn-primary btn-sm">
                                                                ✍️ Process Request
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Completed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: TEACHER AVAILABILITIES */}
            {activeTab === 'availabilities' && (
                <div className="card">
                    <div className="card-header">📋 {t('adminTeacherRequests.availTitle') || 'Teacher Weekly Availability schedule'}</div>
                    {loading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ Loading weekly schedule...</div>
                    ) : (
                        <div style={{ padding: '20px' }}>
                            {availabilities.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                                    No availability schedule submitted by any teachers yet.
                                </p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                    {availabilities.map((avail) => (
                                        <div key={avail._id} className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>🧑‍🏫</span>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{avail.teacher?.firstName} {avail.teacher?.lastName}</h4>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{avail.teacher?.email}</span>
                                                </div>
                                            </div>
                                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {avail.slots?.length === 0 ? (
                                                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>No slots set</span>
                                                ) : (
                                                    avail.slots?.map((slot, index) => (
                                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                            <strong>{slot.day}</strong>
                                                            <span style={{ color: 'var(--text-secondary)' }}>🕒 {slot.startTime} - {slot.endTime}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManageTeacherRequests;
