import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/context/ChatContext';
import { ChatList } from '@/components/chat/ChatList';

interface ChatSidebarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export function ChatSidebar({ isSidebarOpen, toggleSidebar }: ChatSidebarProps) {
    const {
        chats,
        currentChatId,
        createNewChat,
        deleteChat,
        clearAllChats
    } = useChatContext();

    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-full transform border-r bg-background/95 backdrop-blur-md transition-all duration-300 shadow-lg lg:z-30',
                    'w-72 lg:w-72',
                    isSidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                )}
            >
                <div className="flex h-14 items-center border-b px-4">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        <span>Chat History</span>
                    </h2>
                </div>
                <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
                    <div className="p-4">
                        <ChatList
                            chats={chats}
                            currentChatId={currentChatId}
                            onSelectChat={(id) => {
                                if (window.innerWidth < 1024) { // lg breakpoint
                                    toggleSidebar();
                                }
                            }}
                            onNewChat={createNewChat}
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
                    className="fixed inset-0 lg:hidden bg-background/80 backdrop-blur-sm z-30 transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}
        </>
    );
} 