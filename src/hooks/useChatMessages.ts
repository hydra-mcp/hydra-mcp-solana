import { useState, useRef } from 'react';
import { Message, ProcessingStage, Chat } from '@/types/chat';
import { uuid } from '@/lib/utils';
import { sendChatMessage, sendStreamMessage } from '@/lib/api';

interface UseChatMessagesOptions {
    apiEndpoint?: string;
    onUpdateChat: (chatId: string, updates: any) => void;
    onError?: (error: Error) => void;
    getLatestChat?: (chatId: string) => Chat | undefined;
}

export function useChatMessages(options: UseChatMessagesOptions) {
    const { apiEndpoint, onUpdateChat, onError, getLatestChat } = options;

    const [isStreaming, setIsStreaming] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [processingStage, setProcessingStage] = useState<ProcessingStage[]>([]);
    const [streamMessageId, setStreamMessageId] = useState<string>(uuid());
    const hasReceivedContentRef = useRef(false);

    // Handle sending messages
    const sendMessage = async (chatId: string, currentChat: any, content: string) => {
        if (!content.trim() || !chatId || isStreaming || isProcessing) return;

        // Set processing status
        setIsProcessing(true);

        // User message
        const userMessage: Message = {
            id: uuid(),
            content: content.trim(),
            sender: 'user',
            createdAt: new Date().toLocaleString(),
        };

        // AI message placeholder
        const aiMessageId = uuid();
        setStreamMessageId(aiMessageId);
        const aiMessage: Message = {
            id: aiMessageId,
            content: '',
            sender: 'ai',
            createdAt: new Date().toLocaleString(),
        };

        // Update message list
        const updatedMessages = [...(currentChat?.messages || []), userMessage];
        onUpdateChat(chatId, {
            messages: [...updatedMessages, aiMessage],
            title: updatedMessages.length === 1 ? content.slice(0, 30) : currentChat?.title,
        });

        // Start streaming
        setIsStreaming(true);
        setStreamingContent('');
        hasReceivedContentRef.current = false;
        setProcessingStage([{
            message: 'AI is processing your request...',
            content: '',
            status: 0
        }]);

        try {
            // Send message to API
            await sendStreamMessage(
                apiEndpoint,
                content.trim(),
                updatedMessages,
                (chunk) => {
                    handleStreamData(chunk, chatId, updatedMessages, aiMessage);
                }
            );

            if (!hasReceivedContentRef.current) {
                handleContentUpdate(chatId, updatedMessages, "No response from server.", "ai");
            }

            // Complete streaming
            setIsStreaming(false);
            setProcessingStage([]);
            setStreamMessageId(uuid());
        } catch (error) {
            console.error("Error sending message:", error);
            setIsStreaming(false);
            setProcessingStage([]);

            // Add error message
            onUpdateChat(chatId, {
                messages: [...updatedMessages, {
                    ...aiMessage,
                    content: 'Sorry, I encountered an issue and couldn\'t respond to your request. Please try again later.',
                }],
            });

            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)));
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle stream data
    const handleStreamData = (chunk: string, chatId: string, messages: Message[], aiMessage: Message) => {
        try {
            const jsonData = JSON.parse(chunk);

            // Handle stage information
            if (jsonData.type === 'stage') {
                setProcessingStage(prevStages => {
                    const existingStage = prevStages.find(stage => stage.content === jsonData.content);
                    if (existingStage) {
                        return prevStages.map(stage =>
                            stage.content === jsonData.content ? {
                                ...stage,
                                message: jsonData.message,
                                status: jsonData.status
                            } : stage
                        );
                    } else {
                        return [...prevStages, {
                            message: jsonData.message,
                            content: jsonData.content,
                            status: jsonData.status
                        }];
                    }
                });
                return;
            }

            // Use latest messages for streaming updates if available
            let latestMessages = messages;

            // Try to get the most recent messages if possible
            if (getLatestChat) {
                const latestChat = getLatestChat(chatId);
                if (latestChat && latestChat.messages) {
                    latestMessages = latestChat.messages;
                }
            }

            switch (jsonData.type) {
                case 'content':
                    if (jsonData.content) {
                        handleContentUpdate(chatId, latestMessages, jsonData.content, 'ai');
                        hasReceivedContentRef.current = true;
                    }
                    break;

                case 'error':
                    console.error("Error from API:", jsonData.error);
                    onUpdateChat(chatId, {
                        messages: [...latestMessages, {
                            ...aiMessage,
                            content: `Error: ${jsonData.error?.message || 'An unknown error occurred'}`,
                        }],
                    });
                    break;

                case 'done':
                    console.log("Stream completed");
                    break;

                default:
                    if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                        const content = jsonData.choices[0].delta.content;
                        if (content) {
                            handleContentUpdate(chatId, latestMessages, content, 'ai');
                            hasReceivedContentRef.current = true;
                        }
                    }
            }
        } catch (e) {
            // If parsing fails, try using the original chunk
            let latestMessages = messages;

            // Try to get the most recent messages if possible
            if (getLatestChat) {
                const latestChat = getLatestChat(chatId);
                if (latestChat && latestChat.messages) {
                    latestMessages = latestChat.messages;
                }
            }

            if (typeof chunk === 'string' && chunk.trim()) {
                handleContentUpdate(chatId, latestMessages, chunk, 'ai');
                hasReceivedContentRef.current = true;
            }
        }
    };

    // Update message content
    const handleContentUpdate = (chatId: string, messages: Message[], content: string, sender: 'user' | 'ai' | 'system' = 'ai') => {
        if (!content || !chatId) return;

        setStreamingContent(prev => {
            const newContent = prev + content;

            // 获取最新的消息
            let currentMessages = [...messages];

            if (currentMessages.length > 0) {
                const lastMessageIndex = currentMessages.length - 1;
                const lastMessage = currentMessages[lastMessageIndex];

                // 判断是否是同一个发送者
                if (lastMessage.sender === sender) {
                    // 创建新的消息对象，保证引用变化触发更新
                    const updatedMessage = {
                        ...lastMessage,
                        content: lastMessage.content + content,
                        id: sender === 'ai' ? streamMessageId : lastMessage.id,
                    };

                    // 更新消息列表
                    currentMessages = [
                        ...currentMessages.slice(0, lastMessageIndex),
                        updatedMessage
                    ];

                    // 更新聊天记录
                    onUpdateChat(chatId, {
                        messages: currentMessages,
                    });
                } else {
                    // 添加新消息
                    const newMessage = {
                        id: sender === 'ai' ? streamMessageId : uuid(),
                        content: content,
                        sender: sender,
                        createdAt: new Date().toLocaleString(),
                    };

                    // 更新聊天记录
                    onUpdateChat(chatId, {
                        messages: [...currentMessages, newMessage],
                    });
                }
            } else {
                // 没有消息，添加第一条消息
                onUpdateChat(chatId, {
                    messages: [{
                        id: sender === 'ai' ? streamMessageId : uuid(),
                        content: content,
                        sender: sender,
                        createdAt: new Date().toLocaleString(),
                    }],
                });
            }

            // 返回累积的内容
            return newContent;
        });
    };

    return {
        isStreaming,
        isProcessing,
        processingStage,
        sendMessage,
        handleContentUpdate
    };
}

