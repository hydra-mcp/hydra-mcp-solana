import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, refreshTokenRequest } from '@/lib/api';

// Define API response type
interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user_info: UserInfo;
}

interface UserInfo {
    id: string;
    username: string;
    // Add other user information fields
    [key: string]: any;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserInfo | null;
    login: (username: string, password: string) => Promise<void>;
    loginWithWallet: (walletPublicKey: string, signature: string, nonce?: string) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    getToken: () => string | null;
    getCurrentUser: () => Promise<UserInfo | null>;
    loading: boolean;
    redirectToLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Time window in milliseconds for caching user info to prevent frequent API calls
const USER_INFO_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUserFetch, setLastUserFetch] = useState<number>(0);

    // Get current user information with caching
    const getCurrentUser = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return null;
        }

        // Check if we already have user info and if it's recent
        const now = Date.now();
        if (user && isAuthenticated && (now - lastUserFetch < USER_INFO_CACHE_DURATION)) {
            setLoading(false);
            return user;
        }

        try {
            const userInfo = await apiRequest<UserInfo>('/auth/me', {
                method: 'GET',
            });

            // Verify the validity of user information
            if (!userInfo || !userInfo.id || !userInfo.username) {
                console.error('Invalid user data received from /auth/me');
                throw new Error('Invalid user data received');
            }

            setUser(userInfo);
            setIsAuthenticated(true);
            setLastUserFetch(now);
            return userInfo;
        } catch (error) {
            console.error('Failed to get current user:', error);
            // If getting user information fails, clear authentication status
            logout();

            // Get detailed error information
            const errorMessage = error instanceof Error
                ? error.message
                : 'Authentication failed, please login again';

            throw new Error(`User session invalid: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Check if user is logged in - only executed once on initialization
    useEffect(() => {
        const checkAuth = async () => {
            // First try to use cached user info from localStorage
            const token = localStorage.getItem('access_token');
            const userInfoStr = localStorage.getItem('user_info');

            if (token && userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);

                    // Verify if the user information in localStorage contains the necessary fields
                    if (!userInfo || !userInfo.id || !userInfo.username) {
                        console.warn('Invalid user info in local storage');
                        throw new Error('Invalid user info');
                    }

                    setUser(userInfo);
                    setIsAuthenticated(true);
                    setLoading(false);

                    // In the background, verify token validity without blocking UI
                    getCurrentUser().catch(err => {
                        console.warn('Background token validation failed:', err);
                        // Logout when validation fails
                        logout();
                    });
                    return;
                } catch (e) {
                    console.error('Error parsing cached user info:', e);
                    // Clear invalid user information
                    logout();
                }
            }

            // If no cached info, do a full auth check
            try {
                await getCurrentUser();
            } catch (error) {
                console.log('Authentication check failed:', error);
                setLoading(false);
            }
        };

        checkAuth();
        // This effect should only run once on component mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setLoading(true);
            const data = await apiRequest<AuthResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            // Store tokens to localStorage
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user_info', JSON.stringify(data.user_info));

            setIsAuthenticated(true);
            setUser(data.user_info);
            setLastUserFetch(Date.now());
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Update wallet login method to include signature
    const loginWithWallet = async (walletPublicKey: string, signature: string, nonce?: string) => {
        try {
            setLoading(true);

            // Create the request body based on whether nonce is provided
            const requestBody = nonce
                ? { wallet_address: walletPublicKey, signature, nonce }
                : { wallet_address: walletPublicKey, signature };

            // Call API endpoint for wallet login with signature verification
            const data = await apiRequest<AuthResponse>('/auth/wallet-login', {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            // Store tokens to localStorage
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user_info', JSON.stringify(data.user_info));

            // Also store wallet address for future reference
            localStorage.setItem('wallet_address', walletPublicKey);

            setIsAuthenticated(true);
            setUser(data.user_info);
            setLastUserFetch(Date.now());
        } catch (error) {
            console.error('Wallet login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        try {
            await refreshTokenRequest();

            // After token refresh, use cached user info if available
            const userInfoStr = localStorage.getItem('user_info');
            if (userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);
                    setUser(userInfo);
                    setIsAuthenticated(true);
                    setLastUserFetch(Date.now());
                    return;
                } catch (e) {
                    console.error('Error parsing user info after token refresh:', e);
                }
            }

            // If no cached info or parsing failed, get fresh user info
            await getCurrentUser();
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            throw error;
        }
    };

    // Add a function to redirect to the login page
    const redirectToLogin = () => {
        // Use window.location.href to redirect, ensuring current page state is cleared
        window.location.href = '/login';
    };

    const logout = () => {
        // Clear all tokens and user information in localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('wallet_address'); // Also clear wallet address

        setIsAuthenticated(false);
        setUser(null);
        setLastUserFetch(0);

        // Redirect to login page when logging out
        redirectToLogin();
    };

    const getToken = () => {
        return localStorage.getItem('access_token');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            loginWithWallet,
            logout,
            refreshToken,
            getToken,
            getCurrentUser,
            loading,
            redirectToLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 