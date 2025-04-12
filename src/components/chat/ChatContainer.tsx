import React from 'react';
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
}

export function ChatContainer({
    currentChat,
    onNewChat,
    transformY = 'translateY(0)'
}: ChatContainerProps) {
    const { isLoadingChats } = useChatContext();

    // Get streaming context if available
    let isStreaming = false;

    try {
        const streamingContext = useStreaming();
        isStreaming = streamingContext.isStreaming;
    } catch (error) {
        console.log('StreamingProvider not available, using chat metadata for stages');
    }

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

    // Show empty state when there is no chat history
    if (!currentChat || currentChat.messages.length === 0) {
        return <EmptyChatState onNewChat={onNewChat} />;
    }

    // Convert regular messages to standard display format
    const messages = currentChat.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'ai' | 'system',
        status: 'completed',
        createdAt: msg.createdAt
    } as StreamingMessage));

    return (
        <div className="py-16 space-y-4" style={{ transform: transformY, transition: 'transform 0.3s ease-in-out' }}>
            <div className="space-y-6">
                {/* Chat message list */}
                {messages.map((message) => (
                    <StreamingMessageBubble
                        key={message.id}
                        message={message}
                        isStreaming={isStreaming && message.sender === 'ai' && message === messages[messages.length - 1]}
                    />
                ))}

                {/* Message end marker moved to ChatInterface component */}
            </div>
        </div>
    );
} 