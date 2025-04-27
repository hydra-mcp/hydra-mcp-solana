import React, { useState, useRef, useEffect, useDeferredValue } from 'react';
import { cn } from '@/lib/utils';
import { StreamingMessage } from '@/lib/streaming/types';
import { Loader2, AlertCircle, AlertTriangle, Lock, Play, Pause, Volume2, ExternalLink, ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/ui/code-block';

// Image Component for Markdown - Wrapped with React.memo
const MarkdownImageComponent = ({ src, alt, title }: { src: string, alt?: string, title?: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    const handleLoad = () => {
        // Get natural dimensions when loaded to maintain aspect ratio
        if (imageRef.current) {
            setImageDimensions({
                width: imageRef.current.naturalWidth,
                height: imageRef.current.naturalHeight
            });
        }
        // Use requestAnimationFrame to delay showing the image until next paint
        // This reduces layout shifts and jittering
        requestAnimationFrame(() => {
            setIsLoaded(true);
        });
    };

    const handleError = () => setHasError(true);

    if (hasError) {
        return (
            <div className="flex items-center justify-center p-4 my-2 bg-muted/30 rounded-md border border-muted">
                <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm">{alt || 'Image failed to load'}</p>
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center mt-2 text-primary hover:underline"
                    >
                        View image <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                </div>
            </div>
        );
    }

    // Calculate aspect ratio placeholder based on standard 16:9 or use a fixed height
    const placeholderHeight = 250; // Default height when loading

    return (
        <div
            className="my-4 relative will-change-contents will-change-transform"
            // Reserve space with a fixed height to prevent layout shifts
            style={{
                minHeight: !isLoaded ? `${placeholderHeight}px` : 'auto',
                // Only set a specific height once loaded if we have dimensions
                height: isLoaded && imageDimensions.height > 0 ? 'auto' : undefined,
                // Add content-visibility to improve rendering performance
                contentVisibility: 'auto',
                containIntrinsicSize: '0 250px'
            }}
        >
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-md" style={{ height: `${placeholderHeight}px` }}>
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
            )}
            <img
                ref={imageRef}
                src={src}
                alt={alt || 'Image'}
                title={title}
                className={cn(
                    "max-w-full h-auto rounded-md border border-muted/30 transform-gpu",
                    !isLoaded ? "opacity-0" : "opacity-100 transition-opacity duration-300"
                )}
                style={{
                    // Apply hardware acceleration with transform to reduce jank
                    transform: "translate3d(0, 0, 0)",
                    // Make invisible but keep space reserved when loading
                    visibility: isLoaded ? 'visible' : 'hidden',
                }}
                onLoad={handleLoad}
                onError={handleError}
                // Add loading="lazy" for browser-level lazy loading
                loading="lazy"
                // Add decoding="async" to decode images off the main thread
                decoding="async"
            />
        </div>
    );
};
const MarkdownImage = React.memo(MarkdownImageComponent);

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

interface StreamingMessageContentProps {
    message: StreamingMessage;
    className?: string;
}

// Original component function
function StreamingMessageContentComponent({ message, className }: StreamingMessageContentProps) {
    // Add ref for content container to handle scroll anchoring
    const contentRef = useRef<HTMLDivElement>(null);

    // Defer the content updates passed to ReactMarkdown
    const deferredContent = useDeferredValue(message.content);
    const isStale = message.content !== deferredContent; // Check if the UI is lagging behind

    // Use useEffect to apply scroll anchoring
    useEffect(() => {
        // When streaming content updates, maintain scroll position relative to content
        if (message.status === 'streaming' && contentRef.current) {
            // Get current scroll position
            const container = contentRef.current.closest('.scroll-area');
            if (container && container.scrollHeight > container.clientHeight) {
                // If we're scrolled near the bottom, keep scrolling as content grows
                const isNearBottom = container.scrollTop + container.clientHeight >=
                    container.scrollHeight - 200;

                if (isNearBottom) {
                    requestAnimationFrame(() => {
                        container.scrollTop = container.scrollHeight;
                    });
                }
            }
        }
    }, [message.content, message.status]);

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
        <div
            ref={contentRef}
            className={cn(
                'prose dark:prose-invert will-change-contents',
                // Add a subtle style when content is deferred (optional)
                isStale && 'opacity-80 transition-opacity duration-300',
                className
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    img({ node, src, alt, title }) {
                        if (!src) return null;
                        // Use the memoized MarkdownImage component
                        return <MarkdownImage src={src} alt={alt} title={title} />;
                    },
                    a(props) {
                        const { node, href, children, ...rest } = props;
                        if (!href) return <span>{children}</span>;

                        // Check if this is an image link by file extension
                        const imageFileRegex = /\.(jpe?g|png|gif|webp|bmp|svg|avif|tiff?)(?=[?#]|$)/i;

                        // Check for image service domains or paths
                        const isImageService = /(\/img\/|\/image\/|\/images\/|image_inference_output|\/photos\/)/.test(href);

                        // Check for query parameters that suggest an image
                        const hasImageParams = /\?.*(?:img|image|photo|pic|picture|file)=/.test(href);

                        if (href && (imageFileRegex.test(href) || isImageService || hasImageParams)) {
                            // Extract potential alt text from children if it's just text
                            const potentialAlt = typeof children === 'string' ? children : undefined;
                            return <MarkdownImage src={href} alt={potentialAlt} />;
                        }

                        // Audio link detection remains
                        const audioFileRegex = /\.(mp3|wav|ogg|m4a|flac)(?=[?#]|$)/i;
                        const isAliyunAudio = href.includes('aliyuncs.com') && href.includes('audio');
                        if (href && (audioFileRegex.test(href) || isAliyunAudio)) {
                            return (<span className="inline-block align-middle"><InlineAudioPlayer src={href} label={children} /></span>);
                        }

                        // Regular link
                        return <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
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
                {deferredContent}
            </ReactMarkdown>

            {/* Streaming status indicator */}
            {message.status === 'streaming' && (
                <div className="w-2 h-4 bg-primary animate-blink inline-block ml-0.5" />
            )}
        </div>
    );
}

// Export the memoized component
export const StreamingMessageContent = React.memo(StreamingMessageContentComponent); 