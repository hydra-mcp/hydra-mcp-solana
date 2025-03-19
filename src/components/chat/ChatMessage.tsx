import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Bot } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';

interface ChatMessageProps {
  message: Message;
  isCurrentChat?: boolean;
}

export function ChatMessage({ message, isCurrentChat = true }: ChatMessageProps) {
  const isAI = message.sender === 'ai';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 transition-opacity duration-300',
        isVisible && 'opacity-100',
        !isVisible && 'opacity-0',
        isAI ? 'justify-start' : 'justify-end'
      )}
    >
      {isAI && (
        <Avatar className="mt-1 h-8 w-8 bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 shadow-lg transition-all',
          !isCurrentChat && 'opacity-50',
          isAI
            ? 'bg-muted text-muted-foreground'
            : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
        )}
      >
        <p className="break-words">{message.content}</p>
        <time className="mt-1 block text-right text-xs opacity-50">
          {message.timestamp.toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
}