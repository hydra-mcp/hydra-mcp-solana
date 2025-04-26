import { SSE } from '@/lib/sse';
import { Chat, Message, OpenAIResponse } from '@/types/chat';
import { triggerApiError } from '@/components/ErrorHandler';
import { useAuth } from '@/contexts/AuthContext';
import { sendChatStream, ChunkType } from '@/lib/streaming/sseClient';

// Add type definition for SSE events
interface SSEEvent extends CustomEvent {
  data?: string;
  responseCode?: number;
}

// Define the expected API response structure
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  error: string | null;
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

  try {
    // Convert chat history to OpenAI format
    const messages = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Use the new SSE client to send the request
    const result = await sendChatStream(
      url,
      messages,
      // Process data blocks, convert to string and pass to the original onChunk callback
      (chunk: ChunkType) => {
        onChunk(JSON.stringify(chunk));
      }
    );

    // Return compatible response format
    return {
      id: result?.id || Date.now().toString(),
      choices: [
        {
          message: {
            content: "Stream complete",
          },
        },
      ],
    };
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

    throw error;
  }
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