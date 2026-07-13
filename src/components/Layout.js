import React, { useContext } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import logo from '../assets/academy_logo.png';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    const isActive = (path) => location.pathname === path;

    const navLinkClass = (path) =>
        `sidebar-nav-link ${isActive(path) ? 'active' : ''}`;

    return (
        <div className="app-layout">
            {/* SIDEBAR */}
            <nav className="sidebar">
                <div className="sidebar-brand">
                    <img src={logo} alt="ISI Logo" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '1.05rem', fontWeight: '800', lineHeight: '1.2' }}>{t('sidebar.title')}</span>
                </div>

                <div className="sidebar-user-info">
                    <strong>{user?.firstName} {user?.lastName}</strong>
                    <span className="role-badge">{user?.role}</span>
                </div>

                <ul className="sidebar-nav">
                    {user?.role === 'admin' && (
                        <>
                            <li><Link to="/admin" className={navLinkClass('/admin')}>📊 {t('sidebar.dashboard')}</Link></li>
                            <li><Link to="/admin/courses" className={navLinkClass('/admin/courses')}>📚 {t('sidebar.manageCourses')}</Link></li>
                            <li><Link to="/admin/users" className={navLinkClass('/admin/users')}>👥 {t('sidebar.manageUsers')}</Link></li>
                            <li><Link to="/admin/sessions" className={navLinkClass('/admin/sessions')}>📅 {t('sidebar.classScheduler')}</Link></li>
                            <li><Link to="/admin/enrollments" className={navLinkClass('/admin/enrollments')}>📝 {t('sidebar.enrollments')}</Link></li>
                            <li><Link to="/admin/attendance" className={navLinkClass('/admin/attendance')}>✅ {t('sidebar.attendanceSheets')}</Link></li>
                            <li><Link to="/admin/teacher-attendance" className={navLinkClass('/admin/teacher-attendance')}>🧑‍🏫 {t('sidebar.teacherAttendance')}</Link></li>
                            <li><Link to="/admin/payments" className={navLinkClass('/admin/payments')}>💰 {t('sidebar.finances')}</Link></li>
                        </>
                    )}

                    {user?.role === 'teacher' && (
                        <>
                            <li><Link to="/teacher" className={navLinkClass('/teacher')}>📅 {t('sidebar.mySchedule')}</Link></li>
                            <li><Link to="/teacher/attendance" className={navLinkClass('/teacher/attendance')}>✅ {t('sidebar.attendanceSheets')}</Link></li>
                        </>
                    )}

                    {user?.role === 'student' && (
                        <>
                            <li><Link to="/student" className={navLinkClass('/student')}>📚 {t('sidebar.myClasses')}</Link></li>
                            <li><Link to="/student/attendance" className={navLinkClass('/student/attendance')}>✅ {t('sidebar.myAttendance')}</Link></li>
                            <li><Link to="/student/payments" className={navLinkClass('/student/payments')}>💳 {t('sidebar.myPayments')}</Link></li>
                        </>
                    )}
                </ul>

                <div className="sidebar-controls">
                    <select
                        onChange={changeLanguage}
                        value={i18n.language}
                    >
                        <option value="en">🇬🇧 English</option>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="ar">🇩🇿 العربية</option>
                    </select>

                    <button className="theme-toggle-btn" onClick={toggleTheme}>
                        {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? t('sidebar.darkMode') || 'Dark Mode' : t('sidebar.lightMode') || 'Light Mode'}
                    </button>

                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 {t('sidebar.logout')}
                    </button>
                </div>
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;