import { StreamingMessage, StreamingStage, StreamingOptions, MessageChunk } from './types';
import { nanoid } from './utils';

/**
 * 流式消息管理器
 * 
 * 负责处理消息流和状态更新
 */
export class StreamingMessageManager {
    private messages: StreamingMessage[] = [];
    private stages: StreamingStage[] = [];
    private activeStreamId: string | null = null;
    private options: StreamingOptions;
    private accumulatedContent: string = '';
    private sessionId: string;

    constructor(options: StreamingOptions = {}) {
        this.options = options;
        this.sessionId = options.sessionId || 'default';
        console.log(`[StreamManager] 创建新管理器, 会话ID: ${this.sessionId}`);
    }

    /**
     * 开始一个新的消息流
     */
    public startStream(initialMessage: Partial<StreamingMessage> = {}): string {
        const messageId = initialMessage.id || nanoid();

        // 创建初始消息
        const message: StreamingMessage = {
            id: messageId,
            content: '',
            sender: 'ai',
            status: 'pending',
            createdAt: new Date().toISOString(),
            ...initialMessage,
            sessionId: this.sessionId
        };

        // 清除先前的状态
        this.activeStreamId = messageId;
        this.accumulatedContent = '';

        // 如果重用相同ID的消息，则更新而不是添加
        const existingMessageIndex = this.messages.findIndex(m => m.id === messageId);
        if (existingMessageIndex >= 0) {
            this.messages[existingMessageIndex] = message;
        } else {
            this.messages.push(message);
        }

        // 重置阶段
        this.stages = [{
            id: nanoid(),
            content: '',
            message: 'AI is processing your request...',
            status: 0,
            sessionId: this.sessionId
        }];

        console.log(`[StreamManager] 开始新流，会话ID: ${this.sessionId}, 消息ID: ${messageId}, 当前消息数量: ${this.messages.length}`);
        this.notifyMessageUpdate(message);
        this.notifyStageUpdate();

        return messageId;
    }

    /**
     * 处理消息块
     */
    public processChunk(chunk: string | MessageChunk, messageId?: string): void {
        const targetId = messageId || this.activeStreamId;
        if (!targetId) {
            console.warn('[StreamManager] 没有活动流处理块:', chunk);
            throw new Error('No active stream to process chunk');
        }

        // 解析消息块
        let parsedChunk: MessageChunk;
        if (typeof chunk === 'string') {
            try {
                parsedChunk = JSON.parse(chunk);
                console.log('[StreamManager] 解析JSON块:', parsedChunk);
            } catch (e) {
                // 如果无法解析为JSON，将其视为纯文本内容
                console.log('[StreamManager] 非JSON块，作为文本处理:', chunk);
                parsedChunk = { type: 'content', content: chunk };
            }
        } else {
            parsedChunk = chunk;
            console.log('[StreamManager] 接收到对象块, 类型:', parsedChunk.type);
        }

        // 处理不同类型的消息块
        try {
            switch (parsedChunk.type) {
                case 'content':
                    this.handleContentChunk(targetId, parsedChunk.content || '');
                    break;
                case 'stage':
                    this.handleStageChunk(parsedChunk.stage);
                    break;
                case 'error':
                    this.handleErrorChunk(targetId, parsedChunk.error);
                    break;
                case 'done':
                    this.completeStream(targetId);
                    break;
                default:
                    console.warn('[StreamManager] 未知块类型:', parsedChunk.type, parsedChunk);
                    // 尝试智能处理
                    if (parsedChunk.content) {
                        this.handleContentChunk(targetId, parsedChunk.content);
                    }
            }
        } catch (error) {
            console.error('[StreamManager] 处理块错误:', error);
            this.handleErrorChunk(targetId, {
                message: error instanceof Error ? error.message : String(error),
                type: 'process_error'
            });
        }
    }

    /**
     * 处理内容块
     */
    private handleContentChunk(messageId: string, content: string): void {
        const message = this.findMessage(messageId);
        if (!message) {
            console.warn('[StreamManager] 找不到要更新的消息:', messageId);
            return;
        }

        // 更新累积内容
        this.accumulatedContent += content;
        console.log('[StreamManager] 更新消息内容, 长度:', this.accumulatedContent.length);

        // 更新消息
        message.content = this.accumulatedContent;
        message.status = 'streaming';

        this.notifyMessageUpdate(message);
    }

    /**
     * 处理阶段信息
     */
    private handleStageChunk(stageData?: { content: string; message: string; status: number }): void {
        if (!stageData) {
            console.warn('[StreamManager] 接收到空阶段数据');
            return;
        }

        console.log('[StreamManager] 处理阶段:', stageData);

        // 查找现有阶段或创建新阶段
        const existingStageIndex = this.stages.findIndex(s => s.content === stageData.content);

        if (existingStageIndex >= 0) {
            // 更新现有阶段
            this.stages[existingStageIndex] = {
                ...this.stages[existingStageIndex],
                message: stageData.message,
                status: stageData.status as 0 | 1 | 2
            };
        } else {
            // 添加新阶段
            this.stages.push({
                id: nanoid(),
                content: stageData.content,
                message: stageData.message,
                status: stageData.status as 0 | 1 | 2
            });
        }

        this.notifyStageUpdate();
    }

    /**
     * 处理错误
     */
    private handleErrorChunk(messageId: string, error?: { message: string; type: string }): void {
        const message = this.findMessage(messageId);
        if (!message) return;

        message.status = 'error';
        if (error?.message) {
            message.content = `Error: ${error.message}`;
        }

        this.notifyMessageUpdate(message);

        if (this.options.onError) {
            this.options.onError(new Error(error?.message || 'Unknown error'));
        }
    }

    /**
     * 完成流
     */
    private completeStream(messageId: string): void {
        const message = this.findMessage(messageId);
        if (!message) return;

        message.status = 'completed';
        this.activeStreamId = null;

        this.notifyMessageUpdate(message);

        if (this.options.onComplete) {
            this.options.onComplete();
        }
    }

    /**
     * 手动完成或中止流
     */
    public endStream(messageId?: string, error?: Error): void {
        const targetId = messageId || this.activeStreamId;
        if (!targetId) return;

        if (error) {
            this.handleErrorChunk(targetId, {
                message: error.message,
                type: 'manual_error'
            });
        } else {
            this.completeStream(targetId);
        }
    }

    /**
     * 获取当前所有消息
     */
    public getMessages(): StreamingMessage[] {
        return [...this.messages];
    }

    /**
     * 获取当前阶段
     */
    public getStages(): StreamingStage[] {
        return [...this.stages];
    }

    /**
     * 获取特定消息
     */
    public getMessage(id: string): StreamingMessage | undefined {
        return this.findMessage(id);
    }

    /**
     * 清除所有消息和阶段
     */
    public clear(): void {
        this.messages = [];
        this.stages = [];
        this.activeStreamId = null;
        this.accumulatedContent = '';
    }

    /**
     * 当前是否正在流式处理
     */
    public isStreaming(): boolean {
        return this.activeStreamId !== null;
    }

    /**
     * 查找消息
     */
    private findMessage(id: string): StreamingMessage | undefined {
        return this.messages.find(m => m.id === id);
    }

    /**
     * 通知消息更新
     */
    private notifyMessageUpdate(message: StreamingMessage): void {
        if (this.options.onMessageUpdate) {
            this.options.onMessageUpdate(message);
        }
    }

    /**
     * 通知阶段更新
     */
    private notifyStageUpdate(): void {
        if (this.options.onStageUpdate) {
            this.options.onStageUpdate(this.stages);
        }
    }
} 