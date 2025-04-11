/**
 * 流式API通信
 */

/**
 * 发送流式请求
 * 处理SSE事件流响应
 */
export async function sendStreamRequest(
    url: string,
    payload: any,
    callbacks: {
        onChunk: (chunk: any) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
    }
): Promise<void> {
    try {
        // 准备请求头
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        };

        // 获取访问令牌（如果有）
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('[StreamAPI] 发送请求到:', url);
        // 发送请求
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }

        console.log('[StreamAPI] 开始接收流', response.headers.get('content-type'));

        // 检查是否是SSE响应
        const contentType = response.headers.get('content-type') || '';
        const isEventStream = contentType.includes('text/event-stream');

        if (isEventStream) {
            // 处理标准SSE格式
            await handleEventStream(response, callbacks);
        } else {
            // 尝试以普通流的方式处理
            await handleBinaryStream(response, callbacks);
        }

    } catch (error) {
        console.error('[StreamAPI] 流请求错误:', error);
        if (callbacks.onError) {
            callbacks.onError(error instanceof Error ? error : new Error(String(error)));
        }
    }
}

/**
 * 处理标准的SSE事件流
 */
async function handleEventStream(
    response: Response,
    callbacks: {
        onChunk: (chunk: any) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
    }
): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('响应体不可读');
    }

    // 解码器
    const decoder = new TextDecoder();
    let buffer = '';

    // 处理流
    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            console.log('[StreamAPI] 流结束');
            if (callbacks.onComplete) {
                callbacks.onComplete();
            }
            break;
        }

        // 处理接收到的数据
        buffer += decoder.decode(value, { stream: true });
        console.log('[StreamAPI] 接收到新数据:', buffer.substring(0, 100) + (buffer.length > 100 ? '...' : ''));

        // 按事件分割数据
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim() === '') continue;

            console.log('[StreamAPI] 处理事件:', line.substring(0, 100) + (line.length > 100 ? '...' : ''));
            try {
                // 解析事件和数据
                const eventLines = line.split('\n');
                let eventType = 'message';
                let eventData = '';

                for (const part of eventLines) {
                    if (part.startsWith('event:')) {
                        eventType = part.substring(6).trim();
                    } else if (part.startsWith('data:')) {
                        eventData = part.substring(5).trim();
                    }
                }

                // 解析完整事件
                console.log('[StreamAPI] 解析事件类型:', eventType, '数据:', eventData.substring(0, 50) + (eventData.length > 50 ? '...' : ''));

                // 处理特殊情况
                if (eventData === '[DONE]') {
                    callbacks.onChunk({ type: 'done' });
                    if (callbacks.onComplete) {
                        callbacks.onComplete();
                    }
                    continue;
                }

                try {
                    const jsonData = JSON.parse(eventData);

                    // 根据事件类型创建不同的块
                    if (eventType === 'stage') {
                        callbacks.onChunk({
                            type: 'stage',
                            stage: {
                                content: jsonData.stage || '',
                                message: jsonData.choices?.[0]?.delta?.content || jsonData.message || '',
                                status: jsonData.status || 0
                            }
                        });
                    } else if (eventType === 'content' || eventType === 'message') {
                        callbacks.onChunk({
                            type: 'content',
                            content: jsonData.choices?.[0]?.delta?.content || jsonData.content || ''
                        });
                    } else if (eventType === 'error') {
                        callbacks.onChunk({
                            type: 'error',
                            error: jsonData.error || { message: 'Unknown error' }
                        });
                    } else if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                        // 处理标准OpenAI格式
                        callbacks.onChunk({
                            type: 'content',
                            content: jsonData.choices[0].delta.content
                        });
                    } else {
                        console.log('[StreamAPI] 未知JSON事件:', eventType, jsonData);
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
                } catch (e) {
                    console.log('[StreamAPI] JSON解析失败, 作为文本处理:', e);
                    // 如果JSON解析失败，当作普通文本处理
                    callbacks.onChunk({
                        type: 'content',
                        content: eventData
                    });
                }
            } catch (e) {
                console.error('[StreamAPI] 处理流块错误:', e);
            }
        }
    }
}

/**
 * 处理二进制流
 */
async function handleBinaryStream(
    response: Response,
    callbacks: {
        onChunk: (chunk: any) => void;
        onComplete?: () => void;
        onError?: (error: Error) => void;
    }
): Promise<void> {
    try {
        const text = await response.text();
        console.log('[StreamAPI] 接收到完整响应:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

        try {
            // 尝试解析为JSON
            const json = JSON.parse(text);
            console.log('[StreamAPI] 解析为JSON:', json);

            if (json.error) {
                callbacks.onChunk({
                    type: 'error',
                    error: json.error
                });
            } else if (json.content || json.message) {
                callbacks.onChunk({
                    type: 'content',
                    content: json.content || json.message
                });
            } else if (json.choices && json.choices[0]?.message?.content) {
                callbacks.onChunk({
                    type: 'content',
                    content: json.choices[0].message.content
                });
            }
        } catch (e) {
            console.log('[StreamAPI] 非JSON响应，作为文本处理');
            // 如果不是JSON，当作纯文本内容处理
            callbacks.onChunk({
                type: 'content',
                content: text
            });
        }

        // 完成处理
        callbacks.onChunk({ type: 'done' });
        if (callbacks.onComplete) {
            callbacks.onComplete();
        }
    } catch (e) {
        console.error('[StreamAPI] 处理非流响应错误:', e);
        if (callbacks.onError) {
            callbacks.onError(e instanceof Error ? e : new Error(String(e)));
        }
    }
} 