# Agent Chat Completions API Documentation

## Overview
The `/agent/chat/completions` API endpoint provides a chat interface for interacting with an AI agent that can analyze blockchain projects. The endpoint follows a similar structure to OpenAI's Chat Completions API, making it familiar for frontend developers who have worked with LLM APIs before.

## Endpoint

```
POST /agent/chat/completions
```

## Authentication
- Requires an authenticated user session
- Uses JWT authentication (managed by the `get_current_active_user` dependency)

## Request Format

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Analyze the project at address 0x123..."
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1024,
  "project_context": {
    "additional_context": "any relevant context"
  }
}
```

### Request Parameters

| Parameter       | Type    | Required | Default | Description                                               |
| --------------- | ------- | -------- | ------- | --------------------------------------------------------- |
| model           | string  | No       | "gpt-4" | Model identifier (maintained for OpenAI compatibility)    |
| messages        | array   | Yes      | -       | Array of message objects with `role` and `content` fields |
| stream          | boolean | No       | false   | Whether to stream the response or return it all at once   |
| temperature     | float   | No       | 0.7     | Controls randomness in responses (0-1)                    |
| max_tokens      | integer | No       | 1024    | Maximum tokens to generate in the response                |
| project_context | object  | No       | null    | Additional project context information                    |

## Response Format

### Non-Streaming Response

```json
{
  "id": "chatcmpl-123456",
  "object": "chat.completion",
  "created": 1698956234,
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Analysis of the project at 0x123..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 120,
    "total_tokens": 170
  }
}
```

### Streaming Response

The streaming response is delivered as Server-Sent Events (SSE) with `text/event-stream` content type. Three types of events are sent:

1. **Stage Events** - Indicate progress through analysis phases:
   ```
   event: stage
   data: {
     "id": "chatcmpl-123456",
     "object": "chat.completion.chunk",
     "created": 1698956234,
     "model": "gpt-4",
     "choices": [
       {
         "index": 0,
         "delta": {
           "content": "Retrieving project information..."
         },
         "finish_reason": null
       }
     ],
     "stage": "project_info_query",
     "status": 0,
     "type": "stage"
   }
   ```

2. **Content Events** - Deliver actual content chunks:
   ```
   event: content
   data: {
     "id": "chatcmpl-123456",
     "object": "chat.completion.chunk",
     "created": 1698956235,
     "model": "gpt-4",
     "choices": [
       {
         "index": 0,
         "delta": {
           "content": "This project appears to be "
         },
         "finish_reason": null
       }
     ],
     "type": "content"
   }
   ```

3. **Error Events** - Communicate errors:
   ```
   event: error
   data: {
     "error": {
       "message": "Error message",
       "type": "server_error"
     },
     "type": "error"
   }
   ```

4. **Completion Event** - Signals the end of the stream:
   ```
   event: done
   data: [DONE]
   ```

## Stage Types

The API provides progress updates through several analysis stages:

| Stage                    | Description                            |
| ------------------------ | -------------------------------------- |
| project_info_query       | Retrieving basic project information   |
| holders_query            | Retrieving project holders information |
| high_value_holders_query | Analyzing smart wallet holders         |
| ai_analysis              | AI is generating the final analysis    |

## Status Codes

Each stage event includes a status code:

| Status Code | Meaning                            |
| ----------- | ---------------------------------- |
| 0           | START - Stage has begun            |
| 1           | COMPLETE - Stage is complete       |
| 2           | ERROR - Stage encountered an error |

## Error Handling

Errors are returned in two ways:
1. For non-streaming responses, HTTP status codes with error details
2. For streaming responses, error events within the stream

Error types include:
- `invalid_request_error` - Problem with the request format
- `server_error` - Internal server error during processing

## Implementation Notes

1. Authentication is required for all requests
2. The API processes the most recent user message from the messages array
3. When streaming is enabled, progress updates are sent for each analysis phase
4. The service analyzes blockchain projects, retrieving project information and holder data
5. High-value holders are identified through additional analysis
6. The final AI analysis synthesizes all collected data

## Usage Example

```javascript
// Example frontend code (using fetch)
async function chatWithAgent(userMessage) {
  const response = await fetch('/agent/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: userMessage }
      ],
      stream: true
    })
  });

  // Process streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Process complete SSE messages
    const lines = buffer.split('\n\n');
    buffer = lines.pop();
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const [eventType, eventData] = line.split('\n');
      const type = eventType.replace('event: ', '');
      const data = JSON.parse(eventData.replace('data: ', ''));
      
      if (type === 'stage') {
        // Handle stage update
        console.log(`Stage: ${data.stage} - Status: ${data.status}`);
        updateProgressIndicator(data.stage, data.status);
      } else if (type === 'content') {
        // Handle content chunk
        if (data.choices[0].delta.content) {
          appendToResponse(data.choices[0].delta.content);
        }
      } else if (type === 'error') {
        // Handle error
        console.error(data.error);
        showError(data.error.message);
      } else if (type === 'done') {
        // Complete
        finishResponse();
      }
    }
  }
}
```
