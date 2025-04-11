import React, { createContext, useContext, ReactNode } from 'react';
import { Chat } from '@/types/chat';
import { AppDefinition } from '@/components/ios/AppRegistry';

// 聊天上下文类型定义
export interface ChatContextType {
    // 聊天配置
    config: {
        apiEndpoint: string;
        appDefinition?: AppDefinition;
        historyStorageKey?: string;
        enableHistory?: boolean;
    };

    // 聊天状态
    chats: Chat[];
    currentChatId: string | null;
    currentChat: Chat | null;
    isProcessing: boolean;

    // 聊天操作方法
    createNewChat: () => void;
    deleteChat: (chatId: string) => void;
    sendMessage: (content: string) => Promise<void>;
    clearAllChats: () => void;

    // 界面相关状态
    isScrolledUp: boolean;
    scrollToBottom: () => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

// 创建上下文
export const ChatContext = createContext<ChatContextType | null>(null);

// 自定义钩子，方便访问上下文
export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
} 