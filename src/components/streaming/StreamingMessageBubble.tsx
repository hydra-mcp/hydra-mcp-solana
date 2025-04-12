import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreamingMessage } from '@/lib/streaming/types';
import { StreamingMessageContent } from '@/components/streaming/StreamingMessageContent';
import { formatTime } from '@/lib/streaming/utils';

interface StreamingMessageBubbleProps {
    message: StreamingMessage;
    className?: string;
    isStreaming?: boolean; // Allow external control of streaming state
}

export function StreamingMessageBubble({ message, className, isStreaming: externalStreaming }: StreamingMessageBubbleProps) {
    const [copied, setCopied] = useState(false);
    const isUser = message.sender === 'user';

    if (message.sender === 'system') {
        return null;
    }

    // Use external streaming state if provided, otherwise use message status
    const isStreaming = externalStreaming !== undefined
        ? externalStreaming
        : message.status === 'streaming' || message.status === 'pending';

    // Handle copy
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    // User and AI messages
    return (
        <div
            className={cn(
                "flex mb-4 w-full",
                isUser ? "justify-end" : "justify-start",
                className
            )}
            data-message-id={message.id}
        >
            {/* AI avatar */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
                    {isStreaming ? (
                        <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                    ) : (
                        <Bot className="h-4 w-4 text-primary-foreground" />
                    )}
                </div>
            )}

            {/* Message content */}
            <div className={cn(
                "rounded-xl p-3 max-w-[80%]",
                isUser
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-muted-foreground rounded-tl-none"
            )}>
                {/* Handle content based on sender */}
                {isUser ? (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                ) : (
                    <StreamingMessageContent message={message} className="prose-sm max-w-none" />
                )}

                {/* Time and action buttons */}
                <div className={cn(
                    "text-xs mt-1 text-right opacity-70 flex items-center justify-end gap-2",
                    isUser ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                    {/* Copy button - only show for non-user and non-streaming state */}
                    {!isUser && !isStreaming && message.content && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full opacity-50 hover:opacity-100"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-3 w-3" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                            <span className="sr-only">Copy</span>
                        </Button>
                    )}

                    {/* Status and time */}
                    {isStreaming && !isUser ? (
                        <span className="animate-pulse">Thinking...</span>
                    ) : (
                        <span>{formatTime(message.createdAt)}</span>
                    )}
                </div>
            </div>

            {/* User avatar */}
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center ml-2 flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                </div>
            )}
        </div>
    );
} 