import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        activeCourses: 0,
        activeSessions: 0,
        totalEnrollments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [usersRes, coursesRes, sessionsRes, enrollmentsRes] = await Promise.all([
                api.get('/users'),
                api.get('/courses'),
                api.get('/sessions'),
                api.get('/enrollments')
            ]);

            const users = usersRes.data;

            setStats({
                totalStudents: users.filter(u => u.role === 'student').length,
                totalTeachers: users.filter(u => u.role === 'teacher').length,
                activeCourses: coursesRes.data.length,
                activeSessions: sessionsRes.data.filter(s => s.status === 'Upcoming' || s.status === 'Active').length,
                totalEnrollments: enrollmentsRes.data.filter(e => e.status === 'Active').length,
            });

            setLoading(false);
        } catch (err) {
            setError('Failed to load dashboard statistics.');
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1.2rem' }}>⏳ Loading...</span>
        </div>
    );

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">
                {t('adminDash.title')}
            </h1>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="stat-grid">
                <div className="stat-card primary">
                    <h3>{t('adminDash.totalStudents')}</h3>
                    <p className="metric">{stats.totalStudents}</p>
                    <Link to="/admin/users" style={{ color: 'var(--text-link)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        {t('adminDash.viewDirectory')} →
                    </Link>
                </div>

                <div className="stat-card info">
                    <h3>{t('adminDash.activeInstructors')}</h3>
                    <p className="metric">{stats.totalTeachers}</p>
                    <Link to="/admin/users" style={{ color: 'var(--text-link)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        {t('adminDash.viewDirectory')} →
                    </Link>
                </div>

                <div className="stat-card success">
                    <h3>{t('adminDash.courseCurriculums')}</h3>
                    <p className="metric">{stats.activeCourses}</p>
                    <Link to="/admin/courses" style={{ color: 'var(--text-link)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        {t('adminDash.manageCoursesBtn')} →
                    </Link>
                </div>

                <div className="stat-card warning">
                    <h3>{t('adminDash.activeCohorts')}</h3>
                    <p className="metric">{stats.activeSessions}</p>
                    <Link to="/admin/sessions" style={{ color: 'var(--text-link)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        {t('adminDash.viewSchedule')} →
                    </Link>
                </div>

                <div className="stat-card danger">
                    <h3>{t('adminDash.totalEnrollments')}</h3>
                    <p className="metric">{stats.totalEnrollments}</p>
                    <Link to="/admin/enrollments" style={{ color: 'var(--text-link)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        {t('adminDash.manageEnrollments')} →
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="card-header">⚡ {t('adminDash.quickActions')}</div>
                <div className="quick-actions">
                    <Link to="/admin/users" className="quick-action-btn" style={{ textDecoration: 'none' }}>
                        👤 {t('adminDash.registerUser')}
                    </Link>
                    <Link to="/admin/sessions" className="quick-action-btn" style={{ textDecoration: 'none' }}>
                        📅 {t('adminDash.scheduleClass')}
                    </Link>
                    <Link to="/admin/payments" className="quick-action-btn" style={{ textDecoration: 'none' }}>
                        💰 {t('adminDash.checkFees')}
                    </Link>
                    <Link to="/admin/enrollments" className="quick-action-btn" style={{ textDecoration: 'none' }}>
                        📝 {t('adminDash.enrollStudent')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;