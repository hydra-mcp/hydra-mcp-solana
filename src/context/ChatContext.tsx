import React, { createContext, useContext, ReactNode } from 'react';
import { Chat } from '@/types/chat';
import { AppDefinition } from '@/components/ios/AppRegistry';

// Chat context type definition
export interface ChatContextType {
    // Chat configuration
    config: {
        apiEndpoint: string;
        appDefinition?: AppDefinition;
        historyStorageKey?: string;
        enableHistory?: boolean;
    };

    // Chat status
    chats: Chat[];
    currentChatId: string | null;
    currentChat: Chat | null;
    isProcessing: boolean;
    isLoadingChats: boolean;

    // Chat operation methods
    createNewChat: () => void;
    deleteChat: (chatId: string) => void;
    sendMessage: (content: string) => Promise<void>;
    clearAllChats: () => void;
    setCurrentChatId: (chatId: string) => void;

    // Interface related status
    isScrolledUp: boolean;
    scrollToBottom: () => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
    checkScrollState: () => void;
}

// Create context
export const ChatContext = createContext<ChatContextType | null>(null);

// Custom hook for easy access to context
export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
} 