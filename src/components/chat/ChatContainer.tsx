import React, { useCallback, useState, useEffect, Dispatch, SetStateAction } from 'react';
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

        const lastMessage = streamingContext.messages[streamingContext.messages.length - 1];
        if (lastMessage && lastMessage.status === 'error' && lastMessage.sender === 'ai') {
            if (!lastError && lastMessage.content.startsWith('Error:')) {
                setLastError({
                    message: lastMessage.content,
                    type: lastMessage.metadata?.errorType,
                    status: lastMessage.metadata?.errorStatus
                });
            }
        }
    } catch (error) {
        console.log('StreamingProvider not available, using chat metadata for stages');
    }

    const handleRetryMessage = useCallback(() => {
        setLastError(null);
        if (onRetry) {
            onRetry();
        }
    }, [onRetry]);

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

    const messages = currentChat.messages
        .filter(msg => msg.sender !== 'system')
        .map(msg => {
            const streamingMsg: StreamingMessage = {
                id: msg.id,
                content: msg.content,
                sender: msg.sender as 'user' | 'ai' | 'system',
                status: 'completed',
                createdAt: msg.createdAt
            };

            if (msg.sender === 'ai' && msg === currentChat.messages[currentChat.messages.length - 1] && lastError) {
                streamingMsg.status = 'error';
                streamingMsg.content = lastError.message || msg.content;
                streamingMsg.metadata = {
                    errorType: lastError.type,
                    errorStatus: lastError.status
                };
            }

            return streamingMsg;
        });

    if (messages.length === 0) {
        return <EmptyChatState onNewChat={onNewChat} setInputValue={setInputValue} />;
    }

    return (
        <div className="py-16 space-y-4" style={{ transform: transformY, transition: 'transform 0.3s ease-in-out' }}>
            <div className="space-y-6">
                {messages.map((message) => (
                    <StreamingMessageBubble
                        key={message.id}
                        message={message}
                        isStreaming={isStreaming && message.sender === 'ai' && message === messages[messages.length - 1] && message.status !== 'error'}
                        onRetry={message.status === 'error' ? handleRetryMessage : undefined}
                    />
                ))}
            </div>
        </div>
    );
} 