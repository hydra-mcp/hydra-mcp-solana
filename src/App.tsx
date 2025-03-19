import { Moon, Sun, Bot, Send, ChevronDown, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatList } from '@/components/chat/ChatList';
import { Chat, Message } from '@/types/chat';
import { sendMessage } from '@/lib/api';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setIsScrolledUp(!isAtBottom);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      )
    );
  };

  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    // Update chat with user message
    const updatedMessages = [...(currentChat?.messages || []), newMessage];
    updateChat(currentChatId, {
      messages: updatedMessages,
      updatedAt: new Date(),
      title: updatedMessages.length === 1 ? input.slice(0, 30) : currentChat?.title,
    });

    setInput('');

    try {
      // Get AI response
      const response = await sendMessage(input);
      const aiMessage: Message = {
        id: response.id,
        content: response.choices[0].message.content,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      updateChat(currentChatId, {
        messages: [...updatedMessages, aiMessage],
        updatedAt: new Date(),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (currentChat?.messages.length > 0) {
      scrollToBottom();
    }
  }, [currentChat?.messages]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    toast({
      title: `Switched to ${isDarkMode ? 'light' : 'dark'} mode`,
      duration: 1500,
    });
  };

  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  return (
    <div className={cn(
      'flex h-screen flex-col bg-background transition-colors duration-300',
      isDarkMode ? 'dark' : ''
    )}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-20 h-full w-64 transform border-r bg-background transition-transform duration-300',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="font-semibold">Chat History</h2>
        </div>
        <div className="p-4">
          <ChatList
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={setCurrentChatId}
            onNewChat={createNewChat}
          />
        </div>
      </aside>

      {/* Header */}
      <header className="fixed top-0 z-10 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className={cn(
          'container flex h-14 items-center',
          isSidebarOpen && 'ml-64 transition-[margin] duration-300'
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-2"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
          <div className="flex items-center gap-2 font-bold">
            <Bot className="h-6 w-6 animate-pulse text-primary" />
            <span className="hidden sm:inline-block">AI Chat Assistant</span>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-transform hover:scale-110"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className={cn(
        'container flex-1 pt-16 pb-16',
        isSidebarOpen && 'ml-64 transition-[margin] duration-300'
      )}>
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full rounded-lg border bg-muted/50"
          onScroll={handleScroll}
        >
          <div className="flex flex-col gap-4 p-4">
            {currentChat?.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentChat={true}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Scroll to Bottom Button */}
        {isScrolledUp && (
          <Button
            variant="secondary"
            size="icon"
            className="fixed bottom-20 right-4 z-10 rounded-full shadow-lg transition-transform hover:scale-110"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </main>

      {/* Input Area */}
      <footer className={cn(
        'fixed bottom-0 right-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isSidebarOpen ? 'left-64' : 'left-0',
        'transition-[left] duration-300'
      )}>
        <div className="container flex gap-2 py-4 pr-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="min-h-10 max-h-32 resize-none"
          />
          <Button
            disabled={!currentChatId}
            onClick={handleSend}
            className="shrink-0 transition-transform hover:scale-105"
          >
            <Send className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline-block">Send</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default App;
