import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

/**
 * Checks whether a JWT token is still valid (not expired).
 * Returns the decoded payload if valid, or null if expired/invalid.
 */
const getValidUser = (token) => {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // exp is in seconds, Date.now() is in milliseconds
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            // Token has expired — clean up
            localStorage.removeItem('token');
            return null;
        }
        return decoded;
    } catch {
        localStorage.removeItem('token');
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if a token exists when the app loads (with expiry validation)
    useEffect(() => {
        const token = localStorage.getItem('token');
        setUser(getValidUser(token));
        setLoading(false);
    }, []);

    // ── Cross-tab sync ─────────────────────────────────────────
    // When another tab changes localStorage (login/logout), this
    // tab reacts immediately — just like Facebook.
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key !== 'token') return;

            if (e.newValue) {
                // Another tab logged in — pick up the new session
                setUser(getValidUser(e.newValue));
            } else {
                // Another tab logged out — clear this tab too
                setUser(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/users/login', { email, password });
            const { token, ...userData } = response.data;

            localStorage.setItem('token', token);

            // Decode the token to get the standardized payload, or just use userData
            const decoded = jwtDecode(token);
            setUser({ ...decoded, ...userData });

            return true; // Success
        } catch (error) {
            console.error('Login failed:', error.response?.data?.error || error.message);
            throw error;
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};