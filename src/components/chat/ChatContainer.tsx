import React from 'react';
import { Info, CheckCircle } from 'lucide-react';
import { Chat, ProcessingStage } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { EmptyChatState } from '@/components/chat/EmptyChatState';
import { useChatContext } from '@/context/ChatContext';

interface ChatContainerProps {
    currentChat: Chat | null;
    isStreaming: boolean;
    processingStage: ProcessingStage[];
    onNewChat: () => void;
    messagesEndRef?: React.RefObject<HTMLDivElement>;
}

export function ChatContainer({
    currentChat,
    isStreaming,
    processingStage,
    onNewChat,
    messagesEndRef
}: ChatContainerProps) {
    // Use chat context (optional)
    const context = useChatContext();

    return (
        <div className="py-4 space-y-6">
            {/* If there is no chat history, display empty state */}
            {(!currentChat || currentChat.messages.length === 0) ? (
                <EmptyChatState onNewChat={onNewChat} />
            ) : (
                <div className="space-y-6">
                    {/* Chat message list */}
                    {currentChat.messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                        />
                    ))}

                    {/* Processing stage indicator */}
                    {isStreaming && processingStage.length > 0 && (
                        <div className="space-y-2 py-2">
                            {processingStage.map((stage, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in-50 duration-300"
                                >
                                    {stage.status === 0 && (
                                        <Info className="h-4 w-4 text-blue-500 animate-pulse" />
                                    )}
                                    {stage.status === 1 && (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    <span>{stage.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Message end marker - for automatic scrolling */}
                    {messagesEndRef && <div ref={messagesEndRef} />}
                </div>
            )}
        </div>
    );
} 