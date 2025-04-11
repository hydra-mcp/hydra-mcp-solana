import { useRef, useState, useEffect } from 'react';
import { useStreaming } from '@/lib/streaming/StreamingContext';

interface UseScrollBehaviorOptions {
    // 提供一个可选的isStreaming参数，以便在StreamingProvider不可用时使用
    defaultIsStreaming?: boolean;
}

export function useScrollBehavior(options: UseScrollBehaviorOptions = {}) {
    const { defaultIsStreaming = false } = options;

    // 尝试从流式上下文中获取状态，如果不可用则使用默认值
    const [localIsStreaming, setLocalIsStreaming] = useState(defaultIsStreaming);

    // 安全地使用useStreaming，如果不在Provider中则使用默认值
    let streamingContext;
    try {
        streamingContext = useStreaming();
    } catch (error) {
        // 如果useStreaming抛出错误，我们将使用本地状态
        streamingContext = { isStreaming: localIsStreaming };
    }

    const { isStreaming } = streamingContext;

    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsScrolledUp(false);
    };

    // 处理滚动事件
    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement;
        const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        setIsScrolledUp(!isAtBottom);

        // 只有当用户向上滚动时才标记为手动滚动
        if (!isAtBottom) {
            setIsManualScrolling(true);

            // 延迟后重置手动滚动标志
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

    // 自动滚动效果
    useEffect(() => {
        // 如果用户正在手动滚动，不进行自动滚动
        if (!isManualScrolling) {
            const shouldSmoothScroll = !isStreaming;
            messagesEndRef.current?.scrollIntoView({
                behavior: shouldSmoothScroll ? 'smooth' : 'auto'
            });
        }
    }, [isStreaming, isManualScrolling]);

    // 清理定时器
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