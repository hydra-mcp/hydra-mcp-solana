import { SSE } from '@/lib/sse';
import { Chat, Message, OpenAIResponse } from '@/types/chat';
import { triggerApiError } from '@/components/ErrorHandler';
import { useAuth } from '@/contexts/AuthContext';

// Add type definition for SSE events
interface SSEEvent extends CustomEvent {
  data?: string;
  responseCode?: number;
}

// Development mock data
const MOCK_DELAY = 1000;
const MOCK_RESPONSES = [
  "I understand your question. Let me help you with that.",
  "That's an interesting point. Here's what I think...",
  "Based on my analysis, I would suggest...",
  "Let me break this down for you...",
];

// Local storage keys
const STORAGE_KEY = 'chatApp_chats';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Get access token
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

// Check if authenticated
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Common API request function
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = getAccessToken();
    const baseUrl = API_BASE_URL || '';

    // Build full URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 error - token expired
    if (response.status === 401) {
      // Need to get the detail from the body
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.detail ||
        errorBody.error ||
        `API request failed with status ${response.status}`;

      // Try to refresh token
      try {
        await refreshTokenRequest();

        // Retry original request with new token
        const newToken = getAccessToken();
        if (!newToken) {
          throw new Error('Token refresh failed');
        }

        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });

        if (!retryResponse.ok) {
          throw new Error(errorMessage);
        }

        if (retryResponse.status === 204 || retryResponse.status === 404) {
          return {} as T;
        }

        return await retryResponse.json();
      } catch (refreshError) {
        // Refresh failed, clear token and throw error
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');

        // If already on the login page, do not redirect
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        throw new Error(errorMessage);
      }
    }

    // Handle other errors
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.message ||
        errorBody.error ||
        `API request failed with status ${response.status}`;

      // Trigger global API error event
      triggerApiError(errorMessage, response.status, endpoint);

      throw new Error(errorMessage);
    }

    // For 204 and empty responses, return empty object
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    // Try to parse response JSON
    try {
      const data = await response.json();

      // Special handling for /auth/me interface, verify if the returned user information is valid
      if (endpoint === '/auth/me' || endpoint.endsWith('/auth/me')) {
        // Check if the necessary user information fields exist and are valid
        if (!data || !data.id || !data.username) {
          // Clear authentication information
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          throw new Error('Invalid user data received, please login again');
        }
      }

      return data as T;
    } catch (error) {
      console.warn('Failed to parse JSON response:', error);
      throw error;
    }
  } catch (error) {
    console.error('API request error:', error);

    // Check if it is an authentication error, if so redirect to the login page
    if (error instanceof Error &&
      (error.message.includes('Authentication failed') ||
        error.message.includes('Token refresh failed')) && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    throw error;
  }
}

// Refresh token request
export async function refreshTokenRequest(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Update stored token
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

// Function to mock streaming response
export async function mockStreamResponse(message: string, onChunk: (chunk: string) => void) {
  const fullResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)] +
    " " + message;

  // Split response into parts to simulate streaming
  const words = fullResponse.split(' ');

  for (let i = 0; i < words.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
  }

  return {
    id: Date.now().toString(),
    choices: [
      {
        message: {
          content: fullResponse,
        },
      },
    ],
  };
}

export async function sendWalletFinderMessage(message: string, chatHistory: Message[], onChunk: (chunk: string) => void): Promise<OpenAIResponse> {
  return sendStreamMessage('/agent/chat/completions', message, chatHistory, onChunk);
}

// WalletFinder stream message request
export async function sendChatMessage(message: string, chatHistory: Message[], onChunk: (chunk: string) => void): Promise<OpenAIResponse> {
  // return sendStreamMessage('/mcp/chat/completions', message, chatHistory, onChunk);
  return sendStreamMessage('/mcp/chat/completions', message, chatHistory, onChunk);
}

// Stream message request implemented using SSE.ts
export async function sendStreamMessage(
  url: string,
  message: string,
  chatHistory: Message[],
  onChunk: (chunk: string) => void
): Promise<OpenAIResponse> {
  // Get API URL using environment variable or configuration
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // If not authenticated, use mock data
  if (!isAuthenticated()) {
    return mockStreamResponse(message, onChunk);
  }

  // Return Promise
  return new Promise((resolve, reject) => {
    try {
      // Convert chat history to OpenAI format
      const messages = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add current message
      // messages.push({ role: 'user', content: message });

      // Get access token
      const token = getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Store stage messages
      let stageMessages: string[] = [];

      // Create SSE connection
      const source = new SSE(`${baseUrl}${url}`, {
        headers,
        method: 'POST',
        payload: JSON.stringify({
          messages,
          stream: true
        })
      });

      // Handle connection opened
      source.addEventListener('open', function (e) {
        console.log('SSE connection opened:', e);
      });

      // Handle error
      source.addEventListener('error', function (e) {
        const event = e as SSEEvent;
        const errorData = event.data || '';
        let errorStatus = event.responseCode || 0;
        let errorMessage = 'Connection failed';

        // Check if it is a 401 unauthorized error
        if (errorStatus == 401 || errorData.includes('401') || errorData.includes('unauthorized') || errorData.includes('Unauthorized')) {
          errorMessage = 'Session expired. Please login again.';
          errorStatus = 401;

          // Close current connection
          source.close();

          // Notify client that we're attempting to refresh token
          onChunk(JSON.stringify({
            type: 'auth_refresh',
            message: 'Attempting to refresh authentication token...'
          }));

          // Try to refresh token
          refreshTokenRequest().then(() => {
            // Token refresh succeeded, get new token
            const newToken = getAccessToken();
            if (!newToken) {
              throw new Error('Token refresh failed');
            }
            sendStreamMessage(url, message, chatHistory, onChunk).then((response) => {
              resolve(response);
            }).catch((error) => {
              reject(error);
            });

            // Instead of complex event listener transfer, 
            // simply resolve with a retry message to let the client handle retrying
            // resolve({
            //   id: Date.now().toString(),
            //   choices: [
            //     {
            //       message: {
            //         content: "TOKEN_REFRESHED_RETRY_NEEDED",
            //       },
            //     },
            //   ],
            // });

          }).catch(() => {
            // Refresh failed, clear token
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_info');

            // Trigger global API error event, not redirect directly
            triggerApiError(errorMessage, 401, '/agent/chat/completions');

            // Send error to client
            onChunk(JSON.stringify({
              type: 'error',
              error: {
                message: errorMessage,
                type: 'auth_error',
                status: errorStatus
              }
            }));

            reject(new Error(errorMessage));
          });

          return; // Return early to prevent double error handling
        } else {
          errorMessage = `Error: ${errorData}`;
        }

        console.error('SSE connection error:', errorMessage);

        onChunk(JSON.stringify({
          type: 'error',
          error: {
            message: errorMessage,
            type: 'connection_error',
            status: errorStatus
          }
        }));

        source.close();
        reject(new Error(errorMessage));
      });

      // Handle stage event (stage notification)
      source.addEventListener('stage', function (e) {
        const event = e as SSEEvent;
        const data = event.data || '';

        try {
          const jsonData = JSON.parse(data);
          const stageContent = jsonData.stage;
          const stageStatus = jsonData.status;
          const messageContent = jsonData.choices?.[0]?.delta?.content || '';

          // Send stage update
          onChunk(JSON.stringify({
            type: 'stage',
            status: stageStatus,
            content: stageContent,
            message: messageContent
          }));
        } catch (error) {
          console.warn('Failed to parse stage event:', error, data);
          // Try to use data directly
          const stageContent = typeof data === 'string' ? data : 'Unknown stage';

          if (!stageMessages.some(msg => msg.includes(stageContent))) {
            stageMessages.push(stageContent);
          }

          const formattedStages = stageMessages.join('|LINE_BREAK|');
          onChunk(JSON.stringify({
            type: 'stage',
            content: formattedStages
          }));
        }
      });

      // Handle content event (content update)
      source.addEventListener('content', function (e) {
        const event = e as SSEEvent;
        const data = event.data || '';

        try {
          const jsonData = JSON.parse(data);
          const content = jsonData.choices?.[0]?.delta?.content || '';

          if (content) {
            onChunk(JSON.stringify({
              type: 'content',
              content: content
            }));
          }
        } catch (error) {
          console.warn('Failed to parse content event:', error, data);
          // Try to use data directly
          onChunk(JSON.stringify({
            type: 'content',
            content: typeof data === 'string' ? data : ''
          }));
        }
      });

      // Handle message event (default event, handle old format or message without specified event type)
      source.addEventListener('message', function (e) {
        const event = e as SSEEvent;
        const data = event.data || '';

        // If it is a [DONE] message, handle completion
        if (data === '[DONE]') {
          onChunk(JSON.stringify({ type: 'done' }));
          source.close();

          resolve({
            id: Date.now().toString(),
            choices: [
              {
                message: {
                  content: "Stream complete",
                },
              },
            ],
          });
          return;
        }

        try {
          const jsonData = JSON.parse(data);

          // Check if there is a clear type field
          if (jsonData.type) {
            if (jsonData.type === 'error') {
              // Error message
              onChunk(data);
              source.close();
              reject(new Error(jsonData.error?.message || 'Unknown error'));
              return;
            }

            // Other type messages directly pass
            onChunk(data);
            return;
          }

          // Check if there is a stage field
          if (jsonData.stage) {
            // Already handled through 'stage' event, skip duplicate processing
            return;
          }

          // Check if there is content update
          if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
            const content = jsonData.choices[0].delta.content;
            onChunk(JSON.stringify({
              type: 'content',
              content: content
            }));
          } else {
            // Unrecognized format, pass original data directly
            onChunk(data);
          }
        } catch (error) {
          console.warn('Failed to parse message event:', error, data);
          // Non-JSON message, pass original data directly
          onChunk(data);
        }
      });

      // Handle completion event
      source.addEventListener('done', function () {
        source.close();
        onChunk(JSON.stringify({
          type: 'done',
        }));

        resolve({
          id: Date.now().toString(),
          choices: [
            {
              message: {
                content: "Stream complete",
              },
            },
          ],
        });
      });

      // Start SSE connection
      source.stream();

    } catch (error) {
      console.error("Error initializing streaming chat:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      onChunk(JSON.stringify({
        type: 'error',
        error: {
          message: errorMessage,
          type: 'client_error'
        }
      }));

      reject(error);
    }
  });
}

export async function sendMessage(url: string, message: string, chatHistory: Message[], onChunk: (chunk: string) => void): Promise<OpenAIResponse> {
  try {
    // Build full URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseUrl}${url}`;

    // Get access token
    const token = getAccessToken();

    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build message body, only include current message
    const payload = {
      messages: chatHistory.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content })),
      stream: false
    };

    // Send request
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    // Handle error response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Request failed, status code: ${response.status}`;

      // Trigger global API error event
      triggerApiError(errorMessage, response.status, fullUrl);

      throw new Error(errorMessage);
    }

    // Parse and return response
    const data = await response.json();
    onChunk && onChunk(data.choices[0].message.content);
    return data as OpenAIResponse;
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
}

// Chat history management functions
export function saveChats(chats: Chat[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving chats to localStorage:', error);
  }
}

export function loadChats(): Chat[] {
  try {
    const storedChats = localStorage.getItem(STORAGE_KEY);
    if (storedChats) {
      // Parse the stored data
      const chats: Chat[] = JSON.parse(storedChats);
      return chats;
    }
  } catch (error) {
    console.error('Error loading chats from localStorage:', error);
  }
  return [];
}

export function deleteChat(chatId: string): Chat[] {
  const chats = loadChats();
  const updatedChats = chats.filter(chat => chat.id !== chatId);
  saveChats(updatedChats);
  return updatedChats;
}

export function clearAllChats(): void {
  saveChats([]);
}