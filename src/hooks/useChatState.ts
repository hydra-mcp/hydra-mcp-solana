import { useState, useEffect } from 'react';
import { Chat } from '@/types/chat';
import { uuid } from '@/lib/utils';
import { saveChats, loadChats, loadAppChats, clearAppChats } from '@/lib/api';

interface UseChatStateOptions {
    enableHistory?: boolean;
    initialSystemMessage?: string;
    appId?: string;
}

export function useChatState(options: UseChatStateOptions = {}) {
    const {
        enableHistory = true,
        initialSystemMessage,
        appId,
    } = options;

    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isLoadingChats, setIsLoadingChats] = useState(true);

    // Get current app's chat list
    const appChats = appId
        ? chats.filter(chat => chat.appId === appId)
        : chats;

    // Current selected chat
    const currentChat = chats.find(chat => chat.id === currentChatId) || null;

    // Create a new chat
    const createNewChat = () => {
        // Check if current app has an empty chat, if so use it
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
            metadata: initialSystemMessage ? { systemMessage: initialSystemMessage } : undefined
        };

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
            // Filter remaining chats by app
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
        // If appId is specified, only clear the chats for that app
        if (appId) {
            setChats(prev => prev.filter(chat => chat.appId !== appId));
            setCurrentChatId(null);

            // Use the new clearAppChats function to clear the storage for that app
            if (enableHistory) {
                clearAppChats(appId);
            }
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
                    // Load different ranges of chats based on whether appId is specified
                    const savedChats = appId
                        ? loadAppChats(appId)
                        : loadChats();

                    if (savedChats.length > 0) {
                        setChats(savedChats);

                        // For specific apps, only select the chat history for that app
                        if (appId) {
                            const appChat = savedChats.find(chat => chat.appId === appId);
                            setCurrentChatId(appChat ? appChat.id : null);

                            // If the app has no chat history, create a new one
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
    }, [enableHistory, appId]);

    // Save chats to local storage
    useEffect(() => {
        if (enableHistory && chats.length > 0) {
            saveChats(chats);
        }
    }, [chats, enableHistory]);

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