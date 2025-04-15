import { useCallback, useState, useRef } from 'react';
import { Message, Chat } from '@/types/chat';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { sendChatStream, ChunkType } from '@/lib/streaming/sseClient';
import { StreamingMessage, MessageChunk } from '@/lib/streaming/types';
import { generateChatTitle } from '@/lib/utils';

/**
 * Streaming chat hook configuration
 */
interface UseChatWithStreamingOptions {
    apiEndpoint: string;
    onUpdateChat: (chatId: string, updates: Partial<Chat>) => void;
    onError?: (error: Error) => void;
}

/**
 * Hook for streaming chat functionality
 */
export function useChatWithStreaming({
    apiEndpoint,
    onUpdateChat,
    onError
}: UseChatWithStreamingOptions) {
    // States
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRefreshingAuth, setIsRefreshingAuth] = useState(false);
    // Content cache for fallback
    const messageContentRef = useRef<{ [key: string]: string }>({});
    // Stage cache for storing stages when StreamingContext is not available
    const stagesRef = useRef<{ [key: string]: any[] }>({});

    // Get streaming context
    let streamingContext;

    try {
        // Get streaming context from provider
        streamingContext = useStreaming();
    } catch (error) {
        console.warn('[useChatWithStreaming] Not in StreamingProvider context, using direct stream processing');
    }

    /**
     * Send a message and handle streaming response
     */
    const sendMessage = useCallback(async (
        chatId: string,
        currentChat: Chat,
        content: string
    ) => {
        // Input validation
        if (!content.trim() || !chatId || isProcessing) return;

        setIsProcessing(true);
        setIsRefreshingAuth(false);
        const aiMessageId = crypto.randomUUID();

        // Reset content cache for this message
        messageContentRef.current[aiMessageId] = '';

        // Reset stages for this chat
        if (!streamingContext) {
            stagesRef.current[chatId] = [];
        }

        try {
            // Create user message
            const userMessage: Message = {
                id: crypto.randomUUID(),
                content: content.trim(),
                sender: 'user',
                createdAt: new Date().toISOString(),
            };

            // Create AI message placeholder
            const aiMessage: Message = {
                id: aiMessageId,
                content: '',
                sender: 'ai',
                createdAt: new Date().toISOString(),
            };

            // Update chat history with user message
            const updatedMessages = [...(currentChat?.messages || []), userMessage];

            // Check if we need to update the title (first user message)
            let updatedTitle = currentChat?.title;

            // Generate title if this is the first user message and title is the default
            if (updatedMessages.length === 1 && (!currentChat?.title || currentChat.title === 'New Chat')) {
                // Import from utils to avoid circular dependencies
                updatedTitle = generateChatTitle(content);
            }

            // First update: add user message and AI message placeholder
            onUpdateChat(chatId, {
                messages: [...updatedMessages, aiMessage],
                title: updatedTitle,
            });

            // console.log(`[sendMessage] Starting stream processing, chatId: ${chatId}, messageId: ${aiMessageId}`);

            // Start streaming if context is available
            if (streamingContext) {
                streamingContext.startStream({
                    id: aiMessageId,
                    sender: 'ai',
                    content: '',
                    createdAt: aiMessage.createdAt
                });
            }

            // Format messages for API
            const messages = updatedMessages.slice(-10).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

            // Current messages reference for updates
            let currentMessages = [...updatedMessages, aiMessage];

            // Send request using SSE client
            await sendChatStream(
                apiEndpoint,
                messages,
                (chunk: ChunkType) => {
                    // Process chunk in streaming context if available
                    if (streamingContext) {
                        streamingContext.processChunk(chunk, aiMessageId);
                    }

                    // auth_refresh type
                    if (chunk.type === 'auth_refresh') {
                        setIsRefreshingAuth(true);

                        // refresh auth info in message
                        const aiMessageIndex = currentMessages.findIndex(m => m.id === aiMessageId);
                        if (aiMessageIndex >= 0) {
                            const updatedMessagesList = [...currentMessages];
                            updatedMessagesList[aiMessageIndex] = {
                                ...updatedMessagesList[aiMessageIndex],
                                content: 'Refreshing auth info, please wait...'
                            };

                            currentMessages = updatedMessagesList;

                            onUpdateChat(chatId, {
                                messages: updatedMessagesList
                            });
                        }

                        console.log(`[streamUpdate] Refreshing auth: ${chunk.message}`);
                        return;
                    }

                    // Also handle content updates directly for unified UX
                    if (chunk.type === 'content' && chunk.content) {
                        setIsRefreshingAuth(false);

                        // Accumulate content in cache
                        messageContentRef.current[aiMessageId] += chunk.content;

                        // Find AI message in the latest message list
                        const aiMessageIndex = currentMessages.findIndex(m => m.id === aiMessageId);
                        if (aiMessageIndex >= 0) {
                            // Create new message list with updated AI message
                            const updatedMessagesList = [...currentMessages];
                            updatedMessagesList[aiMessageIndex] = {
                                ...updatedMessagesList[aiMessageIndex],
                                content: messageContentRef.current[aiMessageId]
                            };

                            // Update reference
                            currentMessages = updatedMessagesList;

                            // Update chat state
                            onUpdateChat(chatId, {
                                messages: updatedMessagesList
                            });

                            // console.log(`[streamUpdate] Updated message content, length: ${messageContentRef.current[aiMessageId].length} chars`);
                        } else {
                            console.warn(`[streamUpdate] Message not found: ${aiMessageId}`);
                        }
                    } else if (chunk.type === 'stage' && chunk.stage) {
                        // Handle stage updates directly when StreamingContext is not available
                        if (!streamingContext) {
                            const stageData = chunk.stage;
                            const stageId = crypto.randomUUID();

                            // Convert status to proper type (0, 1, 2)
                            const stageStatus = typeof stageData.status === 'number'
                                ? (stageData.status > 1 ? 2 : stageData.status < 1 ? 0 : 1)
                                : 0;

                            // Add stage to chat metadata
                            if (!stagesRef.current[chatId]) {
                                stagesRef.current[chatId] = [];
                            }

                            const stage = {
                                id: stageId,
                                content: stageData.content || '',
                                message: stageData.message || '',
                                status: stageStatus
                            };

                            // Check if we already have a similar stage (by content)
                            const existingIndex = stagesRef.current[chatId].findIndex(
                                s => s.content === stage.content
                            );

                            if (existingIndex >= 0) {
                                // Update existing stage
                                stagesRef.current[chatId][existingIndex] = stage;
                            } else {
                                // Add new stage
                                stagesRef.current[chatId].push(stage);
                            }

                            // Update chat with stages in metadata
                            onUpdateChat(chatId, {
                                metadata: {
                                    ...currentChat.metadata,
                                    stages: stagesRef.current[chatId]
                                }
                            });

                            console.log(`[streamUpdate] Updated stage data: ${stageData.message || stageData.content}`);
                        }
                    } else if (chunk.type === 'error' && chunk.error) {
                        setIsRefreshingAuth(false);

                        // Handle error
                        const errorMessage = `Error: ${chunk.error.message}`;
                        messageContentRef.current[aiMessageId] = errorMessage;

                        // Update message with error
                        const aiMessageIndex = currentMessages.findIndex(m => m.id === aiMessageId);
                        if (aiMessageIndex >= 0) {
                            const updatedMessagesList = [...currentMessages];
                            updatedMessagesList[aiMessageIndex] = {
                                ...updatedMessagesList[aiMessageIndex],
                                content: errorMessage
                            };

                            currentMessages = updatedMessagesList;

                            onUpdateChat(chatId, {
                                messages: updatedMessagesList
                            });
                        }

                        // Propagate error
                        if (onError) {
                            onError(new Error(chunk.error.message));
                        }
                    }
                }
            );

            // Stream complete
            // console.log(`[streamEnd] Final message content length: ${messageContentRef.current[aiMessageId]?.length || 0} chars`);

            // End streaming in context if available
            if (streamingContext) {
                streamingContext.endStream(aiMessageId);
            }

            // Cleanup
            setIsProcessing(false);
            setIsRefreshingAuth(false);
            delete messageContentRef.current[aiMessageId];

        } catch (error) {
            console.error(`[sendMessage] Error:`, error);

            // End streaming in context if available
            if (streamingContext) {
                streamingContext.endStream(aiMessageId, error instanceof Error ? error : new Error(String(error)));
            }

            setIsProcessing(false);
            setIsRefreshingAuth(false);
            delete messageContentRef.current[aiMessageId];

            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)));
            }
        }
    }, [apiEndpoint, isProcessing, onUpdateChat, onError, streamingContext]);

    return {
        sendMessage,
        isProcessing,
        isRefreshingAuth,
        sessionId: streamingContext?.sessionId || 'default'
    };
} 