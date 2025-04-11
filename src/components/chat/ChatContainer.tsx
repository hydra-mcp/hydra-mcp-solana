import React from 'react';
import { Info, CheckCircle, Loader2, XCircle, BrainCircuit, Sparkles } from 'lucide-react';
import { Chat, ProcessingStage } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { EmptyChatState } from '@/components/chat/EmptyChatState';
import { useChatContext } from '@/context/ChatContext';
import { cn } from '@/lib/utils';

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
                    {currentChat.messages.map((message, index) => (
                        <MessageBubble
                            key={`${message.id}-${isStreaming && index === currentChat.messages.length - 1 ? Date.now() : 'static'}`}
                            message={message}
                            isStreaming={isStreaming && index === currentChat.messages.length - 1 && message.sender === 'ai'}
                        />
                    ))}

                    {/* Processing stage indicator */}
                    {isStreaming && processingStage.length > 0 && (
                        <div className="flex flex-col gap-2 text-xs rounded-md bg-primary/5 py-3 px-4 max-w-fit shadow-sm backdrop-blur-sm border border-primary/10">
                            <div className="text-primary font-medium mb-1.5 flex items-center gap-1.5">
                                <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AI Processing Stage</span>
                            </div>
                            {processingStage.map((stage, index) => {
                                const isCompleted = stage.status === 1;
                                const isError = stage.status === 2;
                                const stageText = stage.message.trim();
                                if (!stageText) return null;

                                return (
                                    <div key={index} className="flex items-center gap-2 pl-1">
                                        {stage.content === '' ? (
                                            <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden rounded-full group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-indigo-500/15 to-blue-500/10 rounded-full shadow-inner"></div>
                                                <div className="absolute inset-0 rounded-full opacity-70 mix-blend-overlay bg-gradient-radial from-indigo-200/20 via-transparent to-transparent"></div>
                                                <Sparkles className="h-3.5 w-3.5 text-indigo-400 relative z-10 transition-all duration-700 transform group-hover:scale-110 group-hover:text-indigo-300 animate-pulse-gentle" />
                                                <div className="absolute inset-0 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_18px_rgba(99,102,241,0.5)] transition-shadow duration-500"></div>
                                                <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full">
                                                    <div className="absolute inset-y-0 w-2/3 animate-light-sweep"></div>
                                                </div>
                                            </div>
                                        ) : isError ? (
                                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                        ) : isCompleted ? (
                                            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                        ) : index === processingStage.length - 1 ? (
                                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                                        ) : (
                                            <div className="h-3.5 w-3.5 rounded-full bg-primary/30 shrink-0" />
                                        )}
                                        <span className={cn(
                                            "transition-all duration-300",
                                            isError
                                                ? 'text-red-600 font-medium'
                                                : isCompleted
                                                    ? 'text-green-600 font-medium'
                                                    : stage.content === ''
                                                        ? 'text-indigo-500 font-medium'
                                                        : 'text-muted-foreground'
                                        )}>
                                            {stageText}
                                            {!isCompleted && !isError && index === processingStage.length - 1 ? '...' : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Message end marker - for automatic scrolling */}
                    {messagesEndRef && <div ref={messagesEndRef} />}
                </div>
            )}
        </div>
    );
} 