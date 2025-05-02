import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, Info, Menu, RefreshCcw, Plus, ActivitySquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/context/ChatContext';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { StageDisplay } from '@/components/streaming/StageDisplay';
import { useTheme } from '@/hooks/use-theme';
import { StageStatus } from '@/lib/streaming/types';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInterfaceProps {
    modalMode?: boolean;
    sidebarEnabled?: boolean;
    className?: string;
    showScrollToBottom?: boolean;
    scrollButtonThreshold?: number;
}

export function ChatInterface({
    modalMode = false,
    sidebarEnabled = true,
    className,
    showScrollToBottom = true,
    scrollButtonThreshold = 100
}: ChatInterfaceProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const { isDarkMode } = useTheme();
    const [hasStageError, setHasStageError] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [forceShowStages, setForceShowStages] = useState(false);
    const [allStagesCompleted, setAllStagesCompleted] = useState(false);

    const [isLocalStreaming, setIsLocalStreaming] = useState(false);
    let streamingState = {
        isStreaming: isLocalStreaming,
        stages: [],
        messages: [],
        clearMessages: () => { }
    };

    try {
        streamingState = useStreaming();
    } catch (error) {
        console.log('StreamingProvider not available in this context');
    }

    const { isStreaming, stages = [], clearMessages, messages = [] } = streamingState;

    const validStages = stages.filter(stage =>
        (stage.message && stage.message.trim() !== '') ||
        (stage.content && stage.content.trim() !== '')
    );
    const hasValidStages = validStages.length > 0;

    // Check if all stages are completed
    useEffect(() => {
        if (!hasValidStages) {
            setAllStagesCompleted(false);
            return;
        }

        const allCompleted = validStages.every(stage =>
            stage.status === StageStatus.Completed ||
            stage.status === StageStatus.Error ||
            stage.status === StageStatus.Warning
        );

        setAllStagesCompleted(allCompleted);
    }, [validStages, hasValidStages]);

    // Update hasStageError whenever validStages changes
    useEffect(() => {
        if (hasValidStages) {
            const lastStage = validStages[validStages.length - 1];
            setHasStageError(lastStage.status === StageStatus.Error);
        } else {
            setHasStageError(false);
        }
    }, [validStages, hasValidStages]);

    // Also check if the messages have an error status
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.status === 'error') {
                setHasStageError(true);
            }
        }
    }, [messages]);

    // Reset force show stages when new message is sent
    useEffect(() => {
        if (isStreaming) {
            setForceShowStages(false);
        }
    }, [isStreaming]);

    // Changed showStage logic to allow StageDisplay to handle its own collapsing
    // When all stages are completed, we still want to show the StageDisplay so it can display its collapsed state
    const showStage = hasValidStages;
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
        checkScrollState,
        sendMessage,
        isProcessing
    } = useChatContext();

    // reset error status when sending message
    const handleSendMessage = useCallback((message: string) => {
        // reset error status when sending message
        setHasStageError(false);
        // reset force show stages
        setForceShowStages(false);
        // clear the status and error in StreamingContext before sending a new message
        if (clearMessages) {
            clearMessages();
        }
        sendMessage(message);
    }, [sendMessage, setHasStageError, clearMessages]);

    useEffect(() => {
        if (!currentChat?.messages) return;

        // only check scroll state once after messages are loaded
        // use setTimeout instead of requestAnimationFrame
        // to avoid frequent scroll check, causing user manual scroll to be interrupted
        const timerId = setTimeout(() => {
            checkScrollState();
        }, 300);

        return () => clearTimeout(timerId);
    }, [currentChat?.messages, checkScrollState]);

    // Window click event, keep input focus (modal mode)
    const handleWindowClick = (e: React.MouseEvent) => {
        const scrollAreaElement = document.querySelector('.scroll-area');
        const sidebarElement = document.querySelector('.chat-sidebar');
        const target = e.target as HTMLElement;
        const isScrollAreaClick = scrollAreaElement?.contains(target);
        const isSidebarClick = sidebarElement?.contains(target);
        const isSidebarToggleClick = (target as HTMLElement).closest('[aria-label="Open sidebar"], [aria-label="Close sidebar"]');

        // Close sidebar when clicking outside of it (but not on the toggle button)
        if (sidebarEnabled && isSidebarOpen && !isSidebarClick && !isSidebarToggleClick) {
            setIsSidebarOpen(false);
        }

        if (modalMode && !isScrollAreaClick) {
            inputRef.current?.focus();
        }
    };

    // Global click handler to close sidebar
    useEffect(() => {
        if (!sidebarEnabled) return;

        const handleGlobalClick = (e: MouseEvent) => {
            const sidebarElement = document.querySelector('.chat-sidebar');
            const target = e.target as HTMLElement;
            const isSidebarClick = sidebarElement?.contains(target);
            const isSidebarToggleClick = (target as HTMLElement).closest('[aria-label="Open sidebar"], [aria-label="Close sidebar"]');

            if (isSidebarOpen && !isSidebarClick && !isSidebarToggleClick) {
                setIsSidebarOpen(false);
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleGlobalClick);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [isSidebarOpen, sidebarEnabled, setIsSidebarOpen]);

    // Auto close sidebar when resizing to mobile view
    useEffect(() => {
        if (!sidebarEnabled) return;

        const handleResize = () => {
            // Close sidebar on smaller screens automatically
            if (window.innerWidth < 1024 && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isSidebarOpen, sidebarEnabled, setIsSidebarOpen]);

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

    // Refs for measurement and dynamic padding
    const stageDisplayRef = useRef<HTMLDivElement>(null);
    const scrollContentRef = useRef<HTMLDivElement>(null);

    // State for dynamic padding based on StageDisplay height
    const [stageDisplayHeight, setStageDisplayHeight] = useState(0);

    // Effect to measure StageDisplay height and set padding for scroll area
    useEffect(() => {
        const element = stageDisplayRef.current;
        if (!element || !showStage) {
            // Reset height if StageDisplay is not shown or ref is not available
            if (stageDisplayHeight !== 0) {
                setStageDisplayHeight(0);
            }
            return;
        }

        // Use ResizeObserver to dynamically update height
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                // Add buffer (e.g., 1rem or 16px) to the measured height
                const newHeight = entry.contentRect.height + 16;
                // Only update state if height actually changed to avoid loops
                if (newHeight !== stageDisplayHeight) {
                    setStageDisplayHeight(newHeight);
                }
            }
        });

        resizeObserver.observe(element);

        // Perform an initial measurement in case ResizeObserver doesn't fire immediately
        const initialHeight = element.offsetHeight + 16;
        if (initialHeight !== stageDisplayHeight) {
            setStageDisplayHeight(initialHeight);
        }

        // Cleanup observer on unmount or when element/showStage changes
        return () => {
            resizeObserver.disconnect();
        };
        // Re-run effect if showStage changes or if the initial measurement was 0
    }, [showStage, stageDisplayHeight]);

    const handleRetry = useCallback(() => {
        if (!currentChat || !currentChat.messages || currentChat.messages.length === 0 || isProcessing) {
            return;
        }

        // find the last user message, for retry
        const messagesWithoutSystem = currentChat.messages.filter(msg => msg.sender !== 'system');
        let lastUserMessageIndex = -1;

        // find the last user message, for retry
        for (let i = messagesWithoutSystem.length - 1; i >= 0; i--) {
            if (messagesWithoutSystem[i].sender === 'user') {
                lastUserMessageIndex = i;
                break;
            }
        }

        if (lastUserMessageIndex === -1) {
            console.warn("no user message found for retry");
            return;
        }

        // get the last user message, for retry
        const lastUserMessage = messagesWithoutSystem[lastUserMessageIndex];

        // clean up the process:
        // 1. close the current stream, reset the error status
        if (clearMessages) {
            clearMessages();
        }

        // 2. retry the message
        console.log(`retry message: ${lastUserMessage.content}`);

        try {
            sendMessage(lastUserMessage.content);

            // 3. scroll to the bottom
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        } catch (error) {
            console.error("retry message failed:", error);
        }
    }, [currentChat, sendMessage, scrollToBottom, clearMessages, isProcessing]);

    // ref for the bottom detector element
    const bottomDetectorRef = useRef<HTMLDivElement>(null);

    // use useEffect to handle the setup and cleanup of IntersectionObserver
    useEffect(() => {
        const detector = bottomDetectorRef.current;
        if (!detector || !showScrollToBottom) return;

        const observer = new IntersectionObserver((entries) => {
            // when the element is in view, it means it has scrolled to the bottom
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    checkScrollState();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(detector);

        // cleanup when the component unmounts
        return () => {
            observer.disconnect();
        };
    }, [showScrollToBottom, checkScrollState]);

    // Debounce the scroll handler to improve performance
    const debouncedHandleScroll = useCallback(
        (() => {
            let timeoutId: ReturnType<typeof setTimeout>;
            return (e: React.UIEvent<HTMLDivElement>) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    handleScroll(e);
                }, 50); // 50ms debounce
            };
        })(),
        [handleScroll]
    );

    return (
        <div
            onClick={handleWindowClick}
            className={cn(
                modalMode && 'h-full flex flex-col',
                className
            )}
        >
            {/* Sidebar - show when enabled and toggled */}
            {sidebarEnabled && (
                <ChatSidebar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    className="chat-sidebar"
                />
            )}

            {/* Main chat area */}
            <main className={cn(
                'relative z-20',
                modalMode ? 'flex flex-col h-full pb-2' : 'min-h-screen pt-14 pb-2',
                !modalMode && sidebarEnabled && isSidebarOpen ? 'lg:pl-72' : '',
                'transition-all duration-300 will-change-auto'
            )}>
                <div className={cn(
                    modalMode ? 'h-full flex flex-col' : 'container mx-auto h-full py-4',
                    'transition-all duration-300'
                )}>
                    {/* Sidebar Toggle Button */}
                    {sidebarEnabled && modalMode && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleSidebar}
                            className={cn(
                                "fixed top-16 left-6 z-30 rounded-full shadow-md transition-all duration-300 hover:scale-105",
                                "backdrop-blur-sm border",
                                isDarkMode
                                    ? "hover:bg-blue-500/15 border-blue-800/30 text-blue-300 bg-gray-800/80"
                                    : "hover:bg-blue-500/15 border-blue-300/50 text-blue-600 bg-white/80"
                            )}
                            style={{ marginTop: '-8px' }}
                            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            <Menu className={cn(
                                "h-4 w-4",
                                isDarkMode ? "text-blue-300" : "text-blue-600",
                                isSidebarOpen ? "" : "animate-pulse"
                            )} />
                        </Button>
                    )}

                    {/* New Chat Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        // clearMessages is now called within createNewChat via context
                                        createNewChat();
                                    }}
                                    className={cn(
                                        "fixed z-30 rounded-full shadow-md transition-all duration-300 hover:scale-105 group",
                                        "backdrop-blur-sm border",
                                        modalMode
                                            ? "top-16 right-6"
                                            : "top-6 right-6 lg:right-12",
                                        isDarkMode
                                            ? "hover:bg-blue-500/15 border-blue-800/30 text-blue-300 bg-gray-800/80"
                                            : "hover:bg-blue-500/15 border-blue-300/50 text-blue-600 bg-white/80",
                                        !modalMode && sidebarEnabled && isSidebarOpen
                                            ? "lg:right-[calc(80px+1rem)]"
                                            : ""
                                    )}
                                    style={{ marginTop: modalMode ? '-8px' : '0' }}
                                    aria-label="New chat"
                                >
                                    <Plus className={cn(
                                        "h-4 w-4",
                                        isDarkMode ? "text-blue-300" : "text-blue-600",
                                        "transition-transform duration-300 group-hover:rotate-90"
                                    )} />
                                    <span className="sr-only">New chat</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Start a new chat</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* App description */}
                    {config.appDefinition?.description && (
                        <div className="mb-4 mt-4 mx-4 p-3 pl-12 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center gap-3 overflow-hidden">
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
                            "will-change-transform will-change-scroll transform-gpu",
                            modalMode
                                ? config.appDefinition?.description
                                    ? "h-[calc(100%-8rem)]"
                                    : "h-[calc(100%-4.5rem)]"
                                : config.appDefinition?.description
                                    ? "h-[calc(100vh-14rem)]"
                                    : "h-[calc(100vh-10.5rem)]"
                        )}
                        onScroll={debouncedHandleScroll}
                    >
                        {/* Apply ref and dynamic padding to this inner div */}
                        <div
                            ref={scrollContentRef}
                            className="px-4 relative will-change-transform transition-padding duration-300 ease-in-out"
                            style={{
                                paddingBottom: `${stageDisplayHeight}px`,
                            }}
                        >
                            <ChatContainer
                                currentChat={currentChat}
                                onNewChat={createNewChat}
                                onRetry={handleRetry}
                                setInputValue={setInputValue}
                            />

                            {/* Message end reference - put after Stage */}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </ScrollArea>

                    {/* Wrap StageDisplay with AnimatePresence */}
                    <AnimatePresence>
                        {showStage && (
                            <StageDisplay
                                key="stage-display"
                                ref={stageDisplayRef}
                                stages={validStages}
                                maxHeight={modalMode ? 250 : 350}
                            />
                        )}
                    </AnimatePresence>

                    {/* Scroll to bottom button */}
                    {isScrolledUp && showScrollToBottom && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className={cn(
                                "z-50 fixed rounded-full shadow-lg transition-transform hover:scale-110 animate-bounce-slow",
                                isDarkMode
                                    ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-700/30"
                                    : "bg-blue-100 hover:bg-blue-200 text-blue-600 border border-blue-200",
                                modalMode ? "bottom-36 right-6" : "bottom-36 right-6",
                                !modalMode && sidebarEnabled && isSidebarOpen ? "lg:right-6" : "right-6"
                            )}
                            onClick={() => {
                                // click the button to scroll to the bottom
                                scrollToBottom();
                                // ensure the button is hidden immediately
                                setTimeout(() => {
                                    if (messagesEndRef.current) {
                                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                        setTimeout(checkScrollState, 300);
                                    }
                                }, 0);
                            }}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    )}

                    {/* add a scroll end detection hook */}
                    {showScrollToBottom && (
                        <div
                            className="hidden"
                            aria-hidden="true"
                            ref={bottomDetectorRef}
                        />
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
                        {config.appDefinition?.status !== 'coming_soon' ? (
                            <MessageInput
                                autoFocus={modalMode}
                                placeholder="Type your message..."
                                disabled={isStreaming && !hasStageError}
                                className="max-h-[80px]"
                                value={inputValue}
                                onInputChange={setInputValue}
                                onSendMessage={handleSendMessage}
                            />
                        ) : (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-md text-center">
                                <p className="text-amber-700 dark:text-amber-400 font-medium">
                                    Coming soon, stay tuned！
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
} 