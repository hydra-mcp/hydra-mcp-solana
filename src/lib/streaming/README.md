# 流式通信模块

这个模块提供了基于SSE（Server-Sent Events）的流式通信实现，用于处理AI聊天和其他需要流式响应的场景。

## 核心组件

### 1. SSE客户端 (`sseClient.ts`)

提供底层SSE请求功能:

```typescript
import { sendChatStream, ChunkType } from '@/lib/streaming/sseClient';

// 使用示例
sendChatStream(
  '/api/chat/completions',
  [{ role: 'user', content: '你好' }],
  (chunk) => {
    // 处理返回的数据块
    console.log(chunk);
  }
);
```

### 2. 直接集成方式

最简单的集成方式是直接使用SSE客户端:

```typescript
import { sendSSERequest, ChunkType } from '@/lib/streaming/sseClient';

// 发送请求并处理响应
const response = await sendSSERequest(
  'https://api.example.com/stream',
  { query: 'Hello' },
  {
    onChunk: (chunk: ChunkType) => {
      switch (chunk.type) {
        case 'content':
          console.log('接收到内容:', chunk.content);
          break;
        case 'stage':
          console.log('阶段更新:', chunk.stage);
          break;
        case 'error':
          console.error('错误:', chunk.error);
          break;
        case 'done':
          console.log('流结束');
          break;
      }
    },
    onComplete: () => console.log('请求完成'),
    onError: (err) => console.error('请求错误:', err)
  }
);
```

## 数据类型

主要数据类型:

- `ChunkType`: 流数据块类型（content/stage/error/done）
  - `content`: 内容更新
  - `stage`: 处理阶段通知
  - `error`: 错误信息
  - `done`: 完成通知

请参考 `types.ts` 获取完整类型定义。