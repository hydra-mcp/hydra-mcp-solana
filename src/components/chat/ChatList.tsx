import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Trash2, Plus, Eraser } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Chat } from '@/types/chat';
import { useTheme } from '@/hooks/use-theme';

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
  const { isDarkMode } = useTheme();
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
        className={cn(
          "flex items-center gap-2 w-full shadow-sm hover:shadow-md transition-all duration-200 h-10 font-medium",
          isDarkMode
            ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
            : "bg-blue-600/10 hover:bg-blue-600/15 text-blue-600 border-blue-400/30"
        )}
        onClick={onNewChat}
      >
        <Plus className="h-4 w-4" />
        <span>New Chat</span>
      </Button>

      {/* Chat list */}
      <div className="flex flex-col gap-1.5 mt-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chats.length > 0 ? (
          <>
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 text-left text-sm rounded-lg transition-all duration-200 group cursor-pointer",
                  isDarkMode
                    ? "hover:bg-blue-500/10 hover:shadow-sm"
                    : "hover:bg-blue-500/10 hover:shadow-sm",
                  chat.id === currentChatId
                    ? isDarkMode
                      ? "bg-gradient-to-r from-blue-500/25 to-purple-500/15 text-blue-300 shadow-sm border-l-2 border-blue-400"
                      : "bg-gradient-to-r from-blue-500/15 to-blue-400/5 text-blue-600 shadow-sm border-l-2 border-blue-500 font-medium"
                    : "text-foreground"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    chat.id === currentChatId
                      ? isDarkMode
                        ? "bg-blue-500/30 text-blue-300"
                        : "bg-blue-500/20 text-blue-600"
                      : isDarkMode
                        ? "bg-gray-700/50 text-gray-400"
                        : "bg-blue-50 text-blue-500/70"
                  )}>
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">{chat.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full",
                    isDarkMode
                      ? "hover:text-red-400 hover:bg-red-500/20"
                      : "hover:text-red-500 hover:bg-red-500/10"
                  )}
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Clear all chats button */}
            <Button
              variant="ghost"
              className={cn(
                "mt-6 flex items-center gap-2 w-full border border-dashed rounded-lg py-1.5 transition-all duration-200",
                isDarkMode
                  ? "text-gray-400 hover:text-red-400 border-gray-700/50 hover:border-red-500/50"
                  : "text-gray-500 hover:text-red-500 border-gray-200 hover:border-red-200"
              )}
              onClick={() => setIsClearAllDialogOpen(true)}
            >
              <Eraser className="h-4 w-4" />
              <span>Clear All Chats</span>
            </Button>
          </>
        ) : (
          <div className={cn(
            "text-center py-8 rounded-lg border border-dashed mt-4",
            isDarkMode
              ? "text-gray-400 bg-gray-800/30 border-gray-700"
              : "text-gray-500 bg-blue-50/30 border-blue-100"
          )}>
            <div className={cn(
              "w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center",
              isDarkMode ? "bg-gray-700/50" : "bg-blue-100/50"
            )}>
              <MessageSquare className={cn(
                "h-6 w-6",
                isDarkMode ? "text-gray-500" : "text-blue-400"
              )} />
            </div>
            <p className="text-sm">No chats yet. Start a new conversation!</p>
          </div>
        )}
      </div>

      {/* Delete a single chat confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className={cn(
          "max-w-md",
          isDarkMode && "bg-gray-800 border-gray-700"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(
              isDarkMode && "bg-gray-700 text-gray-200 hover:bg-gray-600"
            )}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors",
              isDarkMode && "bg-red-600 hover:bg-red-700"
            )}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all chats confirmation dialog */}
      <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <AlertDialogContent className={cn(
          "max-w-md",
          isDarkMode && "bg-gray-800 border-gray-700"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Chats</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all chats? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(
              isDarkMode && "bg-gray-700 text-gray-200 hover:bg-gray-600"
            )}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll} className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors",
              isDarkMode && "bg-red-600 hover:bg-red-700"
            )}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}