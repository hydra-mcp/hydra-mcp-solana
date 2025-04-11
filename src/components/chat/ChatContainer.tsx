import React from 'react';
import { Chat } from '@/types/chat';
import { StreamingMessageBubble } from '@/components/streaming/StreamingMessageBubble';
import { EmptyChatState } from './EmptyChatState';
import { StageDisplay } from '@/components/streaming/StageDisplay';
import { StreamingMessage, StreamingStage } from '@/lib/streaming/types';
import { useStreaming } from '@/lib/streaming/StreamingContext';

interface ChatContainerProps {
    currentChat: Chat | null;
    onNewChat: () => void;
    messagesEndRef?: React.RefObject<HTMLDivElement>;
}

export function ChatContainer({
    currentChat,
    onNewChat,
    messagesEndRef
}: ChatContainerProps) {
    // Get streaming context if available
    let streamingStages: StreamingStage[] = [];
    let isStreaming = false;

    try {
        const streamingContext = useStreaming();
        streamingStages = streamingContext.stages;
        isStreaming = streamingContext.isStreaming;
    } catch (error) {
        console.log('StreamingProvider not available, using chat metadata for stages');
    }

    // Get stages from chat metadata if available
    const metadataStages = currentChat?.metadata?.stages || [];

    // Combine both sources of stages, with StreamingContext taking precedence
    // Filter out stages that don't have any content to display
    const validStages = streamingStages.length > 0 ? streamingStages : metadataStages;
    const hasValidStages = validStages.some(stage =>
        (stage.message && stage.message.trim() !== '') ||
        (stage.content && stage.content.trim() !== '')
    );

    // 无聊天历史时显示空状态
    if (!currentChat || currentChat.messages.length === 0) {
        return <EmptyChatState onNewChat={onNewChat} />;
    }

    // 将常规消息转换为标准显示格式
    const messages = currentChat.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'ai' | 'system',
        status: 'completed',
        createdAt: msg.createdAt
    } as StreamingMessage));

    return (
        <div className="py-4 space-y-6">
            <div className="space-y-6">
                {/* 聊天消息列表 */}
                {messages.map((message) => (
                    <StreamingMessageBubble
                        key={message.id}
                        message={message}
                        isStreaming={isStreaming && message.sender === 'ai' && message === messages[messages.length - 1]}
                    />
                ))}

                {/* Display stages only if we have valid stages with content */}
                {isStreaming && hasValidStages && (
                    <StageDisplay
                        stages={validStages}
                        className="mx-4 my-2"
                    />
                )}

                {/* 消息结束标记 - 用于自动滚动 */}
                {messagesEndRef && <div ref={messagesEndRef} />}
            </div>
        </div>
    );
} 