import React, { useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../assets/academy_logo.png';

const PlacementTestView = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const userId = user?.id || user?._id;

    // Guest state
    const [guestEmail, setGuestEmail] = useState('');
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const questions = [
        {
            id: 1,
            q: "He ________ to the cinema yesterday.",
            options: ["go", "goes", "went", "gone"],
            answer: 2 // went
        },
        {
            id: 2,
            q: "Where ________ you live?",
            options: ["do", "does", "are", "have"],
            answer: 0 // do
        },
        {
            id: 3,
            q: "She ________ French since 2018.",
            options: ["learns", "learned", "has been learning", "is learning"],
            answer: 2 // has been learning
        },
        {
            id: 4,
            q: "If I ________ millions, I would buy a language school.",
            options: ["had", "have", "will have", "would have"],
            answer: 0 // had
        },
        {
            id: 5,
            q: "She is the person ________ taught me English.",
            options: ["who", "which", "whom", "whose"],
            answer: 0 // who
        },
        {
            id: 6,
            q: "We ________ our homework before our teacher arrived.",
            options: ["finish", "have finished", "had finished", "finished"],
            answer: 2 // had finished
        },
        {
            id: 7,
            q: "You ________ smoke here. It is strictly prohibited.",
            options: ["shouldn't", "don't have to", "must not", "needn't"],
            answer: 2 // must not
        },
        {
            id: 8,
            q: "Despite ________ hard, he did not pass the test.",
            options: ["study", "studying", "he studied", "of studying"],
            answer: 1 // studying
        },
        {
            id: 9,
            q: "By next summer, I ________ English for ten years.",
            options: ["will study", "will be studying", "will have studied", "am studying"],
            answer: 2 // will have studied
        },
        {
            id: 10,
            q: "Which word is a synonym of 'ACQUIRE'?",
            options: ["lose", "obtain", "sell", "give"],
            answer: 1 // obtain
        }
    ];

    const handleStart = (e) => {
        e.preventDefault();
        if (!userId && !guestEmail) {
            setError(t('placement.emailRequired') || 'Please enter your email to start the placement test.');
            return;
        }
        setError('');
        setStarted(true);
    };

    const handleSelectOption = (optIndex) => {
        setAnswers({ ...answers, [currentQuestion]: optIndex });
    };

    const handleNext = () => {
        if (answers[currentQuestion] === undefined) {
            setError(t('placement.selectOptionError') || 'Please select an option before proceeding.');
            return;
        }
        setError('');
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            handleSubmitTest();
        }
    };

    const handleSubmitTest = async () => {
        setLoading(true);
        setError('');

        // Calculate score
        let score = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.answer) {
                score++;
            }
        });

        try {
            const payload = {
                score,
                totalQuestions: questions.length
            };

            if (userId) {
                payload.studentId = userId;
            } else {
                payload.email = guestEmail;
            }

            const res = await api.post('/placement-tests', payload);
            setResult(res.data);
            setSubmitted(true);
        } catch (err) {
            setError('Failed to submit test results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted && result) {
        return (
            <div className="login-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="login-card fade-in" style={{ width: '100%', maxWidth: '600px', textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <img src={logo} alt="Academy Logo" style={{ width: '70px', height: '70px', borderRadius: '15px' }} />
                        <h2 style={{ color: 'var(--primary)' }}>🎉 {t('placement.completedTitle') || 'Placement Test Completed!'}</h2>
                    </div>

                    <div style={{ background: 'var(--bg-body)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '24px' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('placement.score') || 'Your Score'}</p>
                        <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '8px 0', color: 'var(--text-primary)' }}>
                            {result.score} / {result.totalQuestions}
                        </h1>

                        <p style={{ margin: '16px 0 4px 0', color: 'var(--text-secondary)' }}>{t('placement.recommended') || 'Recommended Proficiency Level'}</p>
                        <span className="badge" style={{ fontSize: '1.8rem', padding: '8px 24px', background: 'var(--primary-glow)', border: '1.5px solid var(--primary)', color: 'var(--primary)', fontWeight: 800 }}>
                            {result.recommendedLevel}
                        </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.6' }}>
                        {t('placement.suggestMsg') || `Excellent! Based on your grammar & vocabulary score, we recommend you enroll in a course of CEFR Level`} <strong>{result.recommendedLevel}</strong>.
                    </p>

                    <button onClick={() => window.location.href = '/'} className="btn btn-primary btn-block" style={{ padding: '12px' }}>
                        🏠 {t('placement.backHome') || 'Go back to Portal'}
                    </button>
                </div>
            </div>
        );
    }

    if (started) {
        const currentQ = questions[currentQuestion];
        const progressPercent = ((currentQuestion) / questions.length) * 100;

        return (
            <div className="login-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="login-card fade-in" style={{ width: '100%', maxWidth: '650px', padding: '36px' }}>
                    
                    {/* Header with progress */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Question {currentQuestion + 1} of {questions.length}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                            {Math.round(progressPercent)}% Complete
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '32px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                    </div>

                    {error && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>}

                    {/* Question text */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.5' }}>
                            {currentQ.q}
                        </h3>
                    </div>

                    {/* Options list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                        {currentQ.options.map((opt, idx) => {
                            const isSelected = answers[currentQuestion] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(idx)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '14px 20px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        background: isSelected ? 'var(--primary-glow)' : 'var(--bg-input)',
                                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                        fontWeight: isSelected ? 600 : 400,
                                        cursor: 'pointer',
                                        fontSize: '0.98rem',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span style={{ marginRight: '12px', fontWeight: 'bold', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                                        {String.fromCharCode(65 + idx)}.
                                    </span>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer buttons */}
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="btn btn-primary btn-block"
                        style={{ padding: '12px', fontSize: '1rem' }}
                    >
                        {loading ? 'Submitting...' : currentQuestion === questions.length - 1 ? 'Finish & Submit Test 🏁' : 'Next Question ➡️'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="login-card fade-in" style={{ width: '100%', maxWidth: '550px', textAlign: 'center', padding: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <img src={logo} alt="Academy Logo" style={{ width: '85px', height: '85px', borderRadius: '18px', boxShadow: 'var(--shadow-md)' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{t('placement.title') || 'Language Placement Test'}</h1>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '32px' }}>
                    {t('placement.intro') || 'Not sure which level to enroll in? Take our quick 10-question placement test to find out your proficiency level instantly according to the CEFR framework.'}
                </p>

                {error && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>}

                <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {!userId && (
                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label>{t('placement.emailLabel') || 'Enter Your Email Address'}</label>
                            <input
                                type="email"
                                className="form-input"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                placeholder="name@domain.com"
                                required
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-block" style={{ padding: '12px', fontSize: '1.05rem', fontWeight: 600 }}>
                        🚀 {t('placement.startBtn') || 'Start Placement Test'}
                    </button>

                    <button type="button" onClick={() => window.location.href = '/'} className="btn btn-secondary btn-block" style={{ padding: '10px' }}>
                        🚪 {t('placement.cancelBtn') || 'Cancel & Return'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PlacementTestView;
