import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Bot } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
  isCurrentChat?: boolean;
  isStreaming?: boolean;
}

export function ChatMessage({
  message,
  isCurrentChat = true,
  isStreaming = false
}: ChatMessageProps) {
  const isAI = message.sender === 'ai';
  const [isVisible, setIsVisible] = useState(false);
  const [displayedContent, setDisplayedContent] = useState('');
  const [typingComplete, setTypingComplete] = useState(!isAI || !isStreaming);

  // Entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Implement typing effect for AI messages
  useEffect(() => {
    if (!isAI || !isStreaming || !message.content) {
      setDisplayedContent(message.content);
      setTypingComplete(true);
      return;
    }

    setDisplayedContent('');
    setTypingComplete(false);

    let i = 0;
    const content = message.content;
    const typingInterval = setInterval(() => {
      setDisplayedContent(prev => prev + content.charAt(i));
      i++;
      if (i >= content.length) {
        clearInterval(typingInterval);
        setTypingComplete(true);
      }
    }, 15); // Faster typing speed

    return () => clearInterval(typingInterval);
  }, [isAI, isStreaming, message.content]);

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        isAI ? 'justify-start' : 'justify-end'
      )}
    >
      {isAI && (
        <Avatar className={cn(
          "mt-1 h-8 w-8 bg-primary/10 transition-all duration-300",
          !typingComplete && isStreaming && "animate-pulse"
        )}>
          <Bot className="h-4 w-4 text-primary" />
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 shadow-lg transition-all duration-300',
          !isCurrentChat && 'opacity-50 scale-95',
          isAI
            ? 'bg-gradient-to-r from-muted to-muted/80 text-muted-foreground hover:shadow-md'
            : 'bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground hover:shadow-md hover:scale-[1.01]'
        )}
        style={{
          boxShadow: isAI
            ? '0 4px 12px rgba(0, 0, 0, 0.05)'
            : '0 4px 12px rgba(var(--primary-rgb), 0.2)'
        }}
      >
        <div className="break-words relative">
          {/* Use markdown renderer when message is complete */}
          {typingComplete ? (
            <MarkdownRenderer
              content={message.content}
              className={cn(
                isAI ? 'text-muted-foreground' : 'text-primary-foreground',
                'prose-sm'
              )}
            />
          ) : (
            <>
              {displayedContent}
              {!typingComplete && isAI && isStreaming && (
                <span className="ml-1 inline-block h-4 w-1.5 animate-blink bg-current rounded-sm"></span>
              )}
            </>
          )}
        </div>
        <time className="mt-1 block text-right text-xs opacity-50">
          {new Date(message.createdAt).toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
}