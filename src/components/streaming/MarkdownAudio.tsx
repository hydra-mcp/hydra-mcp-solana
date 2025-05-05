import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Pause, Play } from 'lucide-react';

export default function MarkdownAudio({ src, label }: { src: string, label?: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [debouncedSrc, setDebouncedSrc] = useState<string | undefined>(undefined);
    const [hasError, setHasError] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const srcTimerRef = useRef<number | null>(null);

    // Debounce src changes to avoid loading incomplete URLs during streaming
    useEffect(() => {
        if (srcTimerRef.current) {
            window.clearTimeout(srcTimerRef.current);
        }

        // Reset state when src changes
        if (src !== debouncedSrc) {
            setHasError(false);
            if (isPlaying) {
                setIsPlaying(false);
            }
        }

        // Wait for src to stabilize before trying to load
        srcTimerRef.current = window.setTimeout(() => {
            setDebouncedSrc(src);
        }, 300); // 300ms debounce time

        return () => {
            if (srcTimerRef.current) {
                window.clearTimeout(srcTimerRef.current);
            }
        };
    }, [src]);

    const togglePlayPause = () => {
        if (!audioRef.current || !debouncedSrc) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Try to play and handle failures
            audioRef.current.play().catch(error => {
                console.error("Error playing audio:", error);
                setHasError(true);
            });

            if (!isExpanded) {
                setIsExpanded(true);
            }
        }
        setIsPlaying(!isPlaying);
    };

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const onEnded = () => {
        setIsPlaying(false);
    };

    const onError = () => {
        setHasError(true);
        setIsPlaying(false);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Don't render anything if we don't have a stable URL yet
    if (!debouncedSrc) {
        return null;
    }

    // Handle error state
    if (hasError) {
        return <span className="text-red-500 text-sm">Audio failed to load</span>;
    }

    const progress = duration ? (currentTime / duration) * 100 : 0;
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const viewBoxSize = (radius + 2) * 2;

    return (
        <span className="inline-flex items-center gap-2 transition-all duration-300 align-middle -mt-0.5">
            <span className="relative inline-flex items-center justify-center align-middle">
                <button
                    onClick={togglePlayPause}
                    className={cn(
                        "relative flex items-center justify-center rounded-full transition-all overflow-hidden",
                        isExpanded ? "bg-primary/10 w-8 h-8" : "bg-primary/5 w-7 h-7 hover:bg-primary/10"
                    )}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    style={{ transform: "translateY(1px)" }}
                >
                    {isPlaying && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
                            <circle
                                cx={radius + 2}
                                cy={radius + 2}
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-muted-foreground/30"
                            />
                            <circle
                                cx={radius + 2}
                                cy={radius + 2}
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className="text-primary"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </svg>
                    )}

                    <span className={cn(
                        "relative z-10 transition-transform duration-300 flex items-center justify-center",
                        isPlaying ? "scale-90" : "scale-100"
                    )}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </span>
                </button>
            </span>

            {isExpanded && (
                <>
                    <span className="text-xs text-muted-foreground inline-flex items-center">
                        {formatTime(currentTime)}
                    </span>

                    {label && (
                        <span className="text-sm text-muted-foreground/80 max-w-[120px] truncate inline-flex items-center">
                            {label}
                        </span>
                    )}
                </>
            )}

            <audio
                ref={audioRef}
                src={debouncedSrc}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
                onError={onError}
                className="hidden"
            />
        </span>
    );
};