import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StreamingMessage, StreamingStage, MessageChunk, StageStatus } from './types';
import { ChunkType } from './sseClient';

/**
 * Context type definition
 */
interface StreamingContextType {
    messages: StreamingMessage[];
    stages: StreamingStage[];
    isStreaming: boolean;
    startStream: (initialMessage?: Partial<StreamingMessage>) => string;
    processChunk: (chunk: ChunkType | string | MessageChunk, messageId?: string) => void;
    endStream: (messageId?: string, error?: Error) => void;
    clearMessages: () => void;
    sessionId: string;
    lastError: { message: string; type?: string; status?: number } | null;
}

/**
 * Create context
 */
const StreamingContext = createContext<StreamingContextType | null>(null);

/**
 * Provider props
 */
interface StreamingProviderProps {
    children: ReactNode;
    options?: {
        onError?: (error: Error) => void;
    };
    sessionId?: string;
}

/**
 * Streaming Provider component - simplified version that's compatible with our SSE client
 */
export function StreamingProvider({
    children,
    options,
    sessionId = 'default'
}: StreamingProviderProps) {
    // States
    const [messages, setMessages] = useState<StreamingMessage[]>([]);
    const [stages, setStages] = useState<StreamingStage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentSessionId] = useState(sessionId);
    const [lastError, setLastError] = useState<{ message: string; type?: string; status?: number } | null>(null);

    // Start a streaming message
    const startStream = useCallback((initialMessage?: Partial<StreamingMessage>): string => {
        const messageId = initialMessage?.id || crypto.randomUUID();

        // Create initial message
        const message: StreamingMessage = {
            id: messageId,
            content: '',
            sender: 'ai',
            status: 'pending',
            createdAt: initialMessage?.createdAt || new Date().toISOString(),
            sessionId: currentSessionId,
            ...initialMessage
        };

        setIsStreaming(true);

        // Update message list
        setMessages(prev => {
            const index = prev.findIndex(m => m.id === messageId);
            if (index >= 0) {
                return [...prev.slice(0, index), message, ...prev.slice(index + 1)];
            }
            return [...prev, message];
        });

        // Clear stages when starting a new stream
        setStages([]);

        return messageId;
    }, [currentSessionId]);

    // Process a message chunk
    const processChunk = useCallback((chunk: ChunkType | string | MessageChunk, messageId?: string) => {
        if (!messageId) return;

        // Convert string to proper chunk object
        let processedChunk: ChunkType | MessageChunk;

        if (typeof chunk === 'string') {
            try {
                processedChunk = JSON.parse(chunk);
                if (!('type' in processedChunk)) {
                    processedChunk = { type: 'content', content: chunk };
                }
            } catch (e) {
                // Treat as plain text content if not valid JSON
                processedChunk = { type: 'content', content: chunk };
            }
        } else {
            processedChunk = chunk;
        }

        // Process chunk based on type
        if ('type' in processedChunk) {
            switch (processedChunk.type) {
                case 'content':
                    if (processedChunk.content) {
                        setMessages(prev => {
                            const msgIndex = prev.findIndex(m => m.id === messageId);
                            if (msgIndex < 0) return prev;

                            const updatedMessages = [...prev];
                            updatedMessages[msgIndex] = {
                                ...updatedMessages[msgIndex],
                                content: updatedMessages[msgIndex].content + processedChunk.content,
                                status: 'streaming'
                            };
                            return updatedMessages;
                        });
                    }
                    break;

                case 'stage':
                    if (processedChunk.stage) {
                        setStages(prev => {
                            let stageStatus: StageStatus = processedChunk.stage.status as StageStatus;
                            const stageContent = processedChunk.stage.content || '';
                            const stageDetail = processedChunk.stage.detail || {};
                            const stageMessage = processedChunk.stage.message || '';

                            // Generate a unique ID for this stage
                            const stageId = crypto.randomUUID();

                            // Instead of finding existing stages by content, just update status of stages with matching content
                            // This preserves the original order while allowing status updates
                            let updatedPrev = [...prev];
                            let needToAdd = true;

                            // If a stage with the same content exists, update its status AND detail object
                            for (let i = 0; i < updatedPrev.length; i++) {
                                if (updatedPrev[i].content === stageContent) {
                                    updatedPrev[i] = {
                                        ...updatedPrev[i],
                                        status: stageStatus,
                                        // Always update the detail object with the latest values
                                        detail: stageDetail,
                                        message: stageMessage
                                    };
                                    needToAdd = false;
                                    break;
                                }
                            }

                            // If no matching stage was found, add this as a new stage at the end
                            // This preserves the order in which stages were received
                            if (needToAdd) {
                                updatedPrev.push({
                                    id: stageId,
                                    content: stageContent,
                                    detail: stageDetail,
                                    message: stageMessage,
                                    status: stageStatus,
                                    sessionId: currentSessionId
                                });
                            }

                            return updatedPrev;
                        });
                    }
                    break;

                case 'error':
                    if (processedChunk.error) {
                        const errorMessage = `Error: ${processedChunk.error.message}`;
                        const errorType = processedChunk.error.type || 'unknown';
                        const errorStatus = processedChunk.error.status || 0;

                        // Store the error details
                        setLastError({
                            message: errorMessage,
                            type: errorType,
                            status: errorStatus
                        });

                        setMessages(prev => {
                            const msgIndex = prev.findIndex(m => m.id === messageId);
                            if (msgIndex < 0) return prev;

                            const updatedMessages = [...prev];
                            updatedMessages[msgIndex] = {
                                ...updatedMessages[msgIndex],
                                content: errorMessage,
                                status: 'error',
                                metadata: {
                                    ...updatedMessages[msgIndex].metadata,
                                    errorType,
                                    errorStatus
                                }
                            };
                            return updatedMessages;
                        });

                        if (options?.onError) {
                            options.onError(new Error(processedChunk.error.message));
                        }
                    }
                    break;

                case 'done':
                    endStream(messageId);
                    break;
            }
        }
    }, [currentSessionId, options]);

    // End a stream
    const endStream = useCallback((messageId?: string, error?: Error) => {
        if (messageId) {
            setMessages(prev => {
                const msgIndex = prev.findIndex(m => m.id === messageId);
                if (msgIndex < 0) return prev;

                const updatedMessages = [...prev];
                updatedMessages[msgIndex] = {
                    ...updatedMessages[msgIndex],
                    status: error ? 'error' : 'completed'
                };
                return updatedMessages;
            });
        }

        setIsStreaming(false);

        if (error && options?.onError) {
            options.onError(error);
        }
    }, [options]);

    // Clear all messages
    const clearMessages = useCallback(() => {
        setMessages([]);
        setStages([]);
        setIsStreaming(false);
        setLastError(null);
    }, []);

    // Context value
    const value = {
        messages,
        stages,
        isStreaming,
        startStream,
        processChunk,
        endStream,
        clearMessages,
        sessionId: currentSessionId,
        lastError
    };

    return (
        <StreamingContext.Provider value={value}>
            {children}
        </StreamingContext.Provider>
    );
}

/**
 * Hook to use streaming messages
 */
export function useStreaming() {
    const context = useContext(StreamingContext);
    if (!context) {
        throw new Error('useStreaming must be used within a StreamingProvider');
    }
    return context;
} 