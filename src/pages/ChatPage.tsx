import { Send, ChevronDown, Sparkles, Loader2, Info, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn, uuid } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { useToast } from '@/hooks/use-toast';
import { ChatList } from '@/components/chat/ChatList';
import { Chat, Message, MessageSender } from '@/types/chat';
import { sendStreamMessage, saveChats, loadChats, deleteChat, clearAllChats } from '@/lib/api';
import { ChatContainer, ProcessingStage } from '@/components/chat/ChatContainer';
import { useOutletContext } from 'react-router-dom';

interface SidebarContext {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export function ChatPage({ isModal = false }: { isModal?: boolean }) {
    // Try to get sidebarContext from context, but it may not exist in modal mode
    const sidebarContext = useOutletContext<SidebarContext | null>();
    const { isSidebarOpen = false, toggleSidebar = () => { } } = sidebarContext || {};
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
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [processingStage, setProcessingStage] = useState<Array<ProcessingStage>>([]);
    // current AI message id
    const [streamMessageId, setStreamMessageId] = useState<string>(uuid());

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
        // check if there is an empty chat window
        const emptyChat = chats.find(chat => chat.messages.length === 0);

        if (emptyChat) {
            // there is an empty chat window, switch to it
            setCurrentChatId(emptyChat.id);

            // focus on input
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return;
        }

        // there is no empty chat window, create a new chat
        const newChat: Chat = {
            id: uuid(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString(),
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);

        // focus on input
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const updateChat = (chatId: string, updates: Partial<Chat>) => {
        if (updates.messages && currentChatId === chatId) {
            setChats(prev => {
                const newChats = prev.map(chat => {
                    if (chat.id === chatId) {
                        const updatedMessages = updates.messages;

                        if (updatedMessages && chat.messages.length > 0 &&
                            updatedMessages.length === chat.messages.length) {
                            const lastMessageIndex = updatedMessages.length - 1;
                            const newMessages = [...chat.messages];
                            newMessages[lastMessageIndex] = updatedMessages[lastMessageIndex];

                            return {
                                ...chat,
                                ...updates,
                                messages: newMessages,
                                updatedAt: new Date().toLocaleString() // 
                            };
                        }

                        // update messages by id
                        const messages = [...chat.messages]
                        updates.messages.forEach(message => {
                            const index = messages.findIndex(m => m.id === message.id);
                            if (index !== -1) {
                                messages[index] = message;
                            }
                            else {
                                messages.push(message);
                            }
                        });
                        return { ...chat, ...updates, messages: messages };
                    }
                    return chat;
                });

                return newChats;
            });
        } else {
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
            id: uuid(),
            content: input,
            sender: 'user',
            createdAt: new Date().toLocaleString(),
        };

        // Update chat with user message

        // updateChat(currentChatId, {
        //     messages: updatedMessages,
        //     updatedAt: new Date().toLocaleString(),
        //     title: updatedMessages.length === 1 ? input.slice(0, 30) : currentChat?.title,
        // });

        // Create AI message placeholder - ，
        const aiMessageId = uuid();
        setStreamMessageId(aiMessageId);
        const aiMessage: Message = {
            id: streamMessageId,
            content: '', // ，"..."
            sender: 'ai',
            createdAt: new Date().toLocaleString(),
        };

        // AI
        const updatedMessages = [...(currentChat?.messages || []), userMessage];
        updateChat(currentChatId, {
            messages: [...updatedMessages, aiMessage],
            updatedAt: new Date().toLocaleString(),
            title: updatedMessages.length === 1 ? input.slice(0, 30) : currentChat?.title,
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
                    try {
                        const jsonData = JSON.parse(chunk);

                        // stage - typestage
                        if (jsonData.type === 'stage') {
                            // state
                            //  content  stage， ， content ，
                            setProcessingStage(prevStages => {
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
                            return;
                        }

                        switch (jsonData.type) {
                            case 'content':
                                if (jsonData.content) {
                                    handleContentUpdate(jsonData.content);
                                    hasReceivedContent = true;
                                }
                                break;

                            case 'error':
                                console.error("Error from API:", jsonData.error);
                                toast({
                                    title: 'Error',
                                    description: jsonData.error?.message || 'An error occurred',
                                    duration: 3000,
                                });

                                updateChat(currentChatId, {
                                    messages: [...updatedMessages, {
                                        ...aiMessage,
                                        id: streamMessageId,
                                        content: `Error: ${jsonData.error?.message || 'An unknown error occurred'}`,
                                    }],
                                    updatedAt: new Date().toLocaleString(),
                                });
                                break;

                            case 'done':
                                console.log("Stream completed");
                                setStreamMessageId(uuid());
                                break;

                            default:
                                if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                                    const content = jsonData.choices[0].delta.content;
                                    if (content) {
                                        handleContentUpdate(content);
                                        hasReceivedContent = true;
                                    }
                                }
                        }
                    } catch (e) {
                        console.log("JSON parse error, using raw chunk:", e); // 
                        if (typeof chunk === 'string' && chunk.trim()) {
                            // ，
                            handleContentUpdate(chunk);
                            hasReceivedContent = true;
                        }
                    }
                }
            );

            if (!hasReceivedContent) {
                handleContentUpdate("no response from server.");
            }

            // Streaming complete
            setIsStreaming(false);
            setProcessingStage([]);

            // Focus back to input after streaming is complete
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

            // Trigger received sound when AI message is complete
            setPlayReceivedSound(true);
            setTimeout(() => setPlayReceivedSound(false), 300);
        } catch (error) {
            // Handle error
            console.error("Error from API:", error);
            setIsStreaming(false);
            setProcessingStage([]);

            // Focus back to input after error handling
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

            toast({
                title: 'Error',
                description: 'Failed to get AI response.',
                duration: 3000,
            });

            // Add error message
            updateChat(currentChatId, {
                messages: [...updatedMessages, {
                    ...aiMessage,
                    id: streamMessageId,
                    content: 'Sorry, I encountered an issue and couldn\'t respond to your request. Please try again later.',
                }],
                updatedAt: new Date().toLocaleString(),
            });
        }
    };

    // 
    const handleContentUpdate = (content: string, role: MessageSender = "ai") => {
        if (!content || !currentChatId) return;

        setStreamingContent(prev => {
            const newContent = prev + content;

            //  - AI
            if (currentChat) {
                setStreamingContent
                const messages = currentChat.messages || [];

                // if there are messages and the last message is an AI message, update it
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];

                    // AI message,
                    if (lastMessage.sender === 'ai') {
                        updateChat(currentChatId, {
                            messages: [...messages.slice(0, -1), {
                                ...lastMessage,
                                content: newContent,
                                id: streamMessageId,
                            }],
                            updatedAt: new Date().toLocaleString(),
                        });
                    } else {
                        // if the last message is not an AI message, add a new AI message
                        updateChat(currentChatId, {
                            messages: [...messages, {
                                id: streamMessageId,
                                content: newContent,
                                sender: 'ai',
                                createdAt: new Date().toLocaleString(),
                            }],
                            updatedAt: new Date().toLocaleString(),
                        });
                    }
                } else {
                    // handle the case when the message list is empty
                    updateChat(currentChatId, {
                        messages: [{
                            id: role === "ai" ? streamMessageId : uuid(),
                            content: newContent,
                            sender: role,
                            createdAt: new Date().toLocaleString(),
                        }],
                        updatedAt: new Date().toLocaleString(),
                    });
                }
            }

            return newContent;
        });
    };

    // Auto-scroll effect
    useEffect(() => {
        // Don't auto-scroll if user is manually scrolling up
        if (!isManualScrolling) {
            const shouldSmoothScroll = !isStreaming;
            messagesEndRef.current?.scrollIntoView({
                behavior: shouldSmoothScroll ? 'smooth' : 'auto'
            });
        }
    }, [currentChat?.messages, isStreaming, isManualScrolling]);

    // Auto focus input field in modal mode
    useEffect(() => {
        if (isModal) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [isModal, currentChatId]);

    // Additional useEffect to ensure the input field is focused in modal mode
    useEffect(() => {
        if (isModal && inputRef.current) {
            const focusInterval = setInterval(() => {
                if (document.activeElement !== inputRef.current) {
                    inputRef.current?.focus();
                } else {
                    clearInterval(focusInterval);
                }
            }, 500);

            return () => clearInterval(focusInterval);
        }
    }, [isModal]);

    // Handle window click events to ensure the input field is focused when clicking on the window in modal mode
    const handleWindowClick = () => {
        if (isModal) {
            inputRef.current?.focus();
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div onClick={handleWindowClick} className={cn(isModal && 'h-full flex flex-col')}>
            {/* Sidebar - Not displayed in modal mode*/}
            {!isModal && (
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
            )}

            {/* Sidebar overlay - Not displayed in modal mode */}
            {!isModal && isSidebarOpen && (
                <div
                    className="fixed inset-0 lg:hidden bg-background/80 backdrop-blur-sm z-30 transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}

            {/* Main Chat Area */}
            <main className={cn(
                'relative z-20',
                isModal ? 'flex flex-col h-full pb-16' : 'min-h-screen pt-14 pb-20',
                !isModal && isSidebarOpen ? 'lg:pl-72' : '',
                'transition-all duration-300'
            )}>
                <div className={cn(
                    isModal ? 'h-full flex flex-col' : 'container mx-auto h-full py-4',
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
                        className={cn(
                            "rounded-lg border bg-background/5 shadow-inner flex-1",
                            isModal ? "h-[calc(100%-4.5rem)]" : "h-[calc(100vh-8.5rem)]"
                        )}
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
                            className={cn(
                                "z-40 rounded-full shadow-lg transition-transform hover:scale-110 animate-bounce-slow",
                                isModal ? "absolute bottom-20 right-6" : "fixed bottom-24 right-6"
                            )}
                            onClick={scrollToBottom}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </main>

            {/* Input Area */}
            <footer className={cn(
                "border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-lg z-40",
                isModal
                    ? "absolute bottom-0 left-0 right-0"
                    : "fixed bottom-0 z-20",
                !isModal && isSidebarOpen ? 'lg:left-72' : 'left-0',
                'right-0 transition-all duration-300'
            )}>
                <div className="container mx-auto flex gap-2 py-2 sm:py-4">
                    <div className="flex gap-2 w-full px-4">
                        <AutoResizeTextarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type your message..."
                            className={cn(
                                "min-h-[40px] max-h-[120px] sm:max-h-[200px] flex-1 resize-none rounded-lg",
                                "border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/30",
                                "transition-shadow text-sm sm:text-base z-50"
                            )}
                            disabled={isStreaming}
                            autoFocus={isModal}
                        />
                        <Button
                            disabled={!currentChatId || isStreaming || !input.trim()}
                            onClick={handleSend}
                            className={cn(
                                "shrink-0 transition-all px-2 sm:px-4 z-50",
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
        </div>
    );
} 