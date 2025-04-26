import React, { Dispatch, SetStateAction } from 'react';
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
    onSendMessage?: (message: string) => void;
    value: string;
    onInputChange: Dispatch<SetStateAction<string>>;
}

export function MessageInput({
    className,
    placeholder = "Type your message...",
    autoFocus = false,
    disabled: externalDisabled,
    onSendMessage,
    value,
    onInputChange
}: MessageInputProps) {
    const {
        inputRef,
        sendMessage,
        isProcessing,
        currentChatId,
        scrollToBottom
    } = useChatContext();

    const [isLocalStreaming, setIsLocalStreaming] = React.useState(false);
    let streamingState = { isStreaming: isLocalStreaming };

    streamingState = useStreaming();

    const { isStreaming } = streamingState;

    const [isComposing, setIsComposing] = React.useState(false);

    const isDisabled = !currentChatId || isStreaming || isProcessing || !value.trim() || externalDisabled;

    const handleSend = async () => {
        if (isDisabled) return;

        const message = value.trim();
        onInputChange('');

        if (onSendMessage) {
            onSendMessage(message);
        } else {
            sendMessage(message);
        }

        setTimeout(() => {
            scrollToBottom();
        }, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            if (!isDisabled) {
                handleSend();
            }
        }
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = () => {
        setIsComposing(false);
    };

    return (
        <div className={cn("flex gap-2 w-full", className)}>
            <AutoResizeTextarea
                ref={inputRef}
                value={value}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
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
                <span className="ml-2 hidden sm:inline-block">Send</span>
            </Button>
        </div>
    );
}