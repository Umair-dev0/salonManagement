import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allow, children }) {
    const { user, isLoading } = useAuth();

    // Jab tak backend se user data fetch ho raha hai, loading dikhao
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-primary font-sans">Loading your workspace...</div>
            </div>
        );
    }

    // Agar user login nahi hai, toh login page par bhejo [cite: 494]
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Agar user ka role allowed list me nahi hai, toh forbidden/dashboard par bhejo [cite: 494]
    if (allow && !allow.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    // Sab theek hai, toh page render hone do
    return children;
}