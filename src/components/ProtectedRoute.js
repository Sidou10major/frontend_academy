import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    // 1. Wait for the AuthContext to finish checking localStorage
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <h2>Checking credentials...</h2>
            </div>
        );
    }

    // 2. If no user is found, kick them back to the login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. If the route requires specific roles, check if the user has one of them
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
                <h2>Unauthorized Access</h2>
                <p>You do not have permission to view this page.</p>
                <button onClick={() => window.history.back()}>Go Back</button>
            </div>
        );
    }

    // 4. If everything passes, render the protected component
    return children;
};

export default ProtectedRoute;