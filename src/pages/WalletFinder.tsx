import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { Send, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSNavBar } from '@/components/ios/IOSNavBar';

// Message type definition
interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isComplete?: boolean;
}

// Typewriter effect component
const TypewriterText = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + text[currentIndex]);
                setCurrentIndex(currentIndex + 1);
            }, 15 + Math.random() * 20); // Random delay, simulate real typing effect

            return () => clearTimeout(timer);
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
                    <motion.div
                        className={cn(
                            "w-2 h-2 rounded-full",
                            isDarkMode ? "bg-gray-400" : "bg-gray-500"
                        )}
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className={cn(
                            "w-2 h-2 rounded-full",
                            isDarkMode ? "bg-gray-400" : "bg-gray-500"
                        )}
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div
                        className={cn(
                            "w-2 h-2 rounded-full",
                            isDarkMode ? "bg-gray-400" : "bg-gray-500"
                        )}
                        animate={{ scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

// Message bubble component
const MessageBubble = ({ message }: { message: Message }) => {
    const { isDarkMode } = useTheme();
    const [isComplete, setIsComplete] = useState(!!message.isComplete);

    const handleTypingComplete = () => {
        setIsComplete(true);
    };

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
                {message.sender === 'ai' && !isComplete ? (
                    <TypewriterText text={message.content} onComplete={handleTypingComplete} />
                ) : (
                    <div>{message.content}</div>
                )}
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

// WalletFinder application component
export function WalletFinder({ isModal = false }: { isModal?: boolean }) {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: 'Welcome to WalletFinder, I can help you analyze high-value blockchain accounts. Please tell me what you want to query?',
            sender: 'ai',
            timestamp: new Date(),
            isComplete: true
        }
    ]);

    // Scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // Automatically focus on the input field
    useEffect(() => {
        // Give a delay to ensure the UI is rendered
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // Send message processing
    const handleSendMessage = () => {
        if (!input.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: input,
            sender: 'user',
            timestamp: new Date(),
            isComplete: true
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        // Simulate AI thinking and reply
        setTimeout(() => {
            setIsThinking(false);

            // Add AI reply
            const mockResponses = [
                "According to my analysis, the most active wallet address on the Ethereum network is 0x28c6c06298d514db089934071355e5743bf21d60, with transactions exceeding 5000 ETH in the past 30 days.",
                "I found an interesting pattern: the address 0x71C7656EC7ab88b098defB751B7401B5f6d8976F transferred a large amount of funds to multiple DEX platforms in the past week, possibly preparing for a major trading strategy.",
                "Based on historical data, this address is a whale account, holding approximately 120,000 ETH, valued at about $3.6 billion. The account has recently increased its activity, possibly indicating market changes.",
                "The analysis shows that this address has frequent interactions with multiple DeFi protocols, especially in liquidity mining, with cumulative profits of about 850 ETH."
            ];

            const aiMessage: Message = {
                id: Date.now().toString(),
                content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        }, 1500 + Math.random() * 1500); // Random thinking time
    };

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
                    {messages.map(message => (
                        <MessageBubble key={message.id} message={message} />
                    ))}

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
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Enter your question..."
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
                                onClick={() => setInput('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        )}
                    </div>

                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim()}
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