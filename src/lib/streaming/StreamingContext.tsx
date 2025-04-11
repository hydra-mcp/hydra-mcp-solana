import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StreamingMessage, StreamingStage, MessageChunk } from './types';
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

    console.log(`[StreamProvider] Using session ID: ${currentSessionId}`);

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
                            const existingIndex = prev.findIndex(s =>
                                s.content === processedChunk.stage?.content &&
                                (!s.sessionId || s.sessionId === currentSessionId)
                            );

                            // Convert status to proper type (0, 1, 2)
                            const stageStatus = (typeof processedChunk.stage?.status === 'number')
                                ? (processedChunk.stage.status > 1 ? 2 : processedChunk.stage.status < 1 ? 0 : 1) as 0 | 1 | 2
                                : 0 as 0;

                            const stageContent = processedChunk.stage.content || '';
                            const stageMessage = processedChunk.stage.message || '';

                            if (existingIndex >= 0) {
                                const updated = [...prev];
                                updated[existingIndex] = {
                                    ...updated[existingIndex],
                                    content: stageContent,
                                    message: stageMessage,
                                    status: stageStatus,
                                    sessionId: currentSessionId
                                };
                                return updated;
                            }

                            return [...prev, {
                                id: crypto.randomUUID(),
                                content: stageContent,
                                message: stageMessage,
                                status: stageStatus,
                                sessionId: currentSessionId
                            }];
                        });
                    }
                    break;

                case 'error':
                    if (processedChunk.error) {
                        const errorMessage = `Error: ${processedChunk.error.message}`;

                        setMessages(prev => {
                            const msgIndex = prev.findIndex(m => m.id === messageId);
                            if (msgIndex < 0) return prev;

                            const updatedMessages = [...prev];
                            updatedMessages[msgIndex] = {
                                ...updatedMessages[msgIndex],
                                content: errorMessage,
                                status: 'error'
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
        sessionId: currentSessionId
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