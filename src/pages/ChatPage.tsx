import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { Send, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSNavBar } from '@/components/ios/IOSNavBar';
import { sendChatMessage } from '@/lib/api';
import { Message } from '@/types/chat';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

interface ExtendedMessage extends Message {
    timestamp: Date;
    isComplete?: boolean;
}

// Typewriter effect component
const TypewriterText = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            // const timer = setTimeout(() => {
            //     setDisplayedText(prev => prev + text[currentIndex]);
            //     setCurrentIndex(currentIndex + 1);
            // }, 15 + Math.random() * 20); // Random delay, simulate real typing effect

            // return () => clearTimeout(timer);
            setDisplayedText(prev => prev + text[currentIndex]);
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete();
        }
    }, [currentIndex, text, onComplete]);

    return <span>{displayedText}<span className="animate-pulse">|</span></span>;
};

// Thinking animation component
const ThinkingAnimation = () => {
    const { isDarkMode } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-2"
        >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
            </div>
            <div className={cn(
                "px-4 py-2 rounded-2xl max-w-[85%]",
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
            )}>
                <div className="flex gap-1 items-center h-5">
                    {[0, 0.3, 0.6].map((delay, index) => (
                        <motion.div
                            key={index}
                            className={cn(
                                "w-2 h-2 rounded-full",
                                isDarkMode ? "bg-gray-400" : "bg-gray-500"
                            )}
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 1, repeat: Infinity, delay }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Message bubble component
const MessageBubble = ({ message }: { message: ExtendedMessage }) => {
    const { isDarkMode } = useTheme();
    const [isComplete, setIsComplete] = useState(!!message.isComplete);

    const handleTypingComplete = useCallback(() => {
        setIsComplete(true);
    }, []);

    return (
        <motion.div
            className={cn(
                "flex w-full mb-4",
                message.sender === 'user' ? "justify-end" : "justify-start"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {message.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                </div>
            )}

            <div className={cn(
                "max-w-[80%] rounded-2xl p-3 shadow-sm",
                message.sender === 'user'
                    ? "bg-blue-500 text-white rounded-tr-none"
                    : isDarkMode
                        ? "bg-gray-700 text-white rounded-tl-none"
                        : "bg-gray-200 text-gray-900 rounded-tl-none"
            )}>
                <div className="break-words">
                    {message.sender === 'ai' && !isComplete ? (
                        <TypewriterText text={message.content} onComplete={handleTypingComplete} />
                    ) : (
                        message.sender === 'ai' ? (
                            <MarkdownRenderer
                                content={message.content}
                                className={cn(
                                    isDarkMode ? "text-white" : "text-gray-900",
                                    "prose-sm"
                                )}
                            />
                        ) : (
                            <div>{message.content}</div>
                        )
                    )}
                </div>
                <div className={cn(
                    "text-xs mt-1 text-right",
                    message.sender === 'user'
                        ? "text-blue-100"
                        : isDarkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                    <span className="text-xs font-bold">Me</span>
                </div>
            )}
        </motion.div>
    );
};

// Message reducer 相关类型
type MessageAction =
    | { type: 'ADD_USER_MESSAGE', payload: { content: string } }
    | { type: 'ADD_AI_MESSAGE', payload: { id: string } }
    | { type: 'UPDATE_AI_MESSAGE', payload: { id: string, content: string } }
    | { type: 'MARK_MESSAGE_COMPLETE', payload: { id: string } }
    | { type: 'SET_ERROR_MESSAGE', payload: { id: string, errorMessage: string } };

// Message reducer 函数
const messagesReducer = (state: ExtendedMessage[], action: MessageAction): ExtendedMessage[] => {
    switch (action.type) {
        case 'ADD_USER_MESSAGE':
            return [
                ...state,
                {
                    id: Date.now().toString(),
                    content: action.payload.content,
                    sender: 'user',
                    createdAt: new Date().toISOString(),
                    timestamp: new Date()
                }
            ];

        case 'ADD_AI_MESSAGE':
            return [
                ...state,
                {
                    id: action.payload.id,
                    content: '',
                    sender: 'ai',
                    createdAt: new Date().toISOString(),
                    timestamp: new Date(),
                    isComplete: false
                }
            ];

        case 'UPDATE_AI_MESSAGE':
            return state.map(message =>
                message.id === action.payload.id
                    ? { ...message, content: message.content + action.payload.content }
                    : message
            );

        case 'MARK_MESSAGE_COMPLETE':
            return state.map(message =>
                message.id === action.payload.id
                    ? { ...message, isComplete: true }
                    : message
            );

        case 'SET_ERROR_MESSAGE':
            return state.map(message =>
                message.id === action.payload.id
                    ? {
                        ...message,
                        content: action.payload.errorMessage,
                        isComplete: true
                    }
                    : message
            );

        default:
            return state;
    }
};

// 自定义 hook: useChatMessages
const useChatMessages = () => {
    const [messages, dispatch] = useReducer(messagesReducer, []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null);

    // 处理流式响应
    const handleStreamResponse = useCallback((aiMessageId: string, chunk: string) => {
        try {
            // Try to parse JSON response (if any)
            const jsonData = JSON.parse(chunk);

            // Handle different response formats
            if (jsonData.type === 'content' && jsonData.content) {
                dispatch({
                    type: 'UPDATE_AI_MESSAGE',
                    payload: { id: aiMessageId, content: jsonData.content }
                });
            } else if (jsonData.choices && jsonData.choices[0]?.message?.content) {
                // Compatible with OpenAI format
                dispatch({
                    type: 'UPDATE_AI_MESSAGE',
                    payload: { id: aiMessageId, content: jsonData.choices[0].message.content }
                });
            } else if (jsonData.content) {
                // Direct content field
                dispatch({
                    type: 'UPDATE_AI_MESSAGE',
                    payload: { id: aiMessageId, content: jsonData.content }
                });
            } else {
                // Other cases, try to use raw JSON data
                console.log('Received JSON response:', jsonData);
            }
        } catch (e) {
            // If not JSON format, use raw text
            if (chunk && typeof chunk === 'string') {
                dispatch({
                    type: 'UPDATE_AI_MESSAGE',
                    payload: { id: aiMessageId, content: chunk }
                });
            }
        }
    }, []);

    // 发送消息
    const sendMessage = useCallback(async (userMessage: string) => {
        if (!userMessage.trim() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // 添加用户消息
            dispatch({
                type: 'ADD_USER_MESSAGE',
                payload: { content: userMessage }
            });

            // 生成AI消息ID
            const aiMessageId = `ai-${Date.now()}`;
            setCurrentAiMessageId(aiMessageId);
            setIsThinking(true);

            // 添加AI消息
            dispatch({
                type: 'ADD_AI_MESSAGE',
                payload: { id: aiMessageId }
            });

            // 准备API消息
            const messagesForApi = [...messages, {
                id: Date.now().toString(),
                content: userMessage,
                sender: 'user' as const,
                createdAt: new Date().toISOString()
            }].map(m => ({
                id: m.id,
                content: m.content,
                sender: m.sender,
                createdAt: m.createdAt
            }));

            // 发送API请求
            await sendChatMessage(
                userMessage,
                messagesForApi,
                (chunk) => handleStreamResponse(aiMessageId, chunk)
            );

            // 标记消息完成
            dispatch({
                type: 'MARK_MESSAGE_COMPLETE',
                payload: { id: aiMessageId }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            // 设置错误消息
            if (currentAiMessageId) {
                dispatch({
                    type: 'SET_ERROR_MESSAGE',
                    payload: {
                        id: currentAiMessageId,
                        errorMessage: 'Sorry, there was an error processing your request. Please try again.'
                    }
                });
            }
        } finally {
            setIsSubmitting(false);
            setIsThinking(false);
            setCurrentAiMessageId(null);
        }
    }, [messages, isSubmitting, handleStreamResponse, currentAiMessageId]);

    return {
        messages,
        isSubmitting,
        isThinking,
        sendMessage,
        currentAiMessageId
    };
};

// WalletFinder application component
export function ChatPage({ isModal = false }: { isModal?: boolean }) {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 使用自定义hook处理消息逻辑
    const { messages, isSubmitting, isThinking, sendMessage, currentAiMessageId } = useChatMessages();

    // Scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // Automatically focus on the input field
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            sendMessage(input);
            setInput('');
        }
    }, [input, sendMessage]);

    const handleButtonClick = useCallback(() => {
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    }, [input, sendMessage]);

    const clearInput = useCallback(() => {
        setInput('');
    }, []);

    return (
        <div className={cn(
            "w-full flex flex-col transition-colors duration-300",
            isModal ? "h-full" : "min-h-screen",
            isDarkMode
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-900"
        )}>
            {/* iOS navigation bar - only displayed in non-modal mode */}
            {!isModal && (
                <IOSNavBar
                    title="WalletFinder"
                    onBack={() => navigate('/ios-desktop')}
                />
            )}

            {/* Message area */}
            <div className={cn(
                "flex-1 overflow-y-auto px-4",
                isModal ? "pt-2" : "pt-16 pb-20"
            )}>
                <AnimatePresence>
                    {messages.map(message => {
                        // 当消息是当前正在处理的AI消息且正在思考中，则不显示这条消息，因为下面会显示ThinkingAnimation代替它
                        if (isThinking && message.id === currentAiMessageId && message.content === '') {
                            return null;
                        }
                        return <MessageBubble key={message.id} message={message} />;
                    })}

                    {isThinking && <ThinkingAnimation />}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className={cn(
                    isModal
                        ? "border-t p-2"
                        : "fixed bottom-0 w-full border-t p-4 backdrop-blur-md",
                    "transition-colors duration-300",
                    isDarkMode
                        ? "bg-gray-900/70 border-gray-800"
                        : "bg-white/70 border-gray-200"
                )}
            >
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your question..."
                            aria-label="Chat input"
                            className={cn(
                                "w-full py-3 px-4 pr-10 rounded-full border focus:outline-none focus:ring-2 transition-all duration-300",
                                isModal ? "py-2" : "py-3",
                                isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:ring-blue-500"
                                    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-400"
                            )}
                        />
                        {input && (
                            <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                onClick={clearInput}
                                aria-label="Clear input"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        )}
                    </div>

                    <button
                        onClick={handleButtonClick}
                        disabled={!input.trim()}
                        aria-label="Send message"
                        className={cn(
                            "p-3 rounded-full transition-all duration-300 flex-shrink-0",
                            isModal ? "p-2" : "p-3",
                            input.trim()
                                ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                        )}
                    >
                        <Send className={cn(
                            "transition-transform",
                            isModal ? "w-5 h-5" : "w-6 h-6",
                            input.trim() && "transform -rotate-45"
                        )} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
} 