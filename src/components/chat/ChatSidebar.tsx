import React from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/context/ChatContext';
import { ChatList } from '@/components/chat/ChatList';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

interface ChatSidebarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    className?: string;
}

export function ChatSidebar({ isSidebarOpen, toggleSidebar, className }: ChatSidebarProps) {
    const { isDarkMode } = useTheme();
    const {
        chats,
        currentChatId,
        createNewChat,
        deleteChat,
        clearAllChats,
        setCurrentChatId
    } = useChatContext();

    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed pt-8 left-0 top-0 z-40 h-full transform transition-all duration-300 ease-in-out',
                    'w-72 lg:w-80 shadow-xl',
                    'rounded-r-xl border-r',
                    isDarkMode
                        ? 'border-gray-700/30 bg-gray-800/90 backdrop-blur-xl'
                        : 'border-blue-200/50 bg-white/90 backdrop-blur-xl',
                    isSidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full',
                    className
                )}
            >
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 rounded-r-xl overflow-hidden pointer-events-none">
                    <div className={cn(
                        "absolute inset-0",
                        isDarkMode
                            ? "bg-gradient-to-b from-blue-600/5 via-gray-800/60 to-gray-900/40 backdrop-blur-xl"
                            : "bg-gradient-to-b from-blue-500/10 via-white/80 to-blue-50/40 backdrop-blur-xl"
                    )} />

                    {/* Top highlight effect */}
                    <div className={cn(
                        "absolute top-0 left-0 right-0 h-[1px]",
                        isDarkMode ? "bg-white/10" : "bg-white/70"
                    )} />

                    {/* Bottom shadow effect */}
                    <div className={cn(
                        "absolute bottom-0 left-0 right-0 h-[1px]",
                        isDarkMode ? "bg-black/30" : "bg-blue-200/30"
                    )} />
                </div>

                <div className={cn(
                    "flex h-14 items-center justify-between px-4 border-b relative z-10",
                    isDarkMode
                        ? "bg-blue-900/10 border-gray-700/30 backdrop-blur-md"
                        : "bg-blue-500/10 border-blue-200/50 backdrop-blur-md"
                )}>
                    <h2 className="font-semibold flex items-center gap-2">
                        <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center",
                            isDarkMode ? "bg-blue-500/20" : "bg-blue-500/20"
                        )}>
                            <Sparkles className={cn(
                                "h-3 w-3 animate-pulse",
                                isDarkMode ? "text-blue-300" : "text-blue-600"
                            )} />
                        </div>
                        <span className={cn(
                            "font-bold",
                            isDarkMode
                                ? "bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                        )}>Chat History</span>
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className={cn(
                            "h-8 w-8 rounded-full transition-all duration-200",
                            isDarkMode
                                ? "hover:bg-blue-500/10 hover:scale-105 text-gray-300"
                                : "hover:bg-blue-500/20 hover:scale-105 text-blue-600"
                        )}
                        aria-label="Close sidebar"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
                <div className="h-[calc(100vh-3.5rem)] overflow-y-auto thin-scrollbar relative z-10">
                    <div className="p-4">
                        <ChatList
                            chats={chats}
                            currentChatId={currentChatId}
                            onSelectChat={(id) => {
                                setCurrentChatId(id);
                                setTimeout(() => {
                                    toggleSidebar();
                                }, 100);
                            }}
                            onNewChat={() => {
                                createNewChat();
                                // Close sidebar after creating a new chat
                                setTimeout(() => {
                                    toggleSidebar();
                                }, 100);
                            }}
                            onDeleteChat={deleteChat}
                            onClearAllChats={clearAllChats}
                            isLoading={false}
                        />
                    </div>
                </div>
            </aside>

            {/* Sidebar overlay */}
            {isSidebarOpen && (
                <div
                    className={cn(
                        "fixed inset-0 lg:hidden z-30 transition-opacity duration-300",
                        isDarkMode
                            ? "bg-gray-900/70 backdrop-blur-sm"
                            : "bg-black/20 backdrop-blur-sm"
                    )}
                    onClick={toggleSidebar}
                />
            )}
        </>
    );
} 