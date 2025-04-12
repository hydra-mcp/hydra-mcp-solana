import { useRef, useState, useEffect, useCallback } from 'react';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { throttle } from '@/lib/utils';

interface UseScrollBehaviorOptions {
    // Provide an optional isStreaming parameter, so it can be used when StreamingProvider is not available
    defaultIsStreaming?: boolean;
}

export function useScrollBehavior(options: UseScrollBehaviorOptions = {}) {
    const { defaultIsStreaming = false } = options;

    // Try to get the status from the streaming context, if not available use the default value
    const [localIsStreaming, setLocalIsStreaming] = useState(defaultIsStreaming);

    // Safely use useStreaming, if not in Provider use the default value
    let streamingContext;
    try {
        streamingContext = useStreaming();
    } catch (error) {
        // If useStreaming throws an error, we will use the local state
        streamingContext = { isStreaming: localIsStreaming };
    }

    const { isStreaming } = streamingContext;

    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Function to check if scrolling is at the bottom
    const checkScrollPosition = useCallback((target: HTMLDivElement) => {
        // If the scroll element does not exist, return immediately
        if (!target) return;

        // When the remaining distance to the bottom is less than 50px, consider it scrolled to the bottom
        const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;

        // Only update the state when it needs to change
        if (isScrolledUp === isAtBottom) {
            setIsScrolledUp(!isAtBottom);
        }

        // Detect user initiated scroll
        const isUserInitiatedScroll = !isAutoScrollingRef.current;
        isAutoScrollingRef.current = false;

        // Only mark as manual scrolling when the user scrolls up and it is user initiated
        if (!isAtBottom && isUserInitiatedScroll) {
            setIsManualScrolling(true);

            // Manual scrolling flag is not reset automatically unless explicitly called scrollToBottom
            // or when a new message is sent
        } else if (isAtBottom) {
            // Only consider resetting the manual scrolling flag when scrolling to the bottom
            setIsManualScrolling(false);
        }
    }, [isScrolledUp]);

    // Reference to mark the auto scrolling state
    const isAutoScrollingRef = useRef(false);

    // Scroll to bottom
    const scrollToBottom = () => {
        isAutoScrollingRef.current = true;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsScrolledUp(false);
        setIsManualScrolling(false);
    };

    // Use throttle to optimize scrolling, reduce to 150ms
    const throttledCheck = useCallback(
        throttle((target: HTMLDivElement) => checkScrollPosition(target), 150),
        [checkScrollPosition]
    );

    // Handle scroll events
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement;
        // Prioritize the original scroll event, then check the scroll position asynchronously
        setTimeout(() => throttledCheck(target), 0);
        return true; // Ensure the event continues to propagate
    }, [throttledCheck]);

    // Function to manually check the scroll position, can be called when needed
    const checkScrollState = useCallback(() => {
        if (scrollAreaRef.current) {
            checkScrollPosition(scrollAreaRef.current);
        }
    }, [checkScrollPosition]);

    // Check scroll state when initially loaded and when content changes
    useEffect(() => {
        // Use requestAnimationFrame to ensure the DOM is fully rendered
        const timerId = requestAnimationFrame(() => {
            checkScrollState();
        });

        return () => cancelAnimationFrame(timerId);
    }, [checkScrollState]);

    // Reference to track the previous isStreaming state
    const prevIsStreamingRef = useRef(isStreaming);

    // Auto scroll effect
    useEffect(() => {
        // Detect streaming status changes
        const isStreamingStart = isStreaming && !prevIsStreamingRef.current;
        prevIsStreamingRef.current = isStreaming;

        // Auto scroll when streaming starts or user did not manually scroll
        if (isStreamingStart || (!isManualScrolling && !isStreaming)) {
            // Use setTimeout to ensure the DOM is updated
            setTimeout(() => {
                const shouldSmoothScroll = !isStreaming;
                messagesEndRef.current?.scrollIntoView({
                    behavior: shouldSmoothScroll ? 'smooth' : 'auto',
                    block: 'end'
                });
            }, 100);
        }
    }, [isStreaming, isManualScrolling, messagesEndRef]);

    return {
        isScrolledUp,
        isManualScrolling,
        messagesEndRef,
        scrollAreaRef,
        scrollToBottom,
        handleScroll,
        checkScrollState
    };
} 