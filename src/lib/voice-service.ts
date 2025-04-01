import { apiRequestRaw } from '@/lib/api';
import { VoiceConfig } from './voice-config';

// Define the return type interface
interface VoiceResponse {
    audioBlob: Blob;
    responseText: string;
    audioUrl: string;
}

export class VoiceService {
    private audioCache: Map<string, VoiceResponse>;
    private isIOS: boolean;

    constructor() {
        this.audioCache = new Map();
        // Check if the current device is iOS
        this.isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    /**
     * Get LLM voice response
     * @param userInput User input text
     * @param options Voice configuration options
     * @returns Audio URL and text response
     */
    async getLLMVoiceResponse(userInput: string, options?: Partial<VoiceConfig>): Promise<VoiceResponse> {
        const defaultOptions = {
            voice_id: 'alloy',
            speed: 1.0,
            volume: 1.0,
            format: this.getBestAudioFormat(), // Use adaptive format
            model_role: 'default'
        };

        const requestOptions = { ...defaultOptions, ...options };

        // Calculate cache key
        const cacheKey = JSON.stringify({ userInput, ...requestOptions });

        // Check cache
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey) as VoiceResponse;
        }

        // Call voice synthesis interface
        const response = await apiRequestRaw('/voice/llm-tts', {
            method: 'POST',
            body: JSON.stringify({
                user_input: userInput,
                ...requestOptions
            }),
            // Add cache control header to avoid iOS cache issues
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status} - ${await response.text()}`);
        }

        // Extract LLM text response
        const llmResponseBase64 = response.headers.get('X-LLM-Response-Text');
        let responseText = '';
        if (llmResponseBase64) {
            const binaryText = atob(llmResponseBase64);
            // Create Uint8Array to store binary data
            const bytes = new Uint8Array(binaryText.length);
            for (let i = 0; i < binaryText.length; i++) {
                bytes[i] = binaryText.charCodeAt(i);
            }
            // Use TextDecoder to correctly decode UTF-8 text
            responseText = new TextDecoder('utf-8').decode(bytes);
        } else {
            responseText = 'No text response obtained';
        }

        // Get audio data
        const audioBlob = await response.blob();

        // Special handling for iOS WebKit audio issues
        const audioUrl = this.isIOS
            ? this.createIOSCompatibleAudioUrl(audioBlob, requestOptions.format)
            : URL.createObjectURL(audioBlob);

        // Create result object
        const result: VoiceResponse = {
            audioBlob,
            responseText,
            audioUrl
        };

        // Cache results (limit cache size)
        if (this.audioCache.size > 20) {
            // Delete the earliest added item
            const firstKey = this.audioCache.keys().next().value;
            const oldItem = this.audioCache.get(firstKey);
            if (oldItem && oldItem.audioUrl) {
                URL.revokeObjectURL(oldItem.audioUrl.split('#')[0]); // Remove query parameters
            }
            this.audioCache.delete(firstKey);
        }

        this.audioCache.set(cacheKey, result);

        return result;
    }

    /**
     * Record call status
     * @param status Call status
     * @param options Optional voice configuration
     * @returns Audio URL and text response
     */
    async reportCallStatus(
        status: 'accepted' | 'rejected' | 'ended',
        options?: Partial<VoiceConfig>
    ): Promise<VoiceResponse> {
        try {
            const defaultOptions = {
                voice_id: 'alloy',
                speed: 1.0,
                volume: 1.0,
                format: this.getBestAudioFormat(), // Use adaptive format
                model_role: 'default'
            };

            const requestOptions = { ...defaultOptions, ...options };

            const response = await apiRequestRaw('/voice/call-status', {
                method: 'POST',
                body: JSON.stringify({
                    status,
                    ...requestOptions
                }),
                // Add cache control header to avoid iOS cache issues
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status} - ${await response.text()}`);
            }

            // Extract text response
            const responseTextBase64 = response.headers.get('X-LLM-Response-Text');
            let responseText = '';
            if (responseTextBase64) {
                const binaryText = atob(responseTextBase64);
                // Create Uint8Array to store binary data
                const bytes = new Uint8Array(binaryText.length);
                for (let i = 0; i < binaryText.length; i++) {
                    bytes[i] = binaryText.charCodeAt(i);
                }
                // Use TextDecoder to correctly decode UTF-8 text
                responseText = new TextDecoder('utf-8').decode(bytes);
            } else {
                responseText = status === 'accepted' ? 'Call connected' :
                    status === 'ended' ? 'Call ended' : 'Call status updated';
            }

            // Get audio data
            const audioBlob = await response.blob();

            // Special handling for iOS WebKit audio issues
            const audioUrl = this.isIOS
                ? this.createIOSCompatibleAudioUrl(audioBlob, requestOptions.format)
                : URL.createObjectURL(audioBlob);

            // Create result object
            const result: VoiceResponse = {
                audioBlob,
                responseText,
                audioUrl
            };

            return result;
        } catch (error) {
            console.error('Error reporting call status:', error);
            throw error;
        }
    }

    /**
     * Create a compatible audio URL for iOS
     * Solve some audio loading issues in iOS
     */
    private createIOSCompatibleAudioUrl(blob: Blob, format: string): string {
        // Create a URL for iOS devices with special handling to ensure the correct audio format
        const url = URL.createObjectURL(blob);

        // Add query parameters to the URL to force iOS not to cache and correctly handle the audio type
        return `${url}#format=${format}&t=${Date.now()}`;
    }

    /**
     * Clean up cached audio resources
     */
    cleanup() {
        for (const item of this.audioCache.values()) {
            if (item.audioUrl) {
                URL.revokeObjectURL(item.audioUrl.split('#')[0]); // Remove query parameters
            }
        }
        this.audioCache.clear();
    }

    /**
     * Get the best audio format (browser compatibility)
     */
    getBestAudioFormat(): 'mp3' | 'wav' | 'ogg_opus' {
        // Detect if it is an iOS device
        if (this.isIOS) {
            return 'mp3'; // iOS best supports MP3 format
        }

        // Detect browser support for other devices
        const audio = document.createElement('audio');

        if (audio.canPlayType('audio/mpeg')) {
            return 'mp3';
        } else if (audio.canPlayType('audio/ogg; codecs="opus"')) {
            return 'ogg_opus';
        } else {
            return 'wav'; // Fallback format
        }
    }

    /**
     * Pre-initialize audio on mobile devices (solve mobile auto-play restrictions)
     * @param audioElement Audio element
     */
    initAudioForMobile(audioElement: HTMLAudioElement): Promise<void> {
        return new Promise((resolve) => {
            // iOS special handling
            const unlockAudio = () => {
                audioElement.muted = true;
                audioElement.play().then(() => {
                    audioElement.muted = false;
                    audioElement.pause();
                    audioElement.currentTime = 0;
                    document.removeEventListener('touchend', unlockAudio);
                    document.removeEventListener('touchstart', unlockAudio);
                    document.removeEventListener('click', unlockAudio);
                    resolve();
                }).catch((err) => {
                    console.error("Audio initialization failed:", err);
                    // Retry on next event
                });
            };

            // iOS requires touch events
            if (this.isIOS) {
                document.addEventListener('touchstart', unlockAudio, { once: true });
                document.addEventListener('touchend', unlockAudio, { once: true });
            }

            // Compatibility handling, add click event
            document.addEventListener('click', unlockAudio, { once: true });
        });
    }
} 