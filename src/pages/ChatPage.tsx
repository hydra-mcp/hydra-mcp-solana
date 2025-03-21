import { Send, ChevronDown, Sparkles, Loader2, Info, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { useToast } from '@/hooks/use-toast';
import { ChatList } from '@/components/chat/ChatList';
import { Chat, Message } from '@/types/chat';
import { sendStreamMessage, saveChats, loadChats, deleteChat, clearAllChats } from '@/lib/api';
import { ChatContainer, ProcessingStage } from '@/components/chat/ChatContainer';
import { useOutletContext } from 'react-router-dom';

interface SidebarContext {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export function ChatPage() {
    const { isSidebarOpen, toggleSidebar } = useOutletContext<SidebarContext>();
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [playSentSound, setPlaySentSound] = useState(false);
    const [playReceivedSound, setPlayReceivedSound] = useState(false);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [processingStage, setProcessingStage] = useState<Array<ProcessingStage>>([]);

    const currentChat = chats.find(chat => chat.id === currentChatId);

    // Load chats from local storage on initial render
    useEffect(() => {
        const loadSavedChats = async () => {
            setIsLoadingChats(true);
            try {
                // Simulate network delay for demo purposes
                await new Promise(resolve => setTimeout(resolve, 800));

                const savedChats = loadChats();
                if (savedChats.length > 0) {
                    setChats(savedChats);
                    setCurrentChatId(savedChats[0].id);
                } else {
                    createNewChat();
                }
            } catch (error) {
                console.error('Error loading chats:', error);
                toast({
                    title: 'Error loading chats',
                    description: 'Failed to load your chat history.',
                    duration: 3000,
                });
                createNewChat();
            } finally {
                setIsLoadingChats(false);
            }
        };

        loadSavedChats();
    }, []);

    // Save chats whenever they change
    useEffect(() => {
        if (chats.length > 0) {
            saveChats(chats);
        }
    }, [chats]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsScrolledUp(false);
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement;
        const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setIsScrolledUp(!isAtBottom);

        // Only mark as manual scrolling if user is actively scrolling up
        if (!isAtBottom) {
            setIsManualScrolling(true);

            // Reset manual scrolling flag after a delay of inactivity
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                setIsManualScrolling(false);
            }, 1000);
        } else {
            setIsManualScrolling(false);
        }
    };

    const createNewChat = () => {
        const newChat: Chat = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
    };

    const updateChat = (chatId: string, updates: Partial<Chat>) => {
        if (isStreaming && updates.messages && currentChatId === chatId) {
            // ，
            setChats(prev => {
                // 
                const newChats = prev.map(chat => {
                    if (chat.id === chatId) {
                        // 
                        const updatedMessages = updates.messages;

                        // （）
                        if (updatedMessages && chat.messages.length > 0 &&
                            updatedMessages.length === chat.messages.length) {
                            // 
                            const lastMessageIndex = updatedMessages.length - 1;
                            // 
                            const newMessages = [...chat.messages];
                            // 
                            newMessages[lastMessageIndex] = updatedMessages[lastMessageIndex];

                            // 
                            return {
                                ...chat,
                                ...updates,
                                messages: newMessages,
                                updatedAt: new Date().toISOString() // 
                            };
                        }

                        // ，
                        return { ...chat, ...updates };
                    }
                    // 
                    return chat;
                });

                return newChats;
            });
        } else {
            // ，
            setChats(prev =>
                prev.map(chat =>
                    chat.id === chatId ? { ...chat, ...updates } : chat
                )
            );
        }
    };

    const handleDeleteChat = (chatId: string) => {
        const updatedChats = deleteChat(chatId);
        setChats(updatedChats);

        // If the deleted chat was the current one, select the next available chat
        if (chatId === currentChatId) {
            setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);

            // If no chats left, create a new one
            if (updatedChats.length === 0) {
                createNewChat();
            }
        }

        toast({
            title: 'Chat deleted',
            description: 'The chat has been removed.',
            duration: 3000,
        });
    };

    const handleClearAllChats = () => {
        clearAllChats();
        setChats([]);
        createNewChat();

        toast({
            title: 'All chats cleared',
            description: 'Your chat history has been cleared.',
            duration: 3000,
        });
    };

    const handleSend = async () => {
        if (!input.trim() || !currentChatId) return;

        // Trigger sent sound
        setPlaySentSound(true);
        setTimeout(() => setPlaySentSound(false), 300);

        const userMessage: Message = {
            id: Date.now().toString(),
            content: input,
            sender: 'user',
            createdAt: new Date().toISOString(),
        };

        // Update chat with user message
        const updatedMessages = [...(currentChat?.messages || []), userMessage];
        updateChat(currentChatId, {
            messages: updatedMessages,
            updatedAt: new Date().toISOString(),
            title: updatedMessages.length === 1 ? input.slice(0, 30) : currentChat?.title,
        });

        // Create AI message placeholder - ，
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
            id: aiMessageId,
            content: '', // ，"..."
            sender: 'ai',
            createdAt: new Date().toISOString(),
        };

        // AI
        updateChat(currentChatId, {
            messages: [...updatedMessages, aiMessage],
            updatedAt: new Date().toISOString(),
        });

        setInput('');
        setIsStreaming(true);
        setStreamingContent(''); // 
        setProcessingStage([{
            message: 'AI is processing your request...',
            content: '',
            status: 0
        }]); // ，

        let hasReceivedContent = false; // 

        try {
            // Use streaming response API with chat history for context
            await sendStreamMessage(
                input,
                // Send previous messages for context
                updatedMessages,
                (chunk) => {
                    //  SSE 
                    console.log("Received chunk:", chunk); // 

                    try {
                        const jsonData = JSON.parse(chunk);
                        console.log("Parsed JSON data:", jsonData); // 

                        // stage - typestage
                        if (jsonData.type === 'stage') {
                            // state
                            //  content  stage， ， content ，
                            setProcessingStage(prevStages => {
                                // content，contentstage
                                // if (jsonData.content === '') {
                                //     return prevStages.filter(stage => stage.content !== jsonData.content);
                                // }

                                const existingStage = prevStages.find(stage => stage.content === jsonData.content);
                                if (existingStage) {
                                    // contentstage，
                                    return prevStages.map(stage =>
                                        stage.content === jsonData.content ? {
                                            ...stage,
                                            message: jsonData.message,
                                            status: jsonData.status
                                        } : stage
                                    );
                                } else {
                                    // stage
                                    return [...prevStages, {
                                        message: jsonData.message,
                                        content: jsonData.content,
                                        status: jsonData.status
                                    }];
                                }
                            });
                            console.log("Processing stage:", jsonData.content); // 
                            return; // ，
                        }

                        // 
                        switch (jsonData.type) {
                            case 'content':
                                //  - 
                                if (jsonData.content) {
                                    handleContentUpdate(jsonData.content);
                                    hasReceivedContent = true;
                                }
                                break;

                            case 'error':
                                // 
                                console.error("Error from API:", jsonData.error);
                                toast({
                                    title: 'Error',
                                    description: jsonData.error?.message || 'An error occurred',
                                    duration: 3000,
                                });

                                // AI
                                updateChat(currentChatId, {
                                    messages: [...updatedMessages, {
                                        ...aiMessage,
                                        content: `Error: ${jsonData.error?.message || 'An unknown error occurred'}`,
                                    }],
                                    updatedAt: new Date().toISOString(),
                                });
                                break;

                            case 'done':
                                //  - onmessage[DONE]
                                console.log("Stream completed");
                                break;

                            default:
                                // 
                                // delta
                                if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                                    const content = jsonData.choices[0].delta.content;
                                    if (content) {
                                        handleContentUpdate(content);
                                        hasReceivedContent = true;
                                    }
                                }
                        }
                    } catch (e) {
                        // JSON，
                        console.log("JSON parse error, using raw chunk:", e); // 
                        if (typeof chunk === 'string' && chunk.trim()) {
                            // ，
                            handleContentUpdate(chunk);
                            hasReceivedContent = true;
                        }
                    }
                }
            );

            // ，
            if (!hasReceivedContent) {
                handleContentUpdate("，。");
            }

            // Streaming complete
            setIsStreaming(false);
            setProcessingStage([]);

            // Trigger received sound when AI message is complete
            setPlayReceivedSound(true);
            setTimeout(() => setPlayReceivedSound(false), 300);
        } catch (error) {
            // Handle error
            setIsStreaming(false);
            setProcessingStage([]);
            toast({
                title: 'Error',
                description: 'Failed to get AI response.',
                duration: 3000,
            });

            // Add error message
            updateChat(currentChatId, {
                messages: [...updatedMessages, {
                    ...aiMessage,
                    content: 'Sorry, I encountered an issue and couldn\'t respond to your request. Please try again later.',
                }],
                updatedAt: new Date().toISOString(),
            });
        }
    };

    // 
    const handleContentUpdate = (content: string) => {
        if (!content || !currentChatId) return;

        // 
        setStreamingContent(prev => {
            const newContent = prev + content;

            //  - AI
            if (currentChat?.messages && currentChat.messages.length > 0) {
                const lastMessage = currentChat.messages[currentChat.messages.length - 1];

                // AI，
                if (lastMessage.sender === 'ai') {
                    updateChat(currentChatId, {
                        messages: [...currentChat.messages.slice(0, -1), {
                            ...lastMessage,
                            content: newContent,
                        }],
                        updatedAt: new Date().toISOString(),
                    });
                } else {
                    // AI，AI
                    updateChat(currentChatId, {
                        messages: [...currentChat.messages, {
                            id: Date.now().toString(),
                            content: newContent,
                            sender: 'ai',
                            createdAt: new Date().toISOString(),
                        }],
                        updatedAt: new Date().toISOString(),
                    });
                }
            }

            return newContent;
        });
    };

    // Auto-scroll effect
    useEffect(() => {
        // Don't auto-scroll if user is manually scrolling up
        if (!isManualScrolling && currentChat?.messages.length > 0) {
            const shouldSmoothScroll = !isStreaming;
            messagesEndRef.current?.scrollIntoView({
                behavior: shouldSmoothScroll ? 'smooth' : 'auto'
            });
        }
    }, [currentChat?.messages, isStreaming, isManualScrolling]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-full transform border-r bg-background/95 backdrop-blur-md transition-all duration-300 shadow-lg lg:z-30',
                    'w-72 lg:w-72',
                    isSidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                )}
            >
                <div className="flex h-14 items-center border-b px-4">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        <span>Chat History</span>
                    </h2>
                </div>
                <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
                    <div className="p-4">
                        <ChatList
                            chats={chats}
                            currentChatId={currentChatId}
                            onSelectChat={(id) => {
                                setCurrentChatId(id);
                                if (window.innerWidth < 1024) { // lg breakpoint
                                    toggleSidebar();
                                }
                            }}
                            onNewChat={() => {
                                createNewChat();
                            }}
                            onDeleteChat={handleDeleteChat}
                            onClearAllChats={handleClearAllChats}
                            isLoading={isLoadingChats}
                        />
                    </div>
                </div>
            </aside>

            {/* Sidebar overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 lg:hidden bg-background/80 backdrop-blur-sm z-30 transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}

            {/* Main Chat Area */}
            <main className={cn(
                'relative z-10 min-h-screen pt-14 pb-20',
                isSidebarOpen ? 'lg:pl-72' : '',
                'transition-all duration-300'
            )}>
                <div className={cn(
                    'container mx-auto h-full py-4',
                    'transition-all duration-300'
                )}>
                    <div className="flex items-center mb-4 px-4">
                        {/* Chat Title */}
                        <h1 className="font-semibold text-lg truncate">
                            {currentChat?.title || "New Chat"}
                        </h1>
                    </div>
                    <ScrollArea
                        ref={scrollAreaRef}
                        className="h-[calc(100vh-8.5rem)] rounded-lg border bg-background/5 shadow-inner"
                        onScroll={handleScroll}
                    >
                        <div className="px-4">
                            <ChatContainer
                                currentChat={currentChat}
                                isStreaming={isStreaming}
                                messagesEndRef={messagesEndRef}
                                onNewChat={createNewChat}
                                processingStage={processingStage}
                            />
                        </div>
                    </ScrollArea>

                    {/* Scroll to Bottom Button */}
                    {isScrolledUp && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="fixed bottom-24 right-6 z-10 rounded-full shadow-lg transition-transform hover:scale-110 animate-bounce-slow"
                            onClick={scrollToBottom}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </main>

            {/* Input Area */}
            <footer className={cn(
                "fixed bottom-0 z-20 border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-lg",
                isSidebarOpen ? 'lg:left-72' : 'left-0',
                'right-0 transition-all duration-300'
            )}>
                {/* {processingStage && (
                    <div className="w-full py-1.5 px-4 flex items-center gap-2 text-xs border-b border-primary/10">
                        <div className="container mx-auto flex items-center gap-2 text-primary">
                            {processingStage.map(stage => stage.message).includes('') ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            <span className={processingStage.map(stage => stage.message).includes('') ? 'text-green-600 font-medium' : 'animate-pulse'}>
                                {processingStage.map(stage => stage.message).join(' - ')}
                            </span>
                        </div>
                    </div>
                )} */}
                <div className="container mx-auto flex gap-2 py-2 sm:py-4">
                    <div className="flex gap-2 w-full px-4">
                        <AutoResizeTextarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type your message..."
                            className="min-h-[40px] max-h-[120px] sm:max-h-[200px] flex-1 resize-none rounded-lg border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-shadow text-sm sm:text-base"
                            disabled={isStreaming}
                        />
                        <Button
                            disabled={!currentChatId || isStreaming || !input.trim()}
                            onClick={handleSend}
                            className={cn(
                                "shrink-0 transition-all px-2 sm:px-4",
                                isStreaming ? "opacity-50" : "hover:scale-105 hover:shadow-md hover:shadow-primary/20"
                            )}
                        >
                            {isStreaming ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline-block">Send</span>
                        </Button>
                    </div>
                </div>
            </footer>
        </>
    );
} 