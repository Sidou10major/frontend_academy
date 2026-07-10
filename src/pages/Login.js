import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import logo from '../assets/academy_logo.png';

const Login = () => {
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useContext(ThemeContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'teacher') navigate('/teacher');
            else if (user.role === 'student') navigate('/student');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials');
        }
    };

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <div className="login-container">
            <div className="login-card fade-in">

                {/* Top controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <select
                        onChange={changeLanguage}
                        value={i18n.language}
                        className="form-select"
                        style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                    >
                        <option value="en">🇬🇧 English</option>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="ar">🇩🇿 العربية</option>
                    </select>

                    <button
                        onClick={toggleTheme}
                        className="theme-toggle-btn"
                        style={{ border: '1px solid var(--border)' }}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </div>

                {/* Brand */}
                <div className="brand-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="ISI Logo" style={{ width: '85px', height: '85px', borderRadius: '18px', objectFit: 'cover', boxShadow: 'var(--shadow-md)' }} />
                    <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '-0.5px' }}>{t('sidebar.title')}</span>
                </div>
                <h2>{t('login.title')}</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>
                    {t('login.subtitle') || 'Sign in to your account'}
                </p>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="form-group">
                        <label>{t('login.email')}</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@academy.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('login.password')}</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px', padding: '12px' }}>
                        {t('login.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;