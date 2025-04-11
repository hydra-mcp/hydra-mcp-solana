import { useState } from 'react';
import { Message, ProcessingStage } from '@/types/chat';
import { uuid } from '@/lib/utils';
import { sendChatMessage, sendStreamMessage } from '@/lib/api';

interface UseChatMessagesOptions {
    apiEndpoint?: string;
    onUpdateChat: (chatId: string, updates: any) => void;
    onError?: (error: Error) => void;
}

export function useChatMessages(options: UseChatMessagesOptions) {
    const { apiEndpoint, onUpdateChat, onError } = options;

    const [isStreaming, setIsStreaming] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [processingStage, setProcessingStage] = useState<ProcessingStage[]>([]);
    const [streamMessageId, setStreamMessageId] = useState<string>(uuid());

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
        setProcessingStage([{
            message: 'AI is processing your request...',
            content: '',
            status: 0
        }]);

        let hasReceivedContent = false;

        try {
            // Send message to API
            await sendStreamMessage(
                apiEndpoint,
                content.trim(),
                updatedMessages,
                (chunk) => {
                    handleStreamData(chunk, chatId, updatedMessages, aiMessage, hasReceivedContent);
                }
            );

            if (!hasReceivedContent) {
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
    const handleStreamData = (chunk: string, chatId: string, messages: Message[], aiMessage: Message, hasReceivedContent: boolean) => {
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

            switch (jsonData.type) {
                case 'content':
                    if (jsonData.content) {
                        handleContentUpdate(chatId, messages, jsonData.content, 'ai');
                        hasReceivedContent = true;
                    }
                    break;

                case 'error':
                    console.error("Error from API:", jsonData.error);
                    onUpdateChat(chatId, {
                        messages: [...messages, {
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
                            handleContentUpdate(chatId, messages, content, 'ai');
                            hasReceivedContent = true;
                        }
                    }
            }
        } catch (e) {
            // If parsing fails, try using the original chunk
            if (typeof chunk === 'string' && chunk.trim()) {
                handleContentUpdate(chatId, messages, chunk, 'ai');
                hasReceivedContent = true;
            }
        }
    };

    // Update message content
    const handleContentUpdate = (chatId: string, messages: Message[], content: string, sender: 'user' | 'ai' | 'system' = 'ai') => {
        if (!content || !chatId) return;

        setStreamingContent(prev => {
            const newContent = prev + content;

            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];

                if (lastMessage.sender === sender) {
                    onUpdateChat(chatId, {
                        messages: [...messages.slice(0, -1), {
                            ...lastMessage,
                            content: lastMessage.content + content,
                            id: sender === 'ai' ? streamMessageId : lastMessage.id,
                        }],
                    });
                } else {
                    onUpdateChat(chatId, {
                        messages: [...messages, {
                            id: sender === 'ai' ? streamMessageId : uuid(),
                            content: content,
                            sender: sender,
                            createdAt: new Date().toLocaleString(),
                        }],
                    });
                }
            } else {
                onUpdateChat(chatId, {
                    messages: [{
                        id: sender === 'ai' ? streamMessageId : uuid(),
                        content: content,
                        sender: sender,
                        createdAt: new Date().toLocaleString(),
                    }],
                });
            }

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
