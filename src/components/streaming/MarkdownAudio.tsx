import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Pause, Play } from 'lucide-react';

export default function MarkdownAudio({ src, label }: { src: string, label?: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
                if (!isExpanded) {
                    setIsExpanded(true);
                }
            }
            setIsPlaying(!isPlaying);
        }
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
        // setCurrentTime(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    // Calculate the radius and circumference for the circular progress
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // SVG viewBox size
    const viewBoxSize = (radius + 2) * 2;

    return (
        <span className="inline-flex items-center gap-2 transition-all duration-300 align-middle -mt-0.5">
            <span className="relative inline-flex items-center justify-center align-middle">
                {/* Circular button with progress ring */}
                <button
                    onClick={togglePlayPause}
                    className={cn(
                        "relative flex items-center justify-center rounded-full transition-all overflow-hidden",
                        isExpanded ? "bg-primary/10 w-8 h-8" : "bg-primary/5 w-7 h-7 hover:bg-primary/10"
                    )}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    style={{ transform: "translateY(1px)" }}
                >
                    {/* Progress circle */}
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

                    {/* Play/Pause icon */}
                    <span className={cn(
                        "relative z-10 transition-transform duration-300 flex items-center justify-center",
                        isPlaying ? "scale-90" : "scale-100"
                    )}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </span>
                </button>
            </span>

            {/* Time and label */}
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

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={src}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
                className="hidden"
            />
        </span>
    );
};