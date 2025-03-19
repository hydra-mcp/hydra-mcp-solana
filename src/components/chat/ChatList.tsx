import { cn } from '@/lib/utils';
import { Chat } from '@/types/chat';
import { MessageSquarePlus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChatListProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatList({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
}: ChatListProps) {
  return (
    <div className="flex h-full flex-col gap-2">
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={onNewChat}
      >
        <MessageSquarePlus className="h-4 w-4" />
        New Chat
      </Button>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1">
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant={chat.id === currentChatId ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="truncate">{chat.title}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}