import { useRef, useState, useEffect, useCallback } from 'react';
import { useStreaming } from '@/lib/streaming/StreamingContext';
import { throttle } from '@/lib/utils';

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

    // 检查是否滚动到底部的函数
    const checkScrollPosition = useCallback((target: HTMLDivElement) => {
        // 如果滚动元素不存在，直接返回
        if (!target) return;

        // 当滚动到底部的剩余距离小于50px时认为已滚动到底部
        const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;

        // 只在状态需要改变时更新
        if (isScrolledUp === isAtBottom) {
            setIsScrolledUp(!isAtBottom);
        }

        // 检测用户主动滚动
        const isUserInitiatedScroll = !isAutoScrollingRef.current;
        isAutoScrollingRef.current = false;

        // 只有当用户向上滚动时才标记为手动滚动，并且是用户主动滚动
        if (!isAtBottom && isUserInitiatedScroll) {
            setIsManualScrolling(true);

            // 手动滚动标志不再自动重置，除非明确调用scrollToBottom
            // 或者发送新消息时
        } else if (isAtBottom) {
            // 只有当滚动到底部时，才考虑重置手动滚动标志
            setIsManualScrolling(false);
        }
    }, [isScrolledUp]);

    // 标记自动滚动状态的引用
    const isAutoScrollingRef = useRef(false);

    // 滚动到底部
    const scrollToBottom = () => {
        isAutoScrollingRef.current = true;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setIsScrolledUp(false);
        setIsManualScrolling(false);
    };

    // 使用throttle优化滚动处理，减少到150ms
    const throttledCheck = useCallback(
        throttle((target: HTMLDivElement) => checkScrollPosition(target), 150),
        [checkScrollPosition]
    );

    // 处理滚动事件
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement;
        // 优先进行原始滚动事件，然后再异步检查滚动位置
        setTimeout(() => throttledCheck(target), 0);
        return true; // 确保事件继续传播
    }, [throttledCheck]);

    // 手动检查滚动位置的函数，可在需要时调用
    const checkScrollState = useCallback(() => {
        if (scrollAreaRef.current) {
            checkScrollPosition(scrollAreaRef.current);
        }
    }, [checkScrollPosition]);

    // 初始加载和内容变化时检查滚动状态
    useEffect(() => {
        // 使用requestAnimationFrame确保DOM已完全渲染
        const timerId = requestAnimationFrame(() => {
            checkScrollState();
        });

        return () => cancelAnimationFrame(timerId);
    }, [checkScrollState]);

    // 跟踪上一次isStreaming状态的ref
    const prevIsStreamingRef = useRef(isStreaming);

    // 自动滚动效果
    useEffect(() => {
        // 检测流式传输状态变化
        const isStreamingStart = isStreaming && !prevIsStreamingRef.current;
        prevIsStreamingRef.current = isStreaming;

        // 在流式传输开始或用户未手动滚动时自动滚动
        if (isStreamingStart || (!isManualScrolling && !isStreaming)) {
            // 使用setTimeout确保DOM已更新
            setTimeout(() => {
                const shouldSmoothScroll = !isStreaming;
                messagesEndRef.current?.scrollIntoView({
                    behavior: shouldSmoothScroll ? 'smooth' : 'auto',
                    block: 'end'
                });
            }, 100);
        }
    }, [isStreaming, isManualScrolling, messagesEndRef]);

    // 清理定时器
    useEffect(() => {
        return () => {
            // 清理逻辑
        };
    }, []);

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