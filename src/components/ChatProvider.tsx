import React, { useRef, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppDefinition } from '@/components/ios/AppRegistry';
import { useChatState } from '@/hooks/useChatState';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useScrollBehavior } from '@/hooks/useScrollBehavior';
import { ChatContext } from '@/context/ChatContext';

interface ChatProviderProps {
    children: ReactNode;
    apiEndpoint: string;
    appDefinition?: AppDefinition;
    options?: {
        enableHistory?: boolean;
        historyStorageKey?: string;
        initialMessages?: any[];
    };
}

export function ChatProvider({
    children,
    apiEndpoint,
    appDefinition,
    options = {}
}: ChatProviderProps) {
    const {
        enableHistory = true,
        historyStorageKey = 'chat-history',
        initialMessages = []
    } = options;

    const { toast } = useToast();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initial system message
    const initialSystemMessage = appDefinition?.description;

    // Use custom hooks
    const {
        chats,
        currentChatId,
        currentChat,
        isLoadingChats,
        createNewChat,
        updateChat,
        deleteChat: deleteChatState,
        clearAllChats: clearAllChatsState
    } = useChatState({
        historyStorageKey,
        enableHistory,
        initialSystemMessage
    });

    const {
        isStreaming,
        isProcessing,
        processingStage,
        sendMessage: sendChatApiMessage,
        handleContentUpdate
    } = useChatMessages({
        apiEndpoint,
        onUpdateChat: updateChat,
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to get AI response.',
                duration: 3000,
            });
        }
    });

    const {
        isScrolledUp,
        messagesEndRef,
        scrollAreaRef,
        scrollToBottom,
        handleScroll
    } = useScrollBehavior({
        isStreaming
    });

    // Send message
    const sendMessage = async (content: string) => {
        if (!currentChatId || !content.trim()) return;

        // Clear input
        if (inputRef.current) {
            inputRef.current.value = '';
        }

        try {
            await sendChatApiMessage(currentChatId, currentChat, content);

            // Focus input after message is sent
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Delete chat
    const deleteChat = (chatId: string) => {
        deleteChatState(chatId);

        toast({
            title: 'Chat deleted',
            description: 'The chat has been removed.',
            duration: 3000,
        });
    };

    // Clear all chats
    const clearAllChats = () => {
        clearAllChatsState();

        toast({
            title: 'All chats cleared',
            description: 'Your chat history has been cleared.',
            duration: 3000,
        });
    };

    // Add initial messages
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0 && currentChat && currentChat.messages.length === 0) {
            initialMessages.forEach((message: any) => {
                handleContentUpdate(
                    currentChatId as string,
                    currentChat.messages,
                    message.content,
                    message.sender
                );
            });
        }
    }, [currentChatId, currentChat]);

    // Context value
    const contextValue = {
        config: {
            apiEndpoint,
            appDefinition,
            historyStorageKey,
            enableHistory
        },
        chats,
        currentChatId,
        currentChat,
        isStreaming,
        isProcessing,
        processingStage,
        createNewChat,
        deleteChat,
        sendMessage,
        clearAllChats,
        isScrolledUp,
        scrollToBottom,
        inputRef,
        messagesEndRef,
        handleScroll
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
} 