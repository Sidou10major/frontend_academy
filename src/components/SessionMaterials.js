import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SessionMaterials = ({ sessionId }) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const userId = user?.id || user?._id;
    
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form states
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Reading');
    const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);

    const isTeacherOrAdmin = user?.role === 'admin' || user?.role === 'teacher';

    useEffect(() => {
        if (sessionId) fetchMaterials();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/materials/session/${sessionId}`);
            setMaterials(res.data);
            setLoading(false);
        } catch (err) {
            setError(t('materials.errorLoad') || 'Failed to load session materials.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;
        if (uploadType === 'link' && !url) return;
        if (uploadType === 'file' && !file) return;

        setSaving(true);
        setError('');
        setSuccessMsg('');

        try {
            let res;
            if (uploadType === 'file') {
                const formData = new FormData();
                formData.append('session', sessionId);
                formData.append('title', title);
                formData.append('type', type);
                formData.append('file', file);
                if (userId) {
                    formData.append('uploadedBy', userId);
                }

                res = await api.post('/materials', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                res = await api.post('/materials', {
                    session: sessionId,
                    title,
                    type,
                    url,
                    uploadedBy: userId || null
                });
            }
            setMaterials([res.data, ...materials]);
            setTitle('');
            setUrl('');
            setFile(null);
            // Reset file input element if needed
            const fileInput = document.getElementById('material-file-input');
            if (fileInput) fileInput.value = '';
            
            setSuccessMsg(t('materials.successAdd') || 'Resource successfully shared!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to share material.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('materials.confirmDelete') || 'Are you sure you want to delete this resource?')) return;
        setError('');
        setSuccessMsg('');

        try {
            await api.delete(`/materials/${id}`);
            setMaterials(materials.filter(m => m._id !== id));
            setSuccessMsg(t('materials.successDelete') || 'Resource successfully removed.');
        } catch (err) {
            setError('Failed to delete resource.');
        }
    };

    const getDownloadUrl = (url) => {
        if (!url) return '#';
        if (url.startsWith('/uploads/')) {
            const base = api.defaults.baseURL.endsWith('/api') 
                ? api.defaults.baseURL.slice(0, -4) 
                : api.defaults.baseURL;
            return `${base}${url}`;
        }
        return url;
    };

    const getIcon = (matType) => {
        switch (matType) {
            case 'Syllabus': return '📜';
            case 'Homework': return '📝';
            case 'Reading': return '📖';
            default: return '📎';
        }
    };

    if (loading) return <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '10px' }}>⏳ Loading materials...</div>;

    return (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{error}</div>}
            {successMsg && <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{successMsg}</div>}

            {/* List of Shared Materials */}
            <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📁 {t('materials.sharedTitle') || 'Session Files & Resources'}
                </h4>
                {materials.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {t('materials.noMaterials') || 'No files shared for this session yet.'}
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {materials.map((mat) => (
                            <div
                                key={mat._id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'var(--bg-body)',
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.88rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{getIcon(mat.type)}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <a
                                                href={getDownloadUrl(mat.url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: 'var(--primary)',
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                }}
                                                title={mat.url}
                                            >
                                                {mat.title}
                                            </a>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '1px 4px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                {mat.type}
                                            </span>
                                            {mat.fileSize > 0 && (
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                                    ({Math.round(mat.fileSize / 1024)} KB)
                                                </span>
                                            )}
                                        </div>
                                        {mat.uploadedBy && (
                                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                Shared by {mat.uploadedBy.firstName} {mat.uploadedBy.lastName} ({mat.uploadedBy.role})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isTeacherOrAdmin && (
                                    <button
                                        onClick={() => handleDelete(mat._id)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--danger)',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            padding: '4px'
                                        }}
                                        title="Delete file link"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sharing Panel for Teachers / Admins */}
            {isTeacherOrAdmin && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                        ➕ {t('materials.addResource') || 'Share New File / URL'}
                    </h5>
                    
                    {/* Share Type Selector */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                            <input type="radio" name="uploadType" checked={uploadType === 'file'} onChange={() => setUploadType('file')} />
                            📁 Upload File (PDF / PPTX)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                            <input type="radio" name="uploadType" checked={uploadType === 'link'} onChange={() => setUploadType('link')} />
                            🔗 Web Link (Drive / Dropbox)
                        </label>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', gap: '10px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>Resource Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Week 1 Slide Deck"
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>Type</label>
                                <select
                                    className="form-select"
                                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="Syllabus">Syllabus</option>
                                    <option value="Homework">Homework</option>
                                    <option value="Reading">Reading</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                {uploadType === 'file' ? (
                                    <>
                                        <label style={{ fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>Choose PDF or PPT/PPTX</label>
                                        <input
                                            id="material-file-input"
                                            type="file"
                                            className="form-input"
                                            accept=".pdf,.ppt,.pptx"
                                            style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                                            onChange={(e) => setFile(e.target.files[0])}
                                            required
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label style={{ fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>Resource URL (Dropbox / Google Drive)</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            required
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ padding: '8px 14px', fontSize: '0.85rem', width: 'fit-content', alignSelf: 'flex-end' }}
                        >
                            {saving ? 'Saving...' : '🚀 Share Resource'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SessionMaterials;
