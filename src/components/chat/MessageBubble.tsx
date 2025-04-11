import React from 'react';
import { cn, copyToClipboard } from "@/lib/utils";
import { Bot, Loader2, User, Copy, Check, Info } from "lucide-react";
import { Message } from "@/types/chat";
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageBubbleProps {
    message: Message;
    isStreaming?: boolean;
    className?: string;
}

export function MessageBubble({ message, isStreaming, className }: MessageBubbleProps) {
    const isUser = message.sender === "user";
    const isSystem = message.sender === "system";
    const [copied, setCopied] = useState(false);
    const [copiedCodeBlockIndex, setCopiedCodeBlockIndex] = useState<number | null>(null);

    // Copy the entire message content
    const handleCopy = async () => {
        const success = await copyToClipboard(message.content, false);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Copy the code block content
    const handleCopyCode = useCallback(async (code: string, index: number) => {
        const success = await copyToClipboard(code, false);
        if (success) {
            setCopiedCodeBlockIndex(index);
            setTimeout(() => setCopiedCodeBlockIndex(null), 2000);
        }
    }, []);

    // System message style
    if (isSystem) {
        return (
            <div className={cn(
                "flex items-center p-3 rounded-md bg-muted/50 border border-muted mb-4 w-full",
                className
            )}>
                <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">{message.content}</div>
            </div>
        );
    }

    // User message and AI message
    return (
        <div className={cn(
            "flex mb-4 w-full",
            isUser ? "justify-end" : "justify-start",
            className
        )}>
            {/* Message icon (non-user message) */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
            )}

            {/* Message content */}
            <div className={cn(
                "rounded-xl p-3 max-w-[80%]",
                isUser
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-muted-foreground rounded-tl-none"
            )}>
                {isUser ? (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                ) : (
                    <MarkdownRenderer content={message.content} className="prose-sm max-w-none" />
                )}

                {/* Message time */}
                <div className={cn(
                    "text-xs mt-1 text-right opacity-70",
                    isUser ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                    {isStreaming && !isUser ? (
                        "Thinking..."
                    ) : (
                        new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    )}
                </div>
            </div>

            {/* User avatar (user message) */}
            {isUser && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center ml-2 flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                </div>
            )}
        </div>
    );
} 