import { useRef, useState, useEffect, useCallback } from 'react';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { throttle } from '@/lib/utils';

interface UseScrollBehaviorOptions {
    // Provide an optional isStreaming parameter, so it can be used when StreamingProvider is not available
    defaultIsStreaming?: boolean;
    // custom the threshold for the bottom hidden button, default 100 pixels
    bottomThreshold?: number;
}

export function useScrollBehavior(options: UseScrollBehaviorOptions = {}) {
    const { defaultIsStreaming = false, bottomThreshold = 100 } = options;

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

    // add the last scroll timestamp record
    const lastScrollTimestampRef = useRef<number>(0);
    // add the last auto scroll timestamp record
    const lastAutoScrollTimestampRef = useRef<number>(0);
    // record the timer for the scroll end detection
    const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);
    // minimum scroll interval time (milliseconds)
    const MIN_SCROLL_INTERVAL = 500;
    // scroll end detection delay (milliseconds)
    const SCROLL_END_DELAY = 150;

    // Function to check if scrolling is at the bottom
    const checkScrollPosition = useCallback((target: HTMLDivElement) => {
        // If the scroll element does not exist, return immediately
        if (!target) return;

        // get the current timestamp
        const now = Date.now();

        // calculate the pixel distance to the bottom
        const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

        // when the distance to the bottom is less than the set threshold, it is considered that it is close to the bottom, and the button does not need to be displayed
        const shouldShowButton = distanceToBottom > bottomThreshold;

        // only update when the state needs to change
        if (isScrolledUp !== shouldShowButton) {
            setIsScrolledUp(shouldShowButton);
        }

        // Detect user initiated scroll
        const isUserInitiatedScroll = !isAutoScrollingRef.current;

        // if it is user initiated scroll, record the last scroll time
        if (isUserInitiatedScroll) {
            lastScrollTimestampRef.current = now;
        }

        isAutoScrollingRef.current = false;

        // Only mark as manual scrolling when the user scrolls up and it is user initiated
        // use a more reasonable judgment: the distance to the bottom is greater than the threshold and it is user initiated scroll
        if (shouldShowButton && isUserInitiatedScroll) {
            setIsManualScrolling(true);
        } else if (!shouldShowButton) {
            // when it is close to the bottom, reset the manual scrolling flag
            setIsManualScrolling(false);
        }
    }, [isScrolledUp, bottomThreshold]);

    // Reference to mark the auto scrolling state
    const isAutoScrollingRef = useRef(false);

    // Scroll to bottom
    const scrollToBottom = () => {
        // get the current timestamp, if the interval with the last auto scroll is too short, skip
        const now = Date.now();
        if (now - lastAutoScrollTimestampRef.current < MIN_SCROLL_INTERVAL) {
            return;
        }

        // if the user has recently scrolled, also skip the auto scroll
        if (now - lastScrollTimestampRef.current < MIN_SCROLL_INTERVAL) {
            return;
        }

        isAutoScrollingRef.current = true;
        lastAutoScrollTimestampRef.current = now;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsScrolledUp(false);
        setIsManualScrolling(false);
    };

    // detect the scroll end and check the final position
    const detectScrollEnd = useCallback((target: HTMLDivElement) => {
        // clear the previous timer
        if (scrollEndTimerRef.current) {
            clearTimeout(scrollEndTimerRef.current);
        }

        // set a new timer, check the position after the scroll stops
        scrollEndTimerRef.current = setTimeout(() => {
            checkScrollPosition(target);
            scrollEndTimerRef.current = null;
        }, SCROLL_END_DELAY);
    }, [checkScrollPosition]);

    // Use throttle to optimize scrolling with trailing call to ensure final position is checked
    const throttledCheck = useCallback(
        throttle((target: HTMLDivElement) => checkScrollPosition(target), 200, { trailing: true }),
        [checkScrollPosition]
    );

    // Handle scroll events
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement;

        // use the throttle function to check the scroll position
        throttledCheck(target);

        // detect the scroll end
        detectScrollEnd(target);

        return true; // Ensure the event continues to propagate
    }, [throttledCheck, detectScrollEnd]);

    // Function to manually check the scroll position, can be called when needed
    const checkScrollState = useCallback(() => {
        if (scrollAreaRef.current) {
            checkScrollPosition(scrollAreaRef.current);
        }
    }, [checkScrollPosition]);

    // clean up the timer when the component unmounts
    useEffect(() => {
        return () => {
            if (scrollEndTimerRef.current) {
                clearTimeout(scrollEndTimerRef.current);
                scrollEndTimerRef.current = null;
            }
        };
    }, []);

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

        // get the current timestamp
        const now = Date.now();

        // if the user has recently scrolled, skip the auto scroll
        if (now - lastScrollTimestampRef.current < MIN_SCROLL_INTERVAL) {
            return;
        }

        // Auto scroll when streaming starts or user did not manually scroll
        if (isStreamingStart || (!isManualScrolling && !isStreaming)) {
            // Use setTimeout to ensure the DOM is updated
            setTimeout(() => {
                const shouldSmoothScroll = !isStreaming;

                // record the auto scroll time
                lastAutoScrollTimestampRef.current = Date.now();
                isAutoScrollingRef.current = true;

                messagesEndRef.current?.scrollIntoView({
                    behavior: shouldSmoothScroll ? 'smooth' : 'auto',
                    block: 'end'
                });

                // after the auto scroll, ensure the state is updated
                setIsScrolledUp(false);

                // after the auto scroll, check the position again, ensure the button state is correct
                setTimeout(() => {
                    if (scrollAreaRef.current) {
                        checkScrollPosition(scrollAreaRef.current);
                    }
                }, shouldSmoothScroll ? 300 : 50);
            }, 100);
        }
    }, [isStreaming, isManualScrolling, messagesEndRef, checkScrollPosition]);

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