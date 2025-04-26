import { useCallback, useState, useRef } from 'react';
import { Message, Chat } from '@/types/chat';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { sendChatStream, ChunkType } from '@/lib/streaming/sseClient';
import { StreamingMessage, MessageChunk } from '@/lib/streaming/types';
import { generateChatTitle } from '@/lib/utils';
import { AppDefinition } from '@/components/ios/AppRegistry';

/**
 * Streaming chat hook configuration
 */
interface UseChatWithStreamingOptions {
    apiEndpoint: string;
    onUpdateChat: (chatId: string, updates: Partial<Chat>) => void;
    onError?: (error: Error) => void;
    config: {
        appDefinition?: AppDefinition;
    };
}

/**
 * Hook for streaming chat functionality
 */
export function useChatWithStreaming({
    apiEndpoint,
    onUpdateChat,
    onError,
    config
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

        // clear all previous errors and cache
        // 1. clear content cache
        messageContentRef.current = { [aiMessageId]: '' };

        // 2. reset stages
        if (!streamingContext) {
            stagesRef.current[chatId] = [];
        } else {
            // 3. clear messages and error status in streaming context
            streamingContext.clearMessages();
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
                        // Check if we were refreshing auth and now it's complete
                        const wasRefreshingAuth = isRefreshingAuth;
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
                                // If we were refreshing auth, replace the placeholder completely
                                content: wasRefreshingAuth
                                    ? messageContentRef.current[aiMessageId]
                                    : messageContentRef.current[aiMessageId]
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
                        // ensure only save error content of current message, not accumulate previous errors
                        messageContentRef.current = { [aiMessageId]: errorMessage };

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
                },
                config?.appDefinition?.id
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

        } catch (error: any) {
            console.error('[sendMessage] Error during stream processing:', error);

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
    }, [apiEndpoint, isProcessing, onUpdateChat, onError, streamingContext, config]);

    return {
        sendMessage,
        isProcessing,
        isRefreshingAuth,
        sessionId: streamingContext?.sessionId || 'default'
    };
} 