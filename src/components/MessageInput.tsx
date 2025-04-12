import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { useChatContext } from '@/context/ChatContext';
import { useStreaming } from '@/lib/streaming/StreamingContext';

interface MessageInputProps {
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
    disabled?: boolean;
}

export function MessageInput({
    className,
    placeholder = "Type your message...",
    autoFocus = false,
    disabled: externalDisabled
}: MessageInputProps) {
    const {
        inputRef,
        sendMessage,
        isProcessing,
        currentChatId,
        scrollToBottom
    } = useChatContext();

    // 使用流式消息状态，添加安全处理
    const [isLocalStreaming, setIsLocalStreaming] = React.useState(false);
    let streamingState = { isStreaming: isLocalStreaming };

    try {
        streamingState = useStreaming();
    } catch (error) {
        // 如果不在StreamingProvider中，使用本地状态
        console.warn('MessageInput: 未在StreamingProvider上下文中，使用默认流状态');
    }

    const { isStreaming } = streamingState;

    const [input, setInput] = React.useState('');
    const isDisabled = !currentChatId || isStreaming || isProcessing || !input.trim() || externalDisabled;

    const handleSend = async () => {
        if (isDisabled) return;

        const message = input.trim();
        setInput('');

        // 发送消息
        await sendMessage(message);

        // 在发送消息后滚动到底部
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isDisabled) {
                handleSend();
            }
        }
    };

    return (
        <div className={cn("flex gap-2 w-full", className)}>
            <AutoResizeTextarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                    "min-h-[40px] max-h-[80px] sm:max-h-[120px] flex-1 resize-none rounded-lg",
                    "border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/30",
                    "transition-shadow text-sm sm:text-base z-50"
                )}
                disabled={isStreaming || isProcessing}
                autoFocus={autoFocus}
            />
            <Button
                disabled={isDisabled}
                onClick={handleSend}
                className={cn(
                    "shrink-0 transition-all px-2 sm:px-4 z-50",
                    (isStreaming || isProcessing) ? "opacity-50" : "hover:scale-105 hover:shadow-md hover:shadow-primary/20"
                )}
            >
                {isStreaming || isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline-block">发送</span>
            </Button>
        </div>
    );
}