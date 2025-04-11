/**
 * SSE客户端 - 使用SSE.ts提供的基础方法发送SSE请求
 */

import { SSE } from '@/lib/sse';

/**
 * 定义SSE事件类型
 */
export interface SSEEvent extends CustomEvent {
    data?: string;
    responseCode?: number;
}

/**
 * 处理返回的数据块类型
 */
export type ChunkType =
    | { type: 'content', content: string }
    | { type: 'stage', stage: { content: string, message: string, status: number } }
    | { type: 'error', error: { message: string, type?: string, status?: number } }
    | { type: 'done' }
    | { type: 'auth_refresh', message: string };

/**
 * 发送SSE请求并处理响应
 * @param url 请求URL
 * @param payload 请求负载
 * @param callbacks 回调函数
 * @returns Promise<void>
 */
export async function sendSSERequest<T>(
    url: string,
    payload: any,
    callbacks: {
        onChunk: (chunk: ChunkType) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
    }
): Promise<T> {
    return new Promise((resolve, reject) => {
        try {
            // 准备请求头
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // 获取访问令牌（如果有）
            const token = localStorage.getItem('access_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            console.log('[SSEClient] 创建SSE连接:', url);

            // 创建SSE连接
            const source = new SSE(url, {
                headers,
                method: 'POST',
                payload: JSON.stringify(payload),
                withCredentials: true
            });

            // 处理连接打开事件
            source.addEventListener('open', function (e) {
                console.log('[SSEClient] SSE连接已打开:', e);
            });

            // 处理错误事件
            source.addEventListener('error', function (e) {
                const event = e as SSEEvent;
                const errorData = event.data || '';
                const errorStatus = event.responseCode || 0;
                const errorMessage = `SSE连接错误: ${errorData || '未知错误'}`;

                console.error('[SSEClient] 错误:', errorMessage, errorStatus);

                // 发送错误回调
                callbacks.onChunk({
                    type: 'error',
                    error: {
                        message: errorMessage,
                        type: 'connection_error',
                        status: errorStatus
                    }
                });

                // 关闭连接
                source.close();

                // 调用错误回调
                if (callbacks.onError) {
                    callbacks.onError(new Error(errorMessage));
                }

                reject(new Error(errorMessage));
            });

            // 处理阶段事件
            source.addEventListener('stage', function (e) {
                const event = e as SSEEvent;
                const data = event.data || '';

                try {
                    const jsonData = JSON.parse(data);
                    const stageContent = jsonData.stage || '';
                    const stageStatus = jsonData.status || 0;
                    const messageContent = jsonData.choices?.[0]?.delta?.content || jsonData.message || '';

                    // 发送阶段更新
                    callbacks.onChunk({
                        type: 'stage',
                        stage: {
                            content: stageContent,
                            message: messageContent,
                            status: stageStatus
                        }
                    });
                } catch (error) {
                    console.warn('[SSEClient] 解析阶段事件失败:', error, data);
                    // 尝试直接使用数据
                    callbacks.onChunk({
                        type: 'stage',
                        stage: {
                            content: typeof data === 'string' ? data : 'Unknown stage',
                            message: '',
                            status: 0
                        }
                    });
                }
            });

            // 处理内容事件
            source.addEventListener('content', function (e) {
                const event = e as SSEEvent;
                const data = event.data || '';

                try {
                    const jsonData = JSON.parse(data);
                    const content = jsonData.choices?.[0]?.delta?.content || jsonData.content || '';

                    if (content) {
                        callbacks.onChunk({
                            type: 'content',
                            content: content
                        });
                    }
                } catch (error) {
                    console.warn('[SSEClient] 解析内容事件失败:', error, data);
                    // 尝试直接使用数据
                    callbacks.onChunk({
                        type: 'content',
                        content: typeof data === 'string' ? data : ''
                    });
                }
            });

            // 处理消息事件（默认事件）
            source.addEventListener('message', function (e) {
                const event = e as SSEEvent;
                const data = event.data || '';

                // 如果是[DONE]消息，处理完成
                if (data === '[DONE]') {
                    callbacks.onChunk({ type: 'done' });
                    source.close();

                    if (callbacks.onComplete) {
                        callbacks.onComplete();
                    }

                    resolve({
                        id: Date.now().toString(),
                        complete: true
                    } as unknown as T);
                    return;
                }

                try {
                    const jsonData = JSON.parse(data);

                    // 检查是否有明确的类型字段
                    if (jsonData.type) {
                        if (jsonData.type === 'error') {
                            // 错误消息
                            callbacks.onChunk({
                                type: 'error',
                                error: jsonData.error || { message: 'Unknown error' }
                            });
                            return;
                        }

                        // 其他类型的消息直接传递
                        if (jsonData.type === 'content' && jsonData.content) {
                            callbacks.onChunk({
                                type: 'content',
                                content: jsonData.content
                            });
                            return;
                        }
                    }

                    // 检查是否有内容更新
                    if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                        const content = jsonData.choices[0].delta.content;
                        if (content) {
                            callbacks.onChunk({
                                type: 'content',
                                content: content
                            });
                        }
                    } else {
                        // 尝试自动推断类型
                        if (jsonData.content) {
                            callbacks.onChunk({
                                type: 'content',
                                content: jsonData.content
                            });
                        } else if (jsonData.message) {
                            callbacks.onChunk({
                                type: 'content',
                                content: jsonData.message
                            });
                        }
                    }
                } catch (error) {
                    console.warn('[SSEClient] 解析消息事件失败:', error, data);
                    // 非JSON消息，直接传递原始数据
                    if (typeof data === 'string' && data.trim() !== '') {
                        callbacks.onChunk({
                            type: 'content',
                            content: data
                        });
                    }
                }
            });

            // 处理完成事件
            source.addEventListener('done', function () {
                source.close();
                callbacks.onChunk({ type: 'done' });

                if (callbacks.onComplete) {
                    callbacks.onComplete();
                }

                resolve({
                    id: Date.now().toString(),
                    complete: true
                } as unknown as T);
            });

            // 启动SSE连接
            source.stream();

        } catch (error) {
            console.error('[SSEClient] 初始化SSE连接错误:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            // 发送错误回调
            callbacks.onChunk({
                type: 'error',
                error: {
                    message: errorMessage,
                    type: 'client_error'
                }
            });

            // 调用错误回调
            if (callbacks.onError) {
                callbacks.onError(error instanceof Error ? error : new Error(errorMessage));
            }

            reject(error);
        }
    });
}

/**
 * 使用SSE发送聊天消息
 * @param url API端点
 * @param messages 消息列表
 * @param onChunk 数据块回调
 * @returns Promise
 */
export async function sendChatStream(
    url: string,
    messages: Array<{ role: string, content: string }>,
    onChunk: (chunk: ChunkType) => void
): Promise<any> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseUrl}${url}`;

    const payload = {
        messages,
        stream: true
    };

    console.log('[sendChatStream] 发送聊天请求:', { url: fullUrl, messagesCount: messages.length });

    return sendSSERequest(fullUrl, payload, {
        onChunk,
        onComplete: () => console.log('[SSEClient] 聊天流完成'),
        onError: (error) => console.error('[SSEClient] 聊天流错误:', error)
    });
} 