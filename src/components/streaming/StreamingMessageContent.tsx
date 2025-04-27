import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { StreamingMessage } from '@/lib/streaming/types';
import { Loader2, AlertCircle, AlertTriangle, Lock, Play, Pause, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/ui/code-block';

// Custom Audio Player Component
const InlineAudioPlayer = ({ src, label }: { src: string, label?: React.ReactNode }) => {
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
        <span className="inline-flex items-center gap-2 transition-all duration-300">
            <span className="relative inline-flex items-center justify-center">
                {/* Circular button with progress ring */}
                <button
                    onClick={togglePlayPause}
                    className={cn(
                        "relative flex items-center justify-center rounded-full transition-all overflow-hidden",
                        isExpanded ? "bg-primary/10 w-8 h-8" : "bg-primary/5 w-7 h-7 hover:bg-primary/10"
                    )}
                    aria-label={isPlaying ? "Pause" : "Play"}
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
                        "relative z-10 transition-transform duration-300",
                        isPlaying ? "scale-90" : "scale-100"
                    )}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </span>
                </button>
            </span>

            {/* Time and label */}
            {isExpanded && (
                <>
                    <span className="text-xs text-muted-foreground">
                        {formatTime(currentTime)}
                    </span>

                    {label && (
                        <span className="text-sm text-muted-foreground/80 max-w-[120px] truncate">
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

interface StreamingMessageContentProps {
    message: StreamingMessage;
    className?: string;
}

export function StreamingMessageContent({ message, className }: StreamingMessageContentProps) {
    // Handle empty content
    if (!message.content && message.status === 'pending') {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
        );
    }

    // Handle error status
    if (message.status === 'error') {
        const errorType = message.metadata?.errorType || 'unknown';
        const errorStatus = message.metadata?.errorStatus;

        // Handle different types of errors
        if (errorType === 'auth_error' || errorStatus === 401) {
            return (
                <div className="flex items-start space-x-2 text-red-500">
                    <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">{message.content || 'Authentication expired, please login again'}</p>
                        <p className="text-sm text-red-400 mt-1">Your session has expired, please refresh the page or login again to continue using.</p>
                    </div>
                </div>
            );
        }

        // Handle connection errors
        if (errorType === 'connection_error') {
            return (
                <div className="flex items-start space-x-2 text-red-500">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">{message.content || 'Connection error'}</p>
                        <p className="text-sm text-red-400 mt-1">
                            {/* {errorStatus ? `Server returned error (${errorStatus})` : 'Cannot connect to the server, please check your network connection or try again later.'} */}
                        </p>
                    </div>
                </div>
            );
        }

        // Generic error
        return (
            <div className="flex items-start space-x-2 text-red-500">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                    <p>{message.content || 'Error occurred while generating response.'}</p>
                    {/* {errorStatus && <p className="text-sm text-red-400 mt-1">Error code: {errorStatus}</p>} */}
                </div>
            </div>
        );
    }

    // Handle streaming text (possibly Markdown)
    return (
        <div className={cn('prose dark:prose-invert', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a(props) {
                        const { href, children } = props;

                        // Create a regular expression to detect common audio file extensions in the URL path
                        const audioFileRegex = /\.(mp3|wav|ogg|m4a|flac)(?=[?#]|$)/i;

                        if (href && audioFileRegex.test(href)) {
                            return <InlineAudioPlayer src={href} label={children} />;
                        }

                        return <a href={href} {...props}>{children}</a>;
                    },
                    code(props: any) {
                        const { node, inline, className, children, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const content = String(children).replace(/\n$/, '');

                        if (inline) {
                            return (
                                <code
                                    className={cn(
                                        "px-1 py-0.5 bg-muted/30 text-primary-foreground font-mono text-[0.9em] rounded",
                                        className
                                    )}
                                    {...rest}
                                >
                                    {children}
                                </code>
                            );
                        }

                        const language = match ? match[1] : '';

                        return (
                            <CodeBlock
                                content={content}
                                language={language}
                                fileName=""
                                showLineNumbers
                                isSimple={content.split('\n').length === 1 && content.length < 30}
                            />
                        );
                    },
                    pre(props: any) {
                        const { children } = props;
                        return <div className="not-prose my-2 rounded-md overflow-hidden">{children}</div>;
                    }
                }}
            >
                {message.content}
            </ReactMarkdown>

            {/* Streaming status indicator */}
            {message.status === 'streaming' && (
                <div className="w-2 h-4 bg-primary animate-blink inline-block ml-0.5" />
            )}
        </div>
    );
} 