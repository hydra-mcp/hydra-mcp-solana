import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ImageIcon, ExternalLink } from 'lucide-react';

export default function MarkdownImage({ src, alt, title }: React.ImgHTMLAttributes<HTMLImageElement>) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [debouncedSrc, setDebouncedSrc] = useState<string | undefined>(undefined);
    const imageRef = useRef<HTMLImageElement>(null);
    const srcTimerRef = useRef<number | null>(null);

    // Debounce src changes to avoid loading incomplete URLs during streaming
    useEffect(() => {
        if (srcTimerRef.current) {
            window.clearTimeout(srcTimerRef.current);
        }

        // Reset error state when src changes
        if (src !== debouncedSrc) {
            setHasError(false);
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

    // Only show error UI if we have a debounced source that failed
    if (hasError && debouncedSrc) {
        return (
            <div className="flex items-center justify-center p-4 my-2 bg-muted/30 rounded-md border border-muted">
                <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm">{alt || 'Image failed to load'}</p>
                    <a
                        href={debouncedSrc}
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
            {debouncedSrc && (
                <img
                    ref={imageRef}
                    src={debouncedSrc}
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
            )}
        </div>
    );
};