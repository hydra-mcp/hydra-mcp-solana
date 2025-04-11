import { useRef, useState, useEffect } from 'react';

interface UseScrollBehaviorOptions {
    isStreaming?: boolean;
}

export function useScrollBehavior(options: UseScrollBehaviorOptions = {}) {
    const { isStreaming = false } = options;

    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsScrolledUp(false);
    };

    // Handle scroll event
    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement;
        const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setIsScrolledUp(!isAtBottom);

        // Mark as manual scrolling only when the user scrolls up
        if (!isAtBottom) {
            setIsManualScrolling(true);

            // Reset manual scrolling after a delay
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                setIsManualScrolling(false);
            }, 1000);
        } else {
            setIsManualScrolling(false);
        }
    };

    // Auto scroll effect
    useEffect(() => {
        // If the user is manually scrolling, do not auto scroll
        if (!isManualScrolling) {
            const shouldSmoothScroll = !isStreaming;
            messagesEndRef.current?.scrollIntoView({
                behavior: shouldSmoothScroll ? 'smooth' : 'auto'
            });
        }
    }, [isStreaming, isManualScrolling]);

    // Clean up timeout
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return {
        isScrolledUp,
        isManualScrolling,
        messagesEndRef,
        scrollAreaRef,
        scrollToBottom,
        handleScroll
    };
} 