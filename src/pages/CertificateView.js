import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import logo from '../assets/academy_logo.png';

const CertificateView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCert = async () => {
            try {
                const res = await api.get(`/certificates/${id}`);
                setCertificate(res.data);
                setLoading(false);
            } catch (err) {
                setError(t('certificates.errorLoad') || 'Failed to load certificate.');
                setLoading(false);
            }
        };
        fetchCert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('certificates.loading') || 'Loading certificate...'}</div>;
    if (error || !certificate) return <div className="alert alert-danger" style={{ margin: '40px' }}>{error || 'Certificate not found.'}</div>;

    const formattedDate = new Date(certificate.issueDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            {/* PRINT CONTROLS (HIDDEN DURING PRINT) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    📜 {t('certificates.printHelp') || 'Open the print dialog to save this certificate as a branded PDF.'}
                </span>
                <button className="btn btn-primary" onClick={handlePrint}>
                    🖨️ {t('certificates.printBtn') || 'Print / Save PDF'}
                </button>
            </div>

            {/* CERTIFICATE BODY CONTAINER */}
            <div style={{
                position: 'relative',
                background: 'white',
                color: '#2d3436',
                border: '16px double #6c5ce7',
                padding: '50px 60px',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
                fontFamily: "'Playfair Display', Georgia, serif"
            }} className="certificate-page">
                
                {/* Inner Border */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    bottom: '10px',
                    border: '2px solid #5541d7',
                    pointerEvents: 'none'
                }} />

                {/* LOGO & ACADEMY TITLE */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img src={logo} alt="I Speak International Logo" style={{ width: '60px', height: '60px', borderRadius: '10px' }} />
                    <span style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#5541d7', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
                        I Speak International Academy
                    </span>
                </div>

                {/* CERTIFICATE HEADER */}
                <div style={{ margin: '30px 0' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#2d1b69',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 10px 0'
                    }}>{t('certificates.certTitle') || 'Certificate of Completion'}</h1>
                    <p style={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#636e72', margin: 0 }}>
                        {t('certificates.certSubtitle') || 'This is proudly presented to'}
                    </p>
                </div>

                {/* STUDENT NAME */}
                <div style={{ margin: '10px 0' }}>
                    <h2 style={{
                        fontSize: '2.6rem',
                        fontWeight: '800',
                        color: '#6c5ce7',
                        borderBottom: '2px solid #e1e5eb',
                        paddingBottom: '8px',
                        display: 'inline-block',
                        minWidth: '350px'
                    }}>
                        {certificate.student?.firstName} {certificate.student?.lastName}
                    </h2>
                </div>

                {/* COMPLETED TEXT */}
                <div style={{ maxWidth: '600px', margin: '20px 0', lineHeight: '1.8' }}>
                    <p style={{ fontSize: '1.05rem', color: '#2d3436', margin: 0 }}>
                        {t('certificates.certDescription') || 'for successfully completing the course requirements for'}
                    </p>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2d1b69', margin: '8px 0' }}>
                        {certificate.course?.title}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#636e72', margin: 0 }}>
                        {t('certificates.certLevel') || 'Achieved Proficiency Level'}: <strong>{certificate.course?.level}</strong>
                    </p>
                </div>

                {/* FOOTER SIGNATURES */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', marginTop: '40px', gap: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#2d3436', borderBottom: '1px solid #b2bec3', width: '180px', paddingBottom: '6px', fontStyle: 'italic' }}>
                            {certificate.enrollment?.session?.teacher?.firstName} {certificate.enrollment?.session?.teacher?.lastName}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#8b949e', marginTop: '6px', textTransform: 'uppercase' }}>
                            {t('certificates.instructorSign') || 'Class Instructor'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#2d3436', borderBottom: '1px solid #b2bec3', width: '180px', paddingBottom: '6px', fontStyle: 'italic' }}>
                            {formattedDate}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#8b949e', marginTop: '6px', textTransform: 'uppercase' }}>
                            {t('certificates.dateIssued') || 'Date Issued'}
                        </span>
                    </div>
                </div>

                {/* VERIFICATION HASH NUMBER */}
                <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#b2bec3', letterSpacing: '0.5px' }}>
                        {t('certificates.verifiedHash') || 'VERIFICATION CODE'}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 600, color: '#636e72' }}>
                        {certificate.certificateNumber}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CertificateView;
