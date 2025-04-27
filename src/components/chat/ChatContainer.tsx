import React, { useCallback, useState, useEffect, Dispatch, SetStateAction, useMemo } from 'react';
import { Chat } from '@/types/chat';
import { StreamingMessageBubble } from '@/components/streaming/StreamingMessageBubble';
import { EmptyChatState } from './EmptyChatState';
import { StreamingMessage } from '@/lib/streaming/types';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { useChatContext } from '@/context/ChatContext';

interface ChatContainerProps {
    currentChat: Chat | null;
    onNewChat: () => void;
    transformY?: string;
    paddingTop?: string;
    onRetry?: () => void;
    setInputValue: Dispatch<SetStateAction<string>>;
}

export function ChatContainer({
    currentChat,
    onNewChat,
    transformY = 'translateY(0)',
    paddingTop = '4rem',
    onRetry,
    setInputValue
}: ChatContainerProps) {
    const { isLoadingChats } = useChatContext();
    const [lastError, setLastError] = useState<{
        message: string;
        type?: string;
        status?: number;
    } | null>(null);

    let isStreaming = false;
    let streamingContext;

    try {
        streamingContext = useStreaming();
        isStreaming = streamingContext.isStreaming;

        // use useEffect to listen to the streaming status change, reset the error status when a new stream starts
        useEffect(() => {
            if (isStreaming) {
                // when a new stream starts, reset the previous error status
                setLastError(null);
            }
        }, [isStreaming]);

        // This effect should only update lastError if the last message IS an error
        useEffect(() => {
            if (!streamingContext || !streamingContext.messages || streamingContext.messages.length === 0) {
                setLastError(null);
                return;
            }
            const lastMessage = streamingContext.messages[streamingContext.messages.length - 1];
            if (lastMessage && lastMessage.status === 'error' && lastMessage.sender === 'ai') {
                if (!lastError || lastError.message !== lastMessage.content) { // Only update if error changed
                    setLastError({
                        message: lastMessage.content,
                        type: lastMessage.metadata?.errorType,
                        status: lastMessage.metadata?.errorStatus
                    });
                }
            } else if (lastError) {
                // If the last message is NOT an error, clear the error state
                setLastError(null);
            }
        }, [streamingContext?.messages, lastError]); // Depend on messages array reference

    } catch (error) {
        // console.log('StreamingProvider not available, using chat metadata for stages');
        // Ensure lastError is cleared if context is unavailable
        useEffect(() => {
            setLastError(null);
        }, []);
    }

    const handleRetryMessage = useCallback(() => {
        setLastError(null); // Clear error on retry
        if (onRetry) {
            onRetry();
        }
    }, [onRetry]);

    // Memoize the message transformation logic
    const messages = useMemo(() => {
        if (!currentChat || !currentChat.messages) return [];

        // Get the ID of the actual last message in the original array for comparison
        const actualLastMessageId = currentChat.messages.length > 0
            ? currentChat.messages[currentChat.messages.length - 1].id
            : null;

        return currentChat.messages
            .filter(msg => msg.sender !== 'system')
            .map(msg => {
                const isLastErrorTarget = msg.sender === 'ai' && msg.id === actualLastMessageId && lastError;

                // Create the base message object
                const streamingMsg: StreamingMessage = {
                    id: msg.id,
                    content: isLastErrorTarget ? lastError.message : msg.content,
                    sender: msg.sender as 'user' | 'ai' | 'system',
                    status: isLastErrorTarget ? 'error' : 'completed',
                    createdAt: msg.createdAt,
                    metadata: isLastErrorTarget ? {
                        errorType: lastError.type,
                        errorStatus: lastError.status
                    } : undefined
                };

                return streamingMsg;
            });
        // Dependencies: Only recompute when the original messages array or lastError changes
    }, [currentChat?.messages, lastError]);

    if (isLoadingChats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Loading chat history...</p>
                </div>
            </div>
        );
    }

    if (!currentChat || currentChat.messages.length === 0) {
        return <EmptyChatState onNewChat={onNewChat} setInputValue={setInputValue} />;
    }

    // Use the memoized messages array
    if (messages.length === 0) {
        return <EmptyChatState onNewChat={onNewChat} setInputValue={setInputValue} />;
    }

    // Determine if the *very last* message in the *memoized* list should show streaming indicator
    const lastMemoizedMessage = messages[messages.length - 1];
    const showStreamingIndicator = isStreaming &&
        lastMemoizedMessage?.sender === 'ai' &&
        lastMemoizedMessage?.status !== 'error'; // Only show if not error

    return (
        <div className="py-16 space-y-4" style={{ transform: transformY, transition: 'transform 0.3s ease-in-out' }}>
            <div className="space-y-6">
                {messages.map((message) => (
                    <StreamingMessageBubble
                        key={message.id}
                        message={message} // Pass the memoized message object
                        // Pass streaming status specifically for *this* message
                        isStreaming={showStreamingIndicator && message.id === lastMemoizedMessage.id}
                        onRetry={message.status === 'error' ? handleRetryMessage : undefined}
                    />
                ))}
            </div>
        </div>
    );
} 