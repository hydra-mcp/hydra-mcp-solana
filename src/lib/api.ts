import { SSE } from '@/lib/sse';
import { Chat, Message, OpenAIResponse } from '@/types/chat';
import { triggerApiError } from '@/components/ErrorHandler';

// Add type definition for SSE events
interface SSEvent extends CustomEvent {
  data?: string;
}

const MOCK_DELAY = 1000;
const MOCK_RESPONSES = [
  "I understand your question. Let me help you with that.",
  "That's an interesting point. Here's what I think...",
  "Based on my analysis, I would suggest...",
  "Let me break this down for you...",
];

// Local storage keys
const STORAGE_KEY_PREFIX = 'chatApp';

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
      // Try to refresh token
      try {
        await refreshTokenRequest();

        // Retry original request with new token
        const newToken = getAccessToken();
        if (!newToken) {
          throw new Error('Token refresh failed');
        }

        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        };

        const retryResponse = await fetch(url, {
          ...options,
          headers: newHeaders,
        });

        if (!retryResponse.ok) {
          throw new Error(`API request failed with status ${retryResponse.status}`);
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

        // Trigger global API error event, not redirect directly
        triggerApiError('Authentication failed, please login again', 401, endpoint);

        throw new Error('Authentication failed, please login again');
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

// Stream message request implemented using SSE.ts
export async function sendStreamMessage(
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
      messages.push({ role: 'user', content: message });

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
      const source = new SSE(`${baseUrl}/agent/chat/completions`, {
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
        const event = e as SSEvent;
        const errorData = event.data || '';
        let errorMessage = 'Connection failed';
        let errorStatus = 0;

        // Check if it is a 401 unauthorized error
        if (errorData.includes('401') || errorData.includes('unauthorized') || errorData.includes('Unauthorized')) {
          errorMessage = 'Session expired. Please login again.';
          errorStatus = 401;

          // Try to refresh token
          refreshTokenRequest().catch(() => {
            // Refresh failed, clear token
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_info');

            // Trigger global API error event, not redirect directly
            triggerApiError(errorMessage, 401, '/agent/chat/completions');
          });
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
        const event = e as SSEvent;
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
        const event = e as SSEvent;
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
        const event = e as SSEvent;
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

// Keep original function as fallback
export async function sendMessage(message: string): Promise<OpenAIResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

  // Simulate OpenAI response format
  return {
    id: Date.now().toString(),
    choices: [
      {
        message: {
          content: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)] +
            " " + message,
        },
      },
    ],
  };
}

// Chat history management functions
export function saveChats(chats: Chat[]): void {
  try {
    // Group chats by app ID
    const chatsByApp: Record<string, Chat[]> = {};

    chats.forEach(chat => {
      const appId = chat.appId || 'global';
      if (!chatsByApp[appId]) {
        chatsByApp[appId] = [];
      }
      chatsByApp[appId].push(chat);
    });

    // Store each app's chat history separately
    Object.entries(chatsByApp).forEach(([appId, appChats]) => {
      const storageKey = `${STORAGE_KEY_PREFIX}_${appId}`;
      localStorage.setItem(storageKey, JSON.stringify(appChats));
    });
  } catch (error) {
    console.error('Error saving chats to localStorage:', error);
  }
}

export function loadChats(): Chat[] {
  try {
    const allChats: Chat[] = [];

    // Find all localStorage keys that start with STORAGE_KEY_PREFIX
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_KEY_PREFIX}_`)) {
        const storedChats = localStorage.getItem(key);
        if (storedChats) {
          // Parse stored data
          const chats: Chat[] = JSON.parse(storedChats);
          allChats.push(...chats);
        }
      }
    }

    // Sort by update time, latest first
    return allChats.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error loading chats from localStorage:', error);
  }
  return [];
}

export function loadAppChats(appId: string): Chat[] {
  try {
    if (!appId) return [];

    const storageKey = `${STORAGE_KEY_PREFIX}_${appId}`;
    const storedChats = localStorage.getItem(storageKey);

    if (storedChats) {
      // Parse stored data
      const chats: Chat[] = JSON.parse(storedChats);

      // Sort by update time, latest first
      return chats.sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
    }
  } catch (error) {
    console.error(`Error loading chats for app ${appId}:`, error);
  }
  return [];
}

export function deleteChat(chatId: string): Chat[] {
  // Find the app that contains the the aphat contains the chatId
  const allChats = loadChats();
  const chatToDelete = allChats.find(chat => chat.id === chatId);

  if (!chatToDelete) return allChats;

  const appId = chatToDelete.appId || 'global';
  const storageKey = `${STORAGE_KEY_PREFIX}_${appId}`;
  const appChats = loadAppChats(appId);

  // Remove the chat from the app's chat list
  const updatedAppChats = appChats.filter(chat => chat.id !== chatId);

  // Update storage
  localStorage.setItem(storageKey, JSON.stringify(updatedAppChats));

  // Return the updated chat history
  return allChats.filter(chat => chat.id !== chatId);
}

export function clearAllChats(): void {
  // Find all localStorage keys that start with STORAGE_KEY_PREFIX and delete them
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${STORAGE_KEY_PREFIX}_`)) {
      localStorage.removeItem(key);
    }
  }
}

export function clearAppChats(appId: string): void {
  if (!appId) return;

  const storageKey = `${STORAGE_KEY_PREFIX}_${appId}`;
  localStorage.removeItem(storageKey);
}