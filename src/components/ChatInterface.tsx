import React, { useState, useEffect } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/context/ChatContext';
import { ChatSidebar } from '@/components/ChatSidebar';
import { MessageInput } from '@/components/MessageInput';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useStreaming } from '@/lib/streaming/StreamingContext';

interface ChatInterfaceProps {
    modalMode?: boolean;
    sidebarEnabled?: boolean;
    className?: string;
}

export function ChatInterface({
    modalMode = false,
    sidebarEnabled = true,
    className
}: ChatInterfaceProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    // 使用流式消息上下文，添加错误处理
    const [isLocalStreaming, setIsLocalStreaming] = useState(false);
    let streamingState = { isStreaming: isLocalStreaming };

    try {
        streamingState = useStreaming();
    } catch (error) {
        // 如果不在StreamingProvider中，使用本地状态
        console.warn('ChatInterface: 未在StreamingProvider上下文中，使用默认流状态');
    }

    const { isStreaming } = streamingState;

    const {
        currentChat,
        isScrolledUp,
        scrollToBottom,
        inputRef,
        createNewChat,
        config,
        messagesEndRef,
        handleScroll
    } = useChatContext();

    // Window click event, keep input focus (modal mode)
    const handleWindowClick = () => {
        if (modalMode) {
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

    return (
        <div
            onClick={handleWindowClick}
            className={cn(
                modalMode && 'h-full flex flex-col',
                className
            )}
        >
            {/* 侧边栏 - 非模态模式下显示 */}
            {!modalMode && sidebarEnabled && (
                <ChatSidebar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                />
            )}

            {/* 主聊天区域 */}
            <main className={cn(
                'relative z-20',
                modalMode ? 'flex flex-col h-full pb-16' : 'min-h-screen pt-14 pb-20',
                !modalMode && sidebarEnabled && isSidebarOpen ? 'lg:pl-72' : '',
                'transition-all duration-300'
            )}>
                <div className={cn(
                    modalMode ? 'h-full flex flex-col' : 'container mx-auto h-full py-4',
                    'transition-all duration-300'
                )}>
                    {/* 应用描述 */}
                    {config.appDefinition?.description && (
                        <div className="mb-4 mt-4 mx-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center gap-3">
                            <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <span className="font-medium">{config.appDefinition.title || "关于"}: </span>
                                    {config.appDefinition.description}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message area */}
                    <ScrollArea
                        className={cn(
                            "rounded-lg border bg-background/5 shadow-inner flex-1",
                            modalMode
                                ? config.appDefinition?.description
                                    ? "h-[calc(100%-8rem)]"
                                    : "h-[calc(100%-4.5rem)]"
                                : config.appDefinition?.description
                                    ? "h-[calc(100vh-12rem)]"
                                    : "h-[calc(100vh-8.5rem)]"
                        )}
                        onScroll={handleScroll}
                    >
                        <div className="px-4">
                            <ChatContainer
                                currentChat={currentChat}
                                onNewChat={createNewChat}
                                messagesEndRef={messagesEndRef}
                            />
                        </div>
                    </ScrollArea>

                    {/* Scroll to bottom button */}
                    {isScrolledUp && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className={cn(
                                "z-40 rounded-full shadow-lg transition-transform hover:scale-110 animate-bounce-slow",
                                modalMode ? "absolute bottom-20 right-6" : "fixed bottom-24 right-6"
                            )}
                            onClick={scrollToBottom}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </main>

            {/* 输入区域 */}
            <footer className={cn(
                "border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-lg z-40",
                modalMode
                    ? "absolute bottom-0 left-0 right-0"
                    : "fixed bottom-0 z-20",
                !modalMode && sidebarEnabled && isSidebarOpen ? 'lg:left-72' : 'left-0',
                'right-0 transition-all duration-300'
            )}>
                <div className="container mx-auto py-2 sm:py-4">
                    <div className="px-4">
                        <MessageInput
                            autoFocus={modalMode}
                            placeholder="输入您的消息..."
                            disabled={isStreaming}
                        />
                    </div>
                </div>
            </footer>
        </div>
    );
} 