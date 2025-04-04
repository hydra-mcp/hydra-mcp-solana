import { Chat } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { memo, useEffect, useState } from "react";
import { Bot, MessageSquarePlus, ArrowRight, Info, CheckCircle, Loader2, BrainCircuit, Sparkles, Zap, Stars, Lightbulb, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export interface ProcessingStage {
    content: string;
    message: string;
    // 0: start 1: done 2: failed
    status: number;
}

interface ChatContainerProps {
    currentChat: Chat | undefined;
    isStreaming: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    onNewChat?: () => void;
    processingStage?: Array<ProcessingStage>;
}

// 优化性能：对消息气泡组件进行记忆化处理，避免不必要的重新渲染
const MemoizedMessageBubble = memo(MessageBubble);

export const ChatContainer = memo(({
    currentChat,
    isStreaming,
    messagesEndRef,
    onNewChat,
    processingStage
}: ChatContainerProps) => {
    const [, setForceUpdate] = useState(0);

    useEffect(() => {
        if (isStreaming && currentChat?.messages.length) {
            const interval = setInterval(() => {
                setForceUpdate(prev => prev + 1);
            }, 50);

            return () => clearInterval(interval);
        }
    }, [isStreaming, currentChat?.messages.length]);

    if (!currentChat) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome to HYDRA-AI</h2>
                {/* <h2 className="mb-2 text-2xl font-bold">Welcome to HYDRA-AI</h2> */}
                <p className="mb-6 max-w-md text-muted-foreground">
                    I'm your blockchain intelligence assistant. How can I help with project analysis, wallet behavior, or market trends today?
                </p>
            </div >
        );
    }

    if (currentChat.messages.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome to HYDRA-AI</h2>
                {/* <h2 className="mb-2 text-2xl font-bold">Welcome to HYDRA-AI</h2> */}
                <p className="mb-6 max-w-md text-muted-foreground">
                    I'm your blockchain intelligence assistant. How can I help with project analysis, wallet behavior, or market trends today?
                </p>

                <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Analyze Smart Wallets (High-Quality Account Addresses)</h3>
                        <p className="text-sm text-muted-foreground">
                            "Please analyze the smart wallet in this CA: xxxxxxxxxxxxxxxxxxxx"
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Get information</h3>
                        <p className="text-sm text-muted-foreground">
                            "Analyze the liquidity and trading volume trends for this project"
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Solve problems</h3>
                        <p className="text-sm text-muted-foreground">
                            "How can I identify potential high-value wallet behavior patterns?"
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Get insights</h3>
                        <p className="text-sm text-muted-foreground">
                            "Analyze the holding changes for this wallet address"
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-4 p-4">
                {currentChat.messages.map((message, index) => (
                    <MemoizedMessageBubble
                        key={`${message.id}-${isStreaming && index === currentChat.messages.length - 1 ? Date.now() : 'static'}`}
                        message={message}
                        isStreaming={isStreaming && index === currentChat.messages.length - 1 && message.sender === 'ai'}
                    />
                ))}
                {isStreaming && processingStage && (
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
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}); 