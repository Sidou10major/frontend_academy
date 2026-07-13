import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Messages = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const currentUserId = user?.id || user?._id;

    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const messagesEndRef = useRef(null);

    // Fetch contacts on load and poll every 10 seconds to update unread badges
    useEffect(() => {
        fetchContactsList(true);
        const contactsPoll = setInterval(() => {
            fetchContactsList(false);
        }, 10000);

        return () => clearInterval(contactsPoll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId]);

    // Poll the active conversation every 4 seconds to get new messages
    useEffect(() => {
        if (!selectedContact) return;

        fetchConversation();
        const convoPoll = setInterval(() => {
            fetchConversation();
        }, 4000);

        return () => clearInterval(convoPoll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContact, currentUserId]);

    // Scroll to bottom of chat when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchContactsList = async (showLoading) => {
        if (!currentUserId) return;
        try {
            if (showLoading) setLoadingContacts(true);
            const res = await api.get(`/messages/contacts?currentUserId=${currentUserId}`);
            setContacts(res.data);
            setLoadingContacts(false);
        } catch (err) {
            setError(t('messaging.errorContacts') || 'Failed to load contact list.');
            setLoadingContacts(false);
        }
    };

    const fetchConversation = async () => {
        if (!currentUserId || !selectedContact) return;
        try {
            const res = await api.get(`/messages/conversation/${selectedContact._id}?currentUserId=${currentUserId}`);
            setMessages(res.data);

            // Clear unread badge locally for the active chat
            setContacts(prev =>
                prev.map(c => c._id === selectedContact._id ? { ...c, unreadCount: 0 } : c)
            );
        } catch (err) {
            console.error('Failed to fetch conversation history');
        }
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setMessages([]);
        setError('');
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedContact || !currentUserId || sending) return;

        setSending(true);
        try {
            const payload = {
                sender: currentUserId,
                recipient: selectedContact._id,
                content: inputText.trim()
            };
            const res = await api.post('/messages', payload);
            setMessages(prev => [...prev, res.data]);
            setInputText('');
            setSending(false);
        } catch (err) {
            setError(t('messaging.errorSend') || 'Failed to send message.');
            setSending(false);
        }
    };

    if (loadingContacts) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ {t('messaging.loading') || 'Loading chat portal...'}</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h1 className="page-title">{t('messaging.title') || 'Direct Message Portal'}</h1>

            {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}

            <div style={{
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                height: 'calc(100vh - 220px)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
            }}>
                {/* LEFT COLUMN: CONTACTS LIST */}
                <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-table-stripe)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.95rem' }}>
                        💬 {t('messaging.contactsList') || 'Conversations'}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {contacts.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {t('messaging.noContacts') || 'No contacts found.'}
                            </div>
                        ) : (
                            contacts.map(c => {
                                const isSelected = selectedContact?._id === c._id;
                                return (
                                    <div
                                        key={c._id}
                                        onClick={() => handleSelectContact(c)}
                                        style={{
                                            padding: '12px 20px',
                                            borderBottom: '1px solid var(--border-light)',
                                            cursor: 'pointer',
                                            transition: 'var(--transition)',
                                            background: isSelected ? 'var(--primary-glow)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '10px'
                                        }}
                                        className="contact-item"
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {c.firstName} {c.lastName}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'uppercase' }}>
                                                    {t(`messaging.role_${c.role}`) || c.role}
                                                </span>
                                            </div>
                                        </div>

                                        {c.unreadCount > 0 && (
                                            <span style={{
                                                background: 'var(--danger)',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                padding: '2px 6px',
                                                borderRadius: '50px',
                                                minWidth: '20px',
                                                textAlign: 'center'
                                            }}>
                                                {c.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: ACTIVE CHAT SCREEN */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedContact.isActive ? 'var(--success)' : 'var(--text-muted)' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{selectedContact.firstName} {selectedContact.lastName}</h3>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                        {selectedContact.role} · {selectedContact.email}
                                    </span>
                                </div>
                            </div>

                            {/* Messages Scroll Area */}
                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {messages.length === 0 ? (
                                    <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        💬 {t('messaging.startChat') || 'Send a message to start the conversation.'}
                                    </div>
                                ) : (
                                    messages.map((m, idx) => {
                                        const isOutgoing = m.sender._id === currentUserId || m.sender === currentUserId;
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
                                                    maxWidth: '70%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isOutgoing ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                <div style={{
                                                    padding: '10px 16px',
                                                    borderRadius: '16px',
                                                    borderTopRightRadius: isOutgoing ? '4px' : '16px',
                                                    borderTopLeftRadius: isOutgoing ? '16px' : '4px',
                                                    background: isOutgoing ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--border-light)',
                                                    color: isOutgoing ? 'white' : 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {m.content}
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSendMessage} style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={t('messaging.inputPlaceholder') || 'Type a message...'}
                                    autoFocus
                                    required
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" className="btn btn-primary" disabled={sending || !inputText.trim()}>
                                    {sending ? '...' : (t('messaging.sendBtn') || 'Send ✉️')}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <span style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</span>
                            <h3>{t('messaging.selectConversation') || 'Select a conversation to start chatting'}</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
