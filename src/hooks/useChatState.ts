import { useState, useEffect } from 'react';
import { Chat } from '@/types/chat';
import { uuid } from '@/lib/utils';
import { saveChats, loadChats } from '@/lib/api';

interface UseChatStateOptions {
    historyStorageKey?: string;
    enableHistory?: boolean;
    initialSystemMessage?: string;
}

export function useChatState(options: UseChatStateOptions = {}) {
    const {
        historyStorageKey = 'chat-history',
        enableHistory = true,
        initialSystemMessage,
    } = options;

    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isLoadingChats, setIsLoadingChats] = useState(true);

    // Current selected chat
    const currentChat = chats.find(chat => chat.id === currentChatId) || null;

    // Create a new chat
    const createNewChat = () => {
        // Check if there is an empty chat, if so use it
        const emptyChat = chats.find(chat => chat.messages.length === 0);
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
            const remainingChats = chats.filter(chat => chat.id !== chatId);
            setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);

            // If there are no chats left, create a new one
            if (remainingChats.length === 0) {
                createNewChat();
            }
        }
    };

    // Clear all chats
    const clearAllChats = () => {
        setChats([]);
        setCurrentChatId(null);
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
                        setCurrentChatId(savedChats[0].id);
                    } else {
                        createNewChat();
                    }
                } else {
                    createNewChat();
                }
            } catch (error) {
                console.error('Error loading chats:', error);
                createNewChat();
            } finally {
                setIsLoadingChats(false);
            }
        };

        loadInitialChats();
    }, [historyStorageKey, enableHistory]);

    // Save chats to local storage
    useEffect(() => {
        if (enableHistory && chats.length > 0) {
            saveChats(chats, historyStorageKey);
        }
    }, [chats, historyStorageKey, enableHistory]);

    return {
        chats,
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