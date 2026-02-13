import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-surface">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (!currentUser) {
        // Redirect to login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export const RequireAdmin: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) return null; // handled by parent typically, or add loader

    if (currentUser?.email !== 'onno@veripura.com') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
                <p className="text-slate-500">You do not have permission to view this restricted area.</p>
                <p className="text-xs text-slate-400 mt-4 font-mono">Current User: {currentUser?.email}</p>
            </div>
        );
    }

    return children;
};
