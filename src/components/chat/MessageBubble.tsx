import { cn } from "@/lib/utils";
import { Bot, Loader2, User } from "lucide-react";
import { Message } from "@/types/chat";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
    message: Message;
    isStreaming?: boolean;
}

export const MessageBubble = ({ message, isStreaming }: MessageBubbleProps) => {
    const isUser = message.sender === "user";

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
                    "flex max-w-[90%] sm:max-w-[85%] flex-col gap-1 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-sm",
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
                                    return match ? (
                                        <SyntaxHighlighter
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
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
                <div className="flex items-center gap-1 text-[10px] sm:text-xs opacity-70">
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
            </div>
            {isUser && (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
            )}
        </div>
    );
}; 