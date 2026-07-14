import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const NotificationBell = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const userId = user?.id || user?._id;

    useEffect(() => {
        if (userId) fetchCount();
        // Poll every 30 seconds
        const interval = setInterval(() => {
            if (userId) fetchCount();
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchCount = async () => {
        try {
            const res = await api.get(`/notifications/user/${userId}/count`);
            setUnreadCount(res.data.unread);
        } catch (err) {
            console.error('Failed to fetch notification count');
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get(`/notifications/user/${userId}`);
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    const handleToggle = () => {
        if (!isOpen) fetchNotifications();
        setIsOpen(!isOpen);
    };

    const handleMarkRead = async (notifId) => {
        try {
            await api.patch(`/notifications/${notifId}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === notifId ? { ...n, isRead: true, readAt: new Date() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch(`/notifications/user/${userId}/read-all`);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read');
        }
    };

    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds < 60) return t('notifications.justNow');
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    return (
        <div className="notification-bell-wrapper" ref={dropdownRef}>
            <button className="notification-bell-btn" onClick={handleToggle}>
                <span>🔔</span>
                <span>{t('notifications.bellLabel')}</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <span>{t('notifications.title')}</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead}>
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                🔕 {t('notifications.empty')}
                            </div>
                        ) : (
                            notifications.slice(0, 20).map(notif => (
                                <div
                                    key={notif._id}
                                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                                    title={notif.announcement?.content || notif.content || ''}
                                >
                                    <div className={`priority-dot ${notif.announcement?.priority || 'high'}`} />
                                    <div className="notif-content">
                                        <div className="notif-title" style={{ fontWeight: !notif.isRead ? 'bold' : 'normal' }}>
                                            {notif.announcement?.title || notif.title || t('notifications.untitled') || 'Notification'}
                                        </div>
                                        {notif.content && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {notif.content}
                                            </div>
                                        )}
                                        <div className="notif-time">
                                            {notif.announcement?.author 
                                                ? `${notif.announcement.author.firstName} ${notif.announcement.author.lastName}` 
                                                : t('notifications.system') || 'System'} · {timeAgo(notif.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
