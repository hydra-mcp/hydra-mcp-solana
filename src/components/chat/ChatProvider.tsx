import React, { useRef, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppDefinition } from '@/components/ios/AppRegistry';
import { useChatState } from '@/hooks/useChatState';
import { useScrollBehavior } from '@/hooks/useScrollBehavior';
import { ChatContext } from '@/context/ChatContext';
import { StreamingProvider } from '@/lib/streaming/StreamingContext';
import { useChatWithStreaming } from '@/hooks/useChatWithStreaming';

interface ChatProviderProps {
    children: ReactNode;
    apiEndpoint: string;
    appDefinition?: AppDefinition;
    options?: {
        enableHistory?: boolean;
        historyStorageKey?: string;
        initialMessages?: any[];
        scrollButtonThreshold?: number;
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
        initialMessages = [],
        scrollButtonThreshold = 100
    } = options;

    const { toast } = useToast();
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initial system message
    const initialSystemMessage = appDefinition?.description;

    // Get app ID
    const appId = appDefinition?.id;

    // ensure each app has a unique storage key
    const appSpecificStorageKey = appId
        ? `${historyStorageKey}-${appId}`
        : historyStorageKey;

    // Use custom hooks
    const {
        chats,
        currentChatId,
        currentChat,
        isLoadingChats,
        createNewChat,
        updateChat,
        deleteChat: deleteChatState,
        clearAllChats: clearAllChatsState,
        setCurrentChatId
    } = useChatState({
        enableHistory,
        initialSystemMessage,
        appId,
    });

    const {
        isScrolledUp,
        messagesEndRef,
        scrollAreaRef,
        scrollToBottom,
        handleScroll,
        checkScrollState
    } = useScrollBehavior({
        defaultIsStreaming: false,
        bottomThreshold: scrollButtonThreshold
    });

    // Generate a unique session ID for this provider instance
    const sessionId = `${appId || 'global'}-${appSpecificStorageKey}`;

    return (
        <StreamingProvider
            options={{
                onError: (error) => {
                    toast({
                        title: 'Streaming Error',
                        description: error.message || 'Error processing streaming message',
                        duration: 3000,
                    });
                }
            }}
            sessionId={sessionId}
        >
            <StreamingAwareChat
                apiEndpoint={apiEndpoint}
                inputRef={inputRef}
                currentChatId={currentChatId}
                currentChat={currentChat}
                chats={chats}
                updateChat={updateChat}
                createNewChat={createNewChat}
                deleteChatState={deleteChatState}
                clearAllChatsState={clearAllChatsState}
                setCurrentChatId={setCurrentChatId}
                isScrolledUp={isScrolledUp}
                scrollToBottom={scrollToBottom}
                messagesEndRef={messagesEndRef}
                handleScroll={handleScroll}
                checkScrollState={checkScrollState}
                isLoadingChats={isLoadingChats}
                config={{
                    apiEndpoint,
                    appDefinition,
                    historyStorageKey,
                    enableHistory
                }}
            >
                {children}
            </StreamingAwareChat>
        </StreamingProvider>
    );
}

// Internal component that uses useStreaming safely after the provider is established
function StreamingAwareChat({
    apiEndpoint,
    inputRef,
    currentChatId,
    currentChat,
    chats,
    updateChat,
    createNewChat,
    deleteChatState,
    clearAllChatsState,
    setCurrentChatId,
    isScrolledUp,
    scrollToBottom,
    messagesEndRef,
    handleScroll,
    checkScrollState,
    isLoadingChats,
    config,
    children
}: {
    apiEndpoint: string;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    currentChatId: string | null;
    currentChat: any;
    chats: any[];
    updateChat: any;
    createNewChat: () => void;
    deleteChatState: any;
    clearAllChatsState: () => void;
    setCurrentChatId: (chatId: string) => void;
    isScrolledUp: boolean;
    scrollToBottom: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleScroll: any;
    checkScrollState: () => void;
    isLoadingChats: boolean;
    config: any;
    children: ReactNode;
}) {
    const { toast } = useToast();

    const {
        sendMessage: sendStreamMessage,
        isProcessing,
    } = useChatWithStreaming({
        apiEndpoint,
        onUpdateChat: updateChat,
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to get AI response.',
                duration: 3000,
            });
        },
        config: config
    });

    // Send message
    const sendMessage = async (content: string) => {
        if (!currentChatId || !content.trim()) return;

        // Clear input
        if (inputRef.current) {
            inputRef.current.value = '';
        }

        try {
            await sendStreamMessage(currentChatId, currentChat, content);

            // Note: Title update is now handled in useChatWithStreaming
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

        // toast({
        //     title: 'Chat Deleted',
        //     description: 'Chat history has been removed.',
        //     duration: 3000,
        // });
    };

    // Clear all chats
    const clearAllChats = () => {
        clearAllChatsState();

        toast({
            title: 'All Chats Cleared',
            description: 'Your chat history has been cleared.',
            duration: 3000,
        });
    };

    // Context value
    const contextValue = {
        config,
        chats,
        currentChatId,
        currentChat,
        isProcessing,
        isLoadingChats,
        createNewChat,
        deleteChat,
        sendMessage,
        clearAllChats,
        isScrolledUp,
        scrollToBottom,
        inputRef,
        messagesEndRef,
        handleScroll,
        checkScrollState,
        setCurrentChatId: (chatId: string) => {
            if (chatId && chats.some(chat => chat.id === chatId)) {
                updateChat(chatId, {});
                setCurrentChatId(chatId);
            }
        }
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
} 