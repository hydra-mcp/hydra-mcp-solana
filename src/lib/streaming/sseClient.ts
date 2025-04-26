/**
 * SSE Client - Use the basic methods provided by SSE.ts to send SSE requests
 */

import { SSE } from '@/lib/sse';
import { StageStatus } from './types';
/**
 * Define SSE event type
 */
export interface SSEEvent extends CustomEvent {
    data?: string;
    responseCode?: number;
}

/**
 * Process the returned data block type
 */
export type ChunkType =
    | { type: 'content', content: string }
    | { type: 'stage', stage: { content: string, message: string, status: StageStatus, detail?: Record<string, any> } }
    | { type: 'error', error: { message: string, type?: string, status?: number } }
    | { type: 'done' }
    | { type: 'auth_refresh', message: string };

/**
 * Get access token from localStorage
 */
function getAccessTokenFromStorage(): string | null {
    return localStorage.getItem('access_token');
}

/**
 * Simplified token refresh implementation
 */
async function refreshTokenFromStorage(): Promise<boolean> {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${baseUrl}/auth/refresh`, {
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

        // Update stored tokens
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }

        return true;
    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
}

/**
 * Send SSE request and process response
 * @param url Request URL
 * @param payload Request payload
 * @param callbacks Callback functions
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
            // Prepare request headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            // Get access token (if any)
            const token = getAccessTokenFromStorage();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            console.log('[SSEClient] Creating SSE connection:', url);

            // Create SSE connection
            const source = new SSE(url, {
                headers,
                method: 'POST',
                payload: JSON.stringify(payload),
                withCredentials: true
            });

            // Handle connection open event
            source.addEventListener('open', function (e) {
                console.log('[SSEClient] SSE connection opened:', e);
            });

            // Handle error event
            source.addEventListener('error', function (e) {
                const event = e as SSEEvent;
                let errorData = event.data || '';
                const errorStatus = event.responseCode || 0;
                let errorMessage = ""
                let errorType = ""
                try {
                    errorData = JSON.parse(errorData);
                    errorMessage = (errorData as any).message || errorData;
                    errorType = (errorData as any).type || "";
                } catch (error) {
                    console.warn('[SSEClient] Failed to parse error event:', error, errorData);
                }
                // const errorMessage = `SSE connection error: ${errorData || 'Unknown error'}`;

                console.error('[SSEClient] Error:', errorMessage, errorStatus);

                // Handle 401 error - token expired
                if (errorStatus === 401) {
                    console.log('[SSEClient] Attempting to refresh token...');

                    // Notify client that token is being refreshed
                    callbacks.onChunk({
                        type: 'auth_refresh',
                        message: 'Refreshing authentication info...'
                    });

                    // Close current connection
                    source.close();

                    // Attempt to refresh token and retry
                    refreshTokenFromStorage()
                        .then((success) => {
                            if (!success) {
                                throw new Error('Token refresh failed');
                            }

                            console.log('[SSEClient] Refreshed token, retrying request');

                            // Retry request with new token
                            const newToken = getAccessTokenFromStorage();
                            if (!newToken) {
                                throw new Error('Token refresh failed');
                            }

                            return sendSSERequest<T>(url, payload, callbacks);
                        })
                        .then(resolve)
                        .catch((refreshError) => {
                            console.error('[SSEClient] Token refresh failed:', refreshError);

                            // Send authentication failed error
                            callbacks.onChunk({
                                type: 'error',
                                error: {
                                    message: 'Authentication expired, please login again',
                                    type: 'auth_error',
                                    status: 401
                                }
                            });

                            // Clear tokens and possibly redirect to login page
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                            localStorage.removeItem('user_info');

                            // If not on login page, consider redirecting
                            if (window.location.pathname !== '/login') {
                                window.location.href = '/login';
                            }

                            if (callbacks.onError) {
                                callbacks.onError(new Error('Authentication expired, please login again'));
                            }

                            reject(new Error('Authentication expired, please login again'));
                        });

                    return;
                }

                // Send error callback (non-401 error)
                callbacks.onChunk({
                    type: 'error',
                    error: {
                        message: errorMessage,
                        // type: 'connection_error',
                        type: errorType,
                        status: errorStatus
                    }
                });

                // Close connection
                source.close();

                // Call error callback
                if (callbacks.onError) {
                    callbacks.onError(new Error(errorMessage));
                }

                reject(new Error(errorMessage));
            });

            // Handle stage event
            source.addEventListener('stage', function (e) {
                const event = e as SSEEvent;
                const data = event.data || '';

                try {
                    const jsonData = JSON.parse(data);
                    const stageContent = jsonData.stage || '';
                    const stageStatus = jsonData.status || StageStatus.Start;
                    const messageContent = jsonData.choices?.[0]?.delta?.content || jsonData.message || '';
                    const stageDetail = jsonData.choices?.[0]?.delta?.detail;

                    // Send stage update
                    callbacks.onChunk({
                        type: 'stage',
                        stage: {
                            content: stageContent,
                            detail: stageDetail,
                            message: messageContent,
                            status: stageStatus
                        }
                    });
                } catch (error) {
                    console.warn('[SSEClient] Failed to parse stage event:', error, data);
                    // Try to use data directly
                    callbacks.onChunk({
                        type: 'stage',
                        stage: {
                            content: typeof data === 'string' ? data : 'Unknown stage',
                            message: '',
                            status: StageStatus.Start
                        }
                    });
                }
            });

            // Handle content event
            // source.addEventListener('content', function (e) {
            //     const event = e as SSEEvent;
            //     const data = event.data || '';

            //     try {
            //         const jsonData = JSON.parse(data);
            //         const content = jsonData.choices?.[0]?.delta?.content || jsonData.content || '';

            //         if (content) {
            //             callbacks.onChunk({
            //                 type: 'content',
            //                 content: content
            //             });
            //         }
            //     } catch (error) {
            //         console.warn('[SSEClient] Failed to parse content event:', error, data);
            //         // Try to use data directly
            //         callbacks.onChunk({
            //             type: 'content',
            //             content: typeof data === 'string' ? data : ''
            //         });
            //     }
            // });

            // Handle message event (default event)
            source.addEventListener('message', function (e) {
                const event = e as SSEEvent;
                const data = event.data || '';

                // If it's a [DONE] message, handle completion
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

                    // Check if there is a clear type field
                    if (jsonData.type) {
                        if (jsonData.type === 'error') {
                            // Error message
                            callbacks.onChunk({
                                type: 'error',
                                error: jsonData.error || { message: 'Unknown error' }
                            });
                            return;
                        }

                        // Other type messages are passed directly
                        if (jsonData.type === 'content' && jsonData.content) {
                            callbacks.onChunk({
                                type: 'content',
                                content: jsonData.content
                            });
                            return;
                        }
                    }

                    // Check if there is content update
                    if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                        const content = jsonData.choices[0].delta.content;
                        if (content) {
                            callbacks.onChunk({
                                type: 'content',
                                content: content
                            });
                        }
                    } else {
                        // Try to automatically infer type
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
                    console.warn('[SSEClient] Failed to parse message event:', error, data);
                    // Non-JSON message, pass original data directly
                    if (typeof data === 'string' && data.trim() !== '') {
                        callbacks.onChunk({
                            type: 'content',
                            content: data
                        });
                    }
                }
            });

            // Handle completion event
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

            // Start SSE connection
            source.stream();

        } catch (error) {
            console.error('[SSEClient] Failed to initialize SSE connection:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Send error callback
            callbacks.onChunk({
                type: 'error',
                error: {
                    message: errorMessage,
                    type: 'client_error'
                }
            });

            // Call error callback
            if (callbacks.onError) {
                callbacks.onError(error instanceof Error ? error : new Error(errorMessage));
            }

            reject(error);
        }
    });
}

/**
 * Send chat stream request
 * @param url Request URL
 * @param messages Message list
 * @param onChunk Chunk callback function
 * @param appId Application ID (optional)
 * @returns Promise<any>
 */
export async function sendChatStream(
    url: string,
    messages: Array<{ role: string, content: string }>,
    onChunk: (chunk: ChunkType) => void,
    appId?: string
): Promise<any> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseUrl}${url}`;

    const payload = {
        messages,
        stream: true,
    };

    // Append appId to URL if provided
    const requestUrl = appId ? `${fullUrl}?appId=${encodeURIComponent(appId)}` : fullUrl;

    console.log(`[SSEClient] Sending chat stream request to ${requestUrl}`);

    return sendSSERequest<any>(requestUrl, payload, {
        onChunk,
        onComplete: () => {
            // Notify completion
            onChunk({ type: 'done' });
            console.log('[SSEClient] Chat stream completed');
        },
        onError: (error) => {
            // Notify error
            onChunk({
                type: 'error',
                error: {
                    message: error.message || 'Unknown SSE error'
                }
            });
            console.error('[SSEClient] Chat stream error:', error);
        }
    });
} 