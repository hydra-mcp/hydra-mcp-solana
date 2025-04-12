import { useState, useEffect } from 'react';
import { Chat } from '@/types/chat';
import { uuid } from '@/lib/utils';
import { saveChats, loadChats } from '@/lib/api';

interface UseChatStateOptions {
    historyStorageKey?: string;
    enableHistory?: boolean;
    initialSystemMessage?: string;
    appId?: string;
}

export function useChatState(options: UseChatStateOptions = {}) {
    const {
        historyStorageKey = 'chat-history',
        enableHistory = true,
        initialSystemMessage,
        appId,
    } = options;

    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isLoadingChats, setIsLoadingChats] = useState(true);

    // 获取当前应用的聊天列表
    const appChats = appId
        ? chats.filter(chat => chat.appId === appId)
        : chats;

    // Current selected chat
    const currentChat = chats.find(chat => chat.id === currentChatId) || null;

    // Create a new chat
    const createNewChat = () => {
        // 检查当前应用是否有空聊天，如果有则使用它
        const emptyChat = appId
            ? appChats.find(chat => chat.messages.length === 0)
            : chats.find(chat => chat.messages.length === 0);

        if (emptyChat) {
            setCurrentChatId(emptyChat.id);
            return;
        }

        // Create a new chat
        const newChat: Chat = {
            id: uuid(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString(),
            appId,
        };

        // If there is an initial system message, add it to the new chat
        if (initialSystemMessage) {
            newChat.messages.push({
                id: uuid(),
                content: initialSystemMessage,
                sender: 'system',
                createdAt: new Date().toLocaleString(),
            });
        }

        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
    };

    // Update chat
    const updateChat = (chatId: string, updates: Partial<Chat>) => {
        setChats(prev =>
            prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, ...updates, updatedAt: new Date().toLocaleString() }
                    : chat
            )
        );
    };

    // Delete chat
    const deleteChat = (chatId: string) => {
        setChats(prev => prev.filter(chat => chat.id !== chatId));

        // If the deleted chat is the current chat, select the next available chat
        if (chatId === currentChatId) {
            // 按应用筛选剩余聊天
            const remainingChats = appId
                ? chats.filter(chat => chat.id !== chatId && chat.appId === appId)
                : chats.filter(chat => chat.id !== chatId);

            setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);

            // If there are no chats left, create a new one
            if (remainingChats.length === 0) {
                createNewChat();
            }
        }
    };

    // Clear all chats
    const clearAllChats = () => {
        // 如果指定了appId，只清除该应用的聊天
        if (appId) {
            setChats(prev => prev.filter(chat => chat.appId !== appId));
            setCurrentChatId(null);
        } else {
            setChats([]);
            setCurrentChatId(null);
        }
        createNewChat();
    };

    // Initial loading chats
    useEffect(() => {
        const loadInitialChats = async () => {
            setIsLoadingChats(true);
            try {
                if (enableHistory) {
                    const savedChats = loadChats(historyStorageKey);
                    if (savedChats.length > 0) {
                        setChats(savedChats);

                        // 如果有appId，选择第一个匹配的聊天
                        if (appId) {
                            const appChat = savedChats.find(chat => chat.appId === appId);
                            setCurrentChatId(appChat ? appChat.id : null);

                            // 如果没有该应用的聊天，创建一个新的
                            if (!appChat) {
                                setTimeout(() => createNewChat(), 0);
                            }
                        } else {
                            setCurrentChatId(savedChats[0].id);
                        }
                    } else {
                        setTimeout(() => createNewChat(), 0);
                    }
                } else {
                    setTimeout(() => createNewChat(), 0);
                }
            } catch (error) {
                console.error('Error loading chats:', error);
                setTimeout(() => createNewChat(), 0);
            } finally {
                setIsLoadingChats(false);
            }
        };

        loadInitialChats();
    }, [historyStorageKey, enableHistory, appId]);

    // Save chats to local storage
    useEffect(() => {
        if (enableHistory && chats.length > 0) {
            saveChats(chats, historyStorageKey);
        }
    }, [chats, historyStorageKey, enableHistory]);

    return {
        chats: appId ? appChats : chats,
        setChats,
        currentChatId,
        setCurrentChatId,
        currentChat,
        isLoadingChats,
        createNewChat,
        updateChat,
        deleteChat,
        clearAllChats
    };
} 