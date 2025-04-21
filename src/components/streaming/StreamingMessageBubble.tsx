import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check, Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreamingMessage } from '@/lib/streaming/types';
import { StreamingMessageContent } from '@/components/streaming/StreamingMessageContent';
import { formatTime } from '@/lib/streaming/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    const [isHovering, setIsHovering] = useState(false);
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

    // Enhanced copy button component with different styles for user/AI messages
    const CopyButton = () => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "relative h-6 w-6 rounded-full transition-all duration-200",
                            "hover:scale-110 active:scale-95",
                            isUser
                                ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
                                : "text-muted-foreground/70 hover:text-foreground hover:bg-primary/10",
                            copied && (isUser
                                ? "bg-emerald-500/30 text-white"
                                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400")
                        )}
                        onClick={handleCopy}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        aria-label="Copy message"
                    >
                        {copied ? (
                            <Check className={cn(
                                "h-3.5 w-3.5 transition-transform duration-200",
                                "animate-in zoom-in-50"
                            )} />
                        ) : (
                            <Copy className={cn(
                                "h-3.5 w-3.5 transition-all duration-200",
                                isHovering && "rotate-2"
                            )} />
                        )}
                        <span className={cn(
                            "absolute inset-0 rounded-full bg-current",
                            copied ? "animate-ping opacity-10" : "opacity-0"
                        )} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="text-xs font-medium">
                    {copied ? "Copied!" : "Copy message"}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

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
                    <>
                        <StreamingMessageContent message={message} className="prose-sm max-w-none" />

                        {/* Status Indicator */}
                        {isStreaming && (
                            <div className="flex items-center gap-2 mt-3 mb-1">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs font-medium bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent animate-pulse">Thinking...</span>
                            </div>
                        )}
                    </>
                )}

                {/* Time and action buttons */}
                <div className={cn(
                    "text-xs mt-1.5 text-right flex items-center justify-end gap-2",
                    isUser ? "text-primary-foreground/70" :
                        isError ? "text-red-500" : "text-muted-foreground/70"
                )}>
                    {/* Retry button for errors */}
                    {!isUser && isError && onRetry && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full opacity-70 hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-200"
                            onClick={onRetry}
                        >
                            <RefreshCcw className="h-3 w-3" />
                            <span className="sr-only">Retry</span>
                        </Button>
                    )}

                    {/* Copy button - show for both user and AI messages */}
                    {!isStreaming && message.content && !isAuthError && <CopyButton />}

                    {/* Time display */}
                    <span>{formatTime(message.createdAt)}</span>
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