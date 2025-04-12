import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/context/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { MessageInput } from '@/components/MessageInput';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { StageDisplay } from '@/components/streaming/StageDisplay';

interface ChatInterfaceProps {
    modalMode?: boolean;
    sidebarEnabled?: boolean;
    className?: string;
    showScrollToBottom?: boolean;
}

export function ChatInterface({
    modalMode = false,
    sidebarEnabled = true,
    className,
    showScrollToBottom = true
}: ChatInterfaceProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    const [isLocalStreaming, setIsLocalStreaming] = useState(false);
    let streamingState = { isStreaming: isLocalStreaming, stages: [] };

    streamingState = useStreaming();
    const { isStreaming, stages = [] } = streamingState;

    const validStages = stages.filter(stage =>
        (stage.message && stage.message.trim() !== '') ||
        (stage.content && stage.content.trim() !== '')
    );
    const hasValidStages = validStages.length > 0;

    const showStage = isStreaming && hasValidStages;
    const stageRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const {
        currentChat,
        isScrolledUp,
        scrollToBottom,
        inputRef,
        createNewChat,
        config,
        messagesEndRef,
        handleScroll,
        checkScrollState
    } = useChatContext();

    useEffect(() => {
        if (!currentChat?.messages) return;

        const rafId = requestAnimationFrame(() => {
            checkScrollState();
        });

        return () => cancelAnimationFrame(rafId);
    }, [currentChat?.messages, checkScrollState]);

    // Window click event, keep input focus (modal mode)
    const handleWindowClick = (e: React.MouseEvent) => {
        const scrollAreaElement = document.querySelector('.scroll-area');
        const target = e.target as HTMLElement;
        const isScrollAreaClick = scrollAreaElement?.contains(target);

        if (modalMode && !isScrollAreaClick) {
            inputRef.current?.focus();
        }
    };

    // Auto focus input in modal mode
    useEffect(() => {
        if (modalMode) {
            const focusInterval = setInterval(() => {
                if (document.activeElement !== inputRef.current) {
                    inputRef.current?.focus();
                } else {
                    clearInterval(focusInterval);
                }
            }, 500);

            return () => clearInterval(focusInterval);
        }
    }, [modalMode, inputRef]);

    const [transformY, setTransformY] = useState('translateY(0)');
    useEffect(() => {
        const transformY = showStage ? validStages.length * 2 + 2 : 0;
        setTransformY(`translateY(-${transformY}rem)`);
    }, [validStages]);

    return (
        <div
            onClick={handleWindowClick}
            className={cn(
                modalMode && 'h-full flex flex-col',
                className
            )}
        >
            {/* Sidebar - show in non-modal mode */}
            {!modalMode && sidebarEnabled && (
                <ChatSidebar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                />
            )}

            {/* Main chat area */}
            <main className={cn(
                'relative z-20',
                modalMode ? 'flex flex-col h-full pb-2' : 'min-h-screen pt-14 pb-2',
                !modalMode && sidebarEnabled && isSidebarOpen ? 'lg:pl-72' : '',
                'transition-all duration-300'
            )}>
                <div className={cn(
                    modalMode ? 'h-full flex flex-col' : 'container mx-auto h-full py-4',
                    'transition-all duration-300'
                )}>
                    {/* App description */}
                    {config.appDefinition?.description && (
                        <div className="mb-4 mt-4 mx-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center gap-3">
                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <span className="font-medium">{config.appDefinition.title}: </span>
                                    {config.appDefinition.description}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message area - add CSS hardware acceleration and optimize scrolling performance */}
                    <ScrollArea
                        ref={scrollAreaRef}
                        className={cn(
                            "scroll-area",
                            "rounded-lg border bg-background/5 shadow-inner flex-1 overflow-auto",
                            "will-change-scroll transform-gpu",
                            modalMode
                                ? config.appDefinition?.description
                                    ? "h-[calc(100%-8rem)]"
                                    : "h-[calc(100%-4.5rem)]"
                                : config.appDefinition?.description
                                    ? "h-[calc(100vh-14rem)]"
                                    : "h-[calc(100vh-10.5rem)]"
                        )}
                        onScroll={handleScroll}
                    >
                        <div className="px-4 relative will-change-transform">
                            <ChatContainer
                                currentChat={currentChat}
                                onNewChat={createNewChat}
                                transformY={transformY}
                            />

                            {/* Message end reference - put after Stage */}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </ScrollArea>
                    {/* showStage &&  */}
                    {showStage && (
                        <div
                            ref={stageRef}
                            className={cn(
                                "mt-4 mb-2 max-w-[90%]",
                                "bg-background/35 backdrop-blur-sm",
                                "border border-primary/10 shadow-md rounded-lg",
                                "animate-fade-in will-change-transform",
                                "fixed bottom-16 left-1/2 -translate-x-1/2"
                            )}
                        >
                            <StageDisplay
                                stages={validStages}
                                className="rounded-lg"
                            />
                        </div>
                    )}

                    {/* Scroll to bottom button */}
                    {isScrolledUp && showScrollToBottom && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className={cn(
                                "z-50 fixed rounded-full shadow-lg transition-transform hover:scale-110 animate-bounce-slow",
                                modalMode ? "bottom-24 right-6" : "bottom-24 right-6",
                                !modalMode && sidebarEnabled && isSidebarOpen ? "lg:right-6" : "right-6"
                            )}
                            onClick={scrollToBottom}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </main>

            {/* Input area */}
            <footer className={cn(
                "border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-lg z-40",
                "fixed bottom-0 z-20",
                !modalMode && sidebarEnabled && isSidebarOpen ? 'lg:left-72' : 'left-0',
                'right-0 transition-all duration-300'
            )}>
                <div className="container mx-auto py-2.5 sm:py-3">
                    <div className="px-4">
                        <MessageInput
                            autoFocus={modalMode}
                            placeholder="Type your message..."
                            disabled={isStreaming}
                            className="max-h-[80px]"
                        />
                    </div>
                </div>
            </footer>
        </div>
    );
} 