import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
    const { isAuthenticated, getCurrentUser, loading } = useAuth();
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        // Only verify auth if not already authenticated and not loading
        const verifyAuth = async () => {
            // Only attempt verification if not already authenticated and not already loading
            if (!isAuthenticated && !loading) {
                setVerifying(true);
                try {
                    await getCurrentUser();
                } catch (error) {
                    console.error('Auth verification failed:', error);
                } finally {
                    setVerifying(false);
                }
            } else {
                setVerifying(false);
            }
        };

        verifyAuth();
        // Only re-run when isAuthenticated or loading changes
    }, [isAuthenticated, loading, getCurrentUser]);

    // Show loading indicator when verification is in progress
    if (loading || verifying) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // If not authenticated after verification, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child routes
    return <Outlet />;
}; 