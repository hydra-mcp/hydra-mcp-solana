import { cn, copyToClipboard } from "@/lib/utils";
import { Bot, Loader2, User, Copy, Check } from "lucide-react";
import { Message } from "@/types/chat";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageBubbleProps {
    message: Message;
    isStreaming?: boolean;
}

export const MessageBubble = ({ message, isStreaming }: MessageBubbleProps) => {
    const isUser = message.sender === "user";
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

    return (
        <div
            className={cn(
                "flex w-full gap-2 sm:gap-3 p-2 sm:p-4",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {!isUser && (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
            )}
            <div
                className={cn(
                    "flex max-w-[90%] sm:max-w-[85%] flex-col gap-1 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-sm group relative",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                )}
            >
                <div className="prose prose-sm dark:prose-invert break-words max-w-none">
                    {isUser ? (
                        message.content
                    ) : (
                        <ReactMarkdown
                            components={{
                                code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeContent = String(children).replace(/\n$/, '');
                                    const codeBlockIndex = message.content.indexOf(codeContent);

                                    return match ? (
                                        <div className="relative group/code">
                                            <div className="absolute -top-1 right-1 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="secondary"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => handleCopyCode(codeContent, codeBlockIndex)}
                                                            >
                                                                {copiedCodeBlockIndex === codeBlockIndex ? (
                                                                    <Check className="h-3.5 w-3.5" />
                                                                ) : (
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                )}
                                                                <span className="sr-only">Copy code</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            {copiedCodeBlockIndex === codeBlockIndex ? "Copied!" : "Copy code"}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <SyntaxHighlighter
                                                style={vscDarkPlus as any}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                            >
                                                {codeContent}
                                            </SyntaxHighlighter>
                                        </div>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
                <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs opacity-70">
                    <div className="flex items-center gap-1">
                        {isUser ? (
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        ) : isStreaming ? (
                            <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin" />
                        ) : (
                            <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        )}
                        <span>
                            {isStreaming && !isUser ? (
                                "Thinking..."
                            ) : (
                                new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })
                            )}
                        </span>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                    <span className="sr-only">Copy message</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                {copied ? "Copied!" : "Copy message"}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            {isUser && (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
            )}
        </div>
    );
}; 