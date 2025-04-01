import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Define global error event type
interface ApiErrorEvent extends CustomEvent {
    detail: {
        message: string;
        status?: number;
        endpoint?: string;
    };
}

export function ErrorHandler() {
    const { toast } = useToast();
    const navigate = useNavigate();
    // Use try-catch to useAuth, prevent error when used outside AuthProvider
    let authContext;
    try {
        authContext = useAuth();
    } catch (error) {
        console.warn('ErrorHandler: AuthContext not available', error);
    }
    // from authContext get logout method, if not available, provide an empty function
    const logout = authContext?.logout || (() => {
        console.warn('Logout function not available, clearing local storage directly');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
    });

    useEffect(() => {
        // Create a custom event listener to handle API errors
        const handleApiError = (event: Event) => {
            const apiEvent = event as ApiErrorEvent;
            const { message, status } = apiEvent.detail;

            // Handle 401 error - authorization failed
            if (status === 401) {
                // Show error prompt
                toast({
                    title: 'Session Expired',
                    description: 'Your session has expired. Please login again.',
                    variant: 'destructive',
                    duration: 5000,
                });

                // Logout user
                logout();

                // Redirect to login page
                navigate('/login', { replace: true });
            } else {
                // Handle other API errors
                toast({
                    title: 'API Error',
                    description: message || 'An unexpected error occurred',
                    variant: 'destructive',
                    duration: 5000,
                });
            }
        };

        // Register global error event listener
        window.addEventListener('api-error', handleApiError as EventListener);

        // Cleanup function
        return () => {
            window.removeEventListener('api-error', handleApiError as EventListener);
        };
    }, [toast, navigate, logout]);

    // This component does not render any UI elements
    return null;
}

// Helper function, used to trigger API error events
export function triggerApiError(message: string, status?: number, endpoint?: string) {
    const event = new CustomEvent('api-error', {
        detail: { message, status, endpoint }
    });
    window.dispatchEvent(event);
} 