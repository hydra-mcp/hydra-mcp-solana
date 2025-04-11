import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Trash2, Plus, Eraser } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Chat } from '@/types/chat';

interface ChatListProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClearAllChats: () => void;
  isLoading?: boolean;
}

export function ChatList({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClearAllChats,
  isLoading = false
}: ChatListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState<string | null>(null);

  // Delete a single chat
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click event propagation
    setChatToDelete(chatId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete);
    }
    setIsDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  // Confirm clear all
  const confirmClearAll = () => {
    onClearAllChats();
    setIsClearAllDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* New chat button */}
      <Button
        variant="outline"
        className="flex items-center gap-2 w-full"
        onClick={onNewChat}
      >
        <Plus className="h-4 w-4" />
        <span>New Chat</span>
      </Button>

      {/* Chat list */}
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chats.length > 0 ? (
          <>
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-left text-sm rounded-md transition-colors",
                  "hover:bg-primary/10",
                  chat.id === currentChatId
                    ? "bg-primary/15 text-primary"
                    : "text-foreground"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            ))}

            {/* Clear all chats button */}
            <Button
              variant="ghost"
              className="mt-4 flex items-center gap-2 w-full"
              onClick={() => setIsClearAllDialogOpen(true)}
            >
              <Eraser className="h-4 w-4" />
              <span>Clear All Chats</span>
            </Button>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No chats yet. Start a new conversation!
          </div>
        )}
      </div>

      {/* Delete a single chat confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all chats confirmation dialog */}
      <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Chats</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all chats? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll} className="bg-destructive text-destructive-foreground">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}