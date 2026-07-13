import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const ManageCertificates = () => {
    const { t } = useTranslation();
    const [certificates, setCertificates] = useState([]);
    const [students, setStudents] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedEnrollment, setSelectedEnrollment] = useState('');
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            const [certsRes, usersRes] = await Promise.all([
                api.get('/certificates'),
                api.get('/users?role=student')
            ]);
            setCertificates(certsRes.data);
            setStudents(usersRes.data);
            if (usersRes.data.length > 0) {
                setSelectedStudent(usersRes.data[0]._id);
                fetchStudentEnrollments(usersRes.data[0]._id);
            }
            setLoading(false);
        } catch (err) {
            setError(t('certificates.errorLoad') || 'Failed to load certificate data.');
            setLoading(false);
        }
    };

    const fetchStudentEnrollments = async (studentId) => {
        try {
            const res = await api.get(`/enrollments/student/${studentId}`);
            // Filter completed enrollments (or let admin issue to active ones too)
            const completed = res.data.filter(e => e.status === 'Completed' || e.status === 'Active');
            setEnrollments(completed);
            if (completed.length > 0) {
                setSelectedEnrollment(completed[0]._id);
            } else {
                setSelectedEnrollment('');
            }
        } catch (err) {
            console.error('Failed to fetch student enrollments');
        }
    };

    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);
        fetchStudentEnrollments(studentId);
        setError('');
        setSuccessMsg('');
    };

    const handleIssueCertificate = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !selectedEnrollment) {
            setError(t('certificates.errorSelection') || 'Please select a student and an enrollment.');
            return;
        }

        const enrollmentObj = enrollments.find(e => e._id === selectedEnrollment);
        if (!enrollmentObj || !enrollmentObj.session || !enrollmentObj.session.course) {
            setError('Invalid enrollment course session details.');
            return;
        }

        setIssuing(true);
        setError('');
        setSuccessMsg('');

        try {
            const payload = {
                student: selectedStudent,
                enrollment: selectedEnrollment,
                course: enrollmentObj.session.course._id
            };
            await api.post('/certificates', payload);
            setSuccessMsg(t('certificates.successIssue') || 'Certificate successfully generated and issued!');
            
            // Re-fetch certs
            const certsRes = await api.get('/certificates');
            setCertificates(certsRes.data);
            setIssuing(false);
        } catch (err) {
            setError(err.response?.data?.error || t('certificates.errorIssue') || 'Failed to issue certificate.');
            setIssuing(false);
        }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm(t('certificates.confirmRevoke') || 'Are you sure you want to revoke and delete this certificate?')) return;
        setError('');
        setSuccessMsg('');
        try {
            await api.delete(`/certificates/${id}`);
            setSuccessMsg(t('certificates.successRevoke') || 'Certificate revoked successfully.');
            setCertificates(certificates.filter(c => c._id !== id));
        } catch (err) {
            setError(t('certificates.errorRevoke') || 'Failed to revoke certificate.');
        }
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('certificates.loading') || 'Loading certificate dashboard...'}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('certificates.title') || 'Certificate Management'}</h1>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {/* FORM CARD */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">🎓 {t('certificates.issueTitle') || 'Issue Class Certificate'}</div>
                <form onSubmit={handleIssueCertificate} className="form-grid">
                    <div className="form-group">
                        <label>{t('certificates.studentLabel') || 'Student'}</label>
                        <select name="student" className="form-select" value={selectedStudent} onChange={handleStudentChange} required>
                            {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('certificates.cohortLabel') || 'Class Cohort / Enrollment'}</label>
                        {enrollments.length === 0 ? (
                            <div style={{ color: 'var(--accent)', fontSize: '0.85rem', padding: '10px 0' }}>
                                ⚠️ {t('certificates.noEnrollments') || 'No enrollments eligible (Active or Completed) found.'}
                            </div>
                        ) : (
                            <select name="enrollment" className="form-select" value={selectedEnrollment} onChange={(e) => setSelectedEnrollment(e.target.value)} required>
                                {enrollments.map(e => (
                                    <option key={e._id} value={e._id}>
                                        {e.session?.course?.title} (Status: {e.status})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="full-width">
                        <button type="submit" className="btn btn-primary btn-block" disabled={issuing || enrollments.length === 0}>
                            {issuing ? '...' : (t('certificates.issueBtn') || 'Issue Certificate 📜')}
                        </button>
                    </div>
                </form>
            </div>

            {/* CERTIFICATE LEDGER */}
            <div className="card-header" style={{ marginBottom: '16px' }}>📜 {t('certificates.ledgerTitle') || 'Issued Certificates Ledger'}</div>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('certificates.colStudent') || 'Student'}</th>
                            <th>{t('certificates.colCourse') || 'Course'}</th>
                            <th>{t('certificates.colCertNumber') || 'Certificate ID'}</th>
                            <th>{t('certificates.colIssueDate') || 'Issue Date'}</th>
                            <th>{t('certificates.colAction') || 'Action'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('certificates.noCertificates') || 'No certificates issued yet.'}</td></tr>
                        ) : (
                            certificates.map((c) => (
                                <tr key={c._id}>
                                    <td><strong>{c.student?.firstName} {c.student?.lastName}</strong></td>
                                    <td>{c.course?.title || 'Unknown Course'}</td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.certificateNumber}</td>
                                    <td>{new Date(c.issueDate).toLocaleDateString()}</td>
                                    <td>
                                        <div className="btn-group">
                                            <a
                                                href={`/certificates/${c._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-success btn-sm"
                                                style={{ textDecoration: 'none' }}
                                            >
                                                👁️ {t('certificates.viewBtn') || 'View PDF'}
                                            </a>
                                            <button onClick={() => handleRevoke(c._id)} className="btn btn-danger btn-sm">
                                                🗑️ {t('certificates.revokeBtn') || 'Revoke'}
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
    );
};

export default ManageCertificates;
