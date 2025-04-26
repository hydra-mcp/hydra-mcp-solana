import { useEffect, useRef } from 'react';

interface MessageSoundProps {
    play: boolean;
    soundType?: 'sent' | 'received';
}

export function MessageSound({ play, soundType = 'sent' }: MessageSoundProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element if not exists
        if (!audioRef.current) {
            audioRef.current = new Audio();

            // Set the sound file based on type
            if (soundType === 'sent') {
                audioRef.current.src = '/sounds/message-sent.mp3';
            } else {
                audioRef.current.src = '/sounds/message-received.mp3';
            }

            // Set volume lower to not be too intrusive
            audioRef.current.volume = 0.3;
        }

        // Play the sound when the play prop changes to true
        if (play && audioRef.current) {
            // Reset the audio to start from beginning if it was playing
            audioRef.current.currentTime = 0;

            // Play the sound
            audioRef.current.play().catch(error => {
                // Handle autoplay restrictions
                console.warn('Audio playback failed:', error);
            });
        }

        // Cleanup function
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [play, soundType]);

    // This component doesn't render anything visible
    return null;
} 