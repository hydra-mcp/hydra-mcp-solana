/**
 * SSEClient 使用示例
 */

import { sendChatStream, ChunkType } from './sseClient';

/**
 * 示例函数：如何使用SSE发送聊天消息并处理响应
 */
export async function chatWithSSE(userMessage: string): Promise<string> {
    // 完整响应内容
    let fullResponse = '';

    // 构建消息历史
    const messages = [
        { role: 'user', content: userMessage }
    ];

    // 处理接收到的数据块
    const handleChunk = (chunk: ChunkType) => {
        // 根据不同类型处理数据
        switch (chunk.type) {
            case 'content':
                // 处理内容更新
                console.log('收到内容:', chunk.content);
                fullResponse += chunk.content;
                break;

            case 'stage':
                // 处理阶段更新
                console.log('进度更新:', chunk.stage.content, '状态:', chunk.stage.status);
                break;

            case 'error':
                // 处理错误
                console.error('错误:', chunk.error.message);
                break;

            case 'done':
                // 处理完成
                console.log('流式响应完成');
                break;
        }
    };

    try {
        // 发送SSE请求
        await sendChatStream(
            '/api/chat/completions',
            messages,
            handleChunk
        );

        return fullResponse;
    } catch (error) {
        console.error('聊天请求失败:', error);
        throw error;
    }
}

/**
 * 使用示例：在UI组件中使用
 * 
 * ```jsx
 * import { useState } from 'react';
 * import { chatWithSSE } from '@/lib/streaming/sseExample';
 * 
 * export function ChatComponent() {
 *   const [message, setMessage] = useState('');
 *   const [response, setResponse] = useState('');
 *   const [loading, setLoading] = useState(false);
 * 
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     if (!message.trim()) return;
 *     
 *     setLoading(true);
 *     
 *     try {
 *       const result = await chatWithSSE(message);
 *       setResponse(result);
 *     } catch (error) {
 *       console.error('聊天失败:', error);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <form onSubmit={handleSubmit}>
 *         <input
 *           value={message}
 *           onChange={(e) => setMessage(e.target.value)}
 *           placeholder="输入消息..."
 *         />
 *         <button type="submit" disabled={loading}>发送</button>
 *       </form>
 *       
 *       {loading ? <div>加载中...</div> : null}
 *       {response ? <div>{response}</div> : null}
 *     </div>
 *   );
 * }
 * ```
 */ 