import { Moon, Sun, Bot, LogOut, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface NavBarProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    isSidebarOpen?: boolean;
    toggleSidebar?: () => void;
}

export function NavBar({ isDarkMode, toggleTheme, isSidebarOpen, toggleSidebar }: NavBarProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const location = useLocation();
    const isOnChatPage = location.pathname === '/' || location.pathname === '/chat';

    const handleLogout = () => {
        logout();
        toast({
            title: 'Logged out successfully',
            duration: 2000,
        });
        navigate('/login');
    };

    return (
        <header className="fixed top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="flex h-14 items-center justify-between px-4">
                {/* Left section: Toggle sidebar (only on chat page) and Logo */}
                <div className="flex items-center gap-2">
                    {isOnChatPage && toggleSidebar && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="mr-1 transition-transform hover:scale-105"
                            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            {isSidebarOpen ? (
                                <PanelLeftClose className="h-5 w-5" />
                            ) : (
                                <PanelLeftOpen className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                    <Bot className="h-6 w-6 text-primary animate-bounce" />
                    <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        HYDRA-AI
                    </span>
                </div>

                {/* Right section: Theme toggle and Logout */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="transition-transform hover:scale-110 hover:rotate-12"
                    >
                        {isDarkMode ? (
                            <Sun className="h-5 w-5 text-yellow-400" />
                        ) : (
                            <Moon className="h-5 w-5 text-indigo-600" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-1 text-red-500 hover:text-red-600"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </div>
        </header>
    );
} 