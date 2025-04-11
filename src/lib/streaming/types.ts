/**
 * 流式消息处理类型定义
 */

/**
 * 流式消息对象
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

/**
 * 处理阶段信息
 */
export interface StreamingStage {
    id: string;
    content: string;
    message: string;
    status: 0 | 1 | 2; // 0: in progress, 1: completed, 2: error
    sessionId?: string;
}

/**
 * 流式管理器选项
 */
export interface StreamingOptions {
    onMessageUpdate?: (message: StreamingMessage) => void;
    onStageUpdate?: (stages: StreamingStage[]) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
    sessionId?: string;
}

/**
 * 消息块数据结构
 */
export interface MessageChunk {
    type: 'content' | 'stage' | 'error' | 'done';
    content?: string;
    stage?: {
        content: string;
        message: string;
        status: number;
    };
    error?: {
        message: string;
        type: string;
    };
} 