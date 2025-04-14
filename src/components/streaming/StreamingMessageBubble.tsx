import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check, Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreamingMessage } from '@/lib/streaming/types';
import { StreamingMessageContent } from '@/components/streaming/StreamingMessageContent';
import { formatTime } from '@/lib/streaming/utils';

interface StreamingMessageBubbleProps {
    message: StreamingMessage;
    className?: string;
    isStreaming?: boolean; // Allow external control of streaming state
    onRetry?: () => void; // Add callback for retry action
}

export function StreamingMessageBubble({
    message,
    className,
    isStreaming: externalStreaming,
    onRetry
}: StreamingMessageBubbleProps) {
    const [copied, setCopied] = useState(false);
    const isUser = message.sender === 'user';

    if (message.sender === 'system') {
        return null;
    }

    // Use external streaming state if provided, otherwise use message status
    const isStreaming = externalStreaming !== undefined
        ? externalStreaming
        : message.status === 'streaming' || message.status === 'pending';

    // Check if message has an error
    const isError = message.status === 'error';

    // Check if error is related to authentication
    const isAuthError = isError && message.metadata?.errorType === 'auth_error';

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
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0",
                    isError ? "bg-red-500" : "bg-primary"
                )}>
                    {isStreaming ? (
                        <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                    ) : isError ? (
                        <AlertCircle className="h-4 w-4 text-primary-foreground" />
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
                    : isError
                        ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-tl-none"
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
                    "text-xs mt-1 text-right flex items-center justify-end gap-2",
                    isUser ? "text-primary-foreground opacity-70" :
                        isError ? "text-red-500" : "text-muted-foreground opacity-70"
                )}>
                    {/* Retry button for errors */}
                    {!isUser && isError && onRetry && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full opacity-70 hover:opacity-100"
                            onClick={onRetry}
                        >
                            <RefreshCcw className="h-3 w-3" />
                            <span className="sr-only">Retry</span>
                        </Button>
                    )}

                    {/* Copy button - only show for non-user and non-streaming state */}
                    {!isUser && !isStreaming && message.content && !isAuthError && (
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