import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const CalendarView = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const userId = user?.id || user?._id;

    const [sessions, setSessions] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateClasses, setSelectedDateClasses] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showMyClassesOnly, setShowMyClassesOnly] = useState(user?.role !== 'admin');

    useEffect(() => {
        const fetchSessionsData = async () => {
            try {
                const [sessionsRes, enrollmentsRes] = await Promise.all([
                    api.get('/sessions'),
                    user?.role === 'student' ? api.get(`/enrollments/student/${userId}`) : Promise.resolve({ data: [] })
                ]);
                setSessions(sessionsRes.data);
                setMyEnrollments(enrollmentsRes.data);
                setLoading(false);
            } catch (err) {
                setError(t('calendar.errorLoad') || 'Failed to load calendar data.');
                setLoading(false);
            }
        };
        fetchSessionsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
        const totalDays = new Date(year, month + 1, 0).getDate();
        return { firstDayIndex, totalDays };
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
        setSelectedDateClasses([]);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
        setSelectedDateClasses([]);
    };

    // Filters sessions depending on selection
    const getFilteredSessions = () => {
        if (!showMyClassesOnly) return sessions;

        if (user?.role === 'student') {
            const mySessionIds = myEnrollments.map(e => e.session?._id);
            return sessions.filter(s => mySessionIds.includes(s._id));
        } else if (user?.role === 'teacher') {
            return sessions.filter(s => s.teacher?._id === userId || s.teacher === userId);
        }
        return sessions;
    };

    // Calculate if there are class occurrences on a specific calendar cell date
    const getClassesForDate = (day) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const cellDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        
        // Days map for matching
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = dayNames[cellDate.getUTCDay()];

        const filtered = getFilteredSessions();

        return filtered.filter(session => {
            const start = new Date(session.startDate);
            const end = new Date(session.endDate);
            // Reset hours for comparison
            const check = new Date(cellDate);
            check.setUTCHours(0,0,0,0);
            start.setUTCHours(0,0,0,0);
            end.setUTCHours(0,0,0,0);

            if (check >= start && check <= end) {
                return session.schedule.some(s => s.day === dayOfWeek);
            }
            return false;
        });
    };

    const handleDateClick = (day, classes) => {
        const clicked = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clicked);
        setSelectedDateClasses(classes);
    };

    // Map course languages to color styles
    const getLanguageColor = (lang) => {
        const map = {
            English: 'var(--info)',
            French: 'var(--success)',
            Arabic: 'var(--accent)',
            Spanish: 'var(--warning)',
            German: '#d63031',
            Chinese: '#e84393'
        };
        return map[lang] || 'var(--primary)';
    };

    if (loading) return <div className="fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('calendar.loading') || 'Loading calendar...'}</div>;

    const { firstDayIndex, totalDays } = getDaysInMonth(currentDate);
    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const calendarCells = [...blanks, ...days];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>{t('calendar.title') || 'Class Schedule Calendar'}</h1>
                
                {user?.role !== 'admin' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={showMyClassesOnly}
                            onChange={(e) => {
                                setShowMyClassesOnly(e.target.checked);
                                setSelectedDate(null);
                                setSelectedDateClasses([]);
                            }}
                        />
                        <strong>{t('calendar.showMyClassesOnly') || 'Show my classes only'}</strong>
                    </label>
                )}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr', gap: '28px', alignItems: 'start' }}>
                {/* CALENDAR BODY */}
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth}>◀</button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </h2>
                        <button className="btn btn-secondary btn-sm" onClick={handleNextMonth}>▶</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                        {/* Headers */}
                        {weekDays.map(wd => (
                            <div key={wd} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '6px 0' }}>
                                {wd}
                            </div>
                        ))}

                        {/* Calendar cells */}
                        {calendarCells.map((day, idx) => {
                            if (day === null) {
                                return <div key={`blank-${idx}`} style={{ minHeight: '80px', background: 'var(--bg-table-stripe)', opacity: 0.3, borderRadius: 'var(--radius-sm)' }} />;
                            }

                            const classes = getClassesForDate(day);
                            const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();

                            return (
                                <div
                                    key={`day-${day}`}
                                    onClick={() => handleDateClick(day, classes)}
                                    style={{
                                        minHeight: '85px',
                                        padding: '6px',
                                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        background: isSelected ? 'var(--primary-glow)' : 'var(--bg-card)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                    className="calendar-cell-hover"
                                >
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                                        {day}
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                                        {classes.slice(0, 3).map((c, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    background: getLanguageColor(c.course?.language),
                                                    color: 'white',
                                                    fontSize: '0.65rem',
                                                    padding: '2px 4px',
                                                    borderRadius: '3px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontWeight: 600
                                                }}
                                                title={c.course?.title}
                                            >
                                                {c.course?.title}
                                            </div>
                                        ))}
                                        {classes.length > 3 && (
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
                                                +{classes.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SIDEBAR: CLASS DETAILS FOR SELECTED DAY */}
                <div>
                    <div className="card-header" style={{ marginBottom: '16px' }}>
                        📅 {selectedDate ? selectedDate.toLocaleDateString(undefined, { dateStyle: 'medium' }) : (t('calendar.selectDay') || 'Select a day')}
                    </div>

                    {selectedDateClasses.length === 0 ? (
                        <div style={{ display: 'flex', height: '180px', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}>
                            <p style={{ fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                                {selectedDate ? (t('calendar.noClassesThisDay') || 'No classes scheduled on this day.') : (t('calendar.selectDayHelp') || 'Select a day on the calendar to see its cohort sessions details.')}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {selectedDateClasses.map((item, idx) => (
                                <div key={idx} className="item-card" style={{ borderLeft: `4px solid ${getLanguageColor(item.course?.language)}` }}>
                                    <span className="badge badge-primary" style={{ position: 'absolute', top: '16px', right: '16px' }}>
                                        {item.course?.level}
                                    </span>
                                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 6px 0', paddingRight: '50px' }}>{item.course?.title}</h3>
                                    
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                                        <span>🗣️ <strong>{t('calendar.language') || 'Language'}:</strong> {item.course?.language} ({item.course?.format})</span>
                                        <span>🧑‍🏫 <strong>{t('calendar.teacher') || 'Instructor'}:</strong> {item.teacher?.firstName} {item.teacher?.lastName}</span>
                                        <span>⏰ <strong>{t('calendar.hours') || 'Hours'}:</strong> {item.schedule.map(s => `${s.startTime} - ${s.endTime}`).join(', ')}</span>
                                    </div>

                                    {item.meetingLink ? (
                                        <a href={item.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm btn-block" style={{ textDecoration: 'none' }}>
                                            🔗 {t('calendar.joinSession') || 'Join Virtual Classroom'}
                                        </a>
                                    ) : (
                                        <div className="alert alert-warning" style={{ margin: 0, padding: '6px 10px', fontSize: '0.78rem' }}>
                                            ⚠️ {t('calendar.noMeetingLink') || 'No virtual classroom link provided.'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
