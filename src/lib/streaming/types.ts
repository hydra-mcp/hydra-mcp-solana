/**
 * Streaming message processing type definition
 */

/**
 * Streaming message object
 */
export interface StreamingMessage {
    id: string;
    content: string;
    sender: 'user' | 'ai' | 'system';
    status: 'pending' | 'streaming' | 'completed' | 'error';
    createdAt: string;
    metadata?: Record<string, any>;
    sessionId?: string;
}

export interface WalletProgressDetail {
    current: number;
    total: number;
    is_high_value: boolean;
    high_value_count: number;
    wallet: string;
}

/**
 * Processing stage information
 */
export interface StreamingStage {
    id: string;
    content: string;
    detail?: Record<string, any> | WalletProgressDetail;
    message: string;
    status: 0 | 1 | 2 | 3; // 0: in progress, 1: completed, 2: error, 3: warning
    sessionId?: string;
}

/**
 * Streaming manager options
 */
export interface StreamingOptions {
    onMessageUpdate?: (message: StreamingMessage) => void;
    onStageUpdate?: (stages: StreamingStage[]) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
    sessionId?: string;
}

/**
 * Message chunk data structure
 */
export interface MessageChunk {
    type: 'content' | 'stage' | 'error' | 'done';
    content?: string;
    stage?: {
        content: string;
        message: string;
        status: number;
        detail?: Record<string, any>;
    };
    error?: {
        message: string;
        type?: string;
        status?: number;
    };
} 