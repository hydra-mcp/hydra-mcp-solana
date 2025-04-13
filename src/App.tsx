import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from './Login';
import { AppLayout } from '@/layouts/AppLayout';
import { ChatPage } from '@/pages/ChatPage';
import Home from '@/pages/index';
import { Toaster } from '@/components/ui/toaster';
import { ErrorHandler } from '@/components/ErrorHandler';
<<<<<<< HEAD
=======
import { IOSDesktop } from '@/pages/IOSDesktop';
import { WalletFinder } from '@/pages/WalletFinder';
import { useToast } from '@/hooks/use-toast';
import { CaSignal } from '@/pages/CaSignal';
import { SmartWallet } from './pages/SmartWallet';
<<<<<<< HEAD
import SolanaPaymentPage from './pages/SolanaPaymentPage';
>>>>>>> fcc14ea (refactor: remove unused SolanaTransactionDemo route from App component to streamline routing)
=======
import { SolanaPaymentPage } from './pages/SolanaPaymentPage';
>>>>>>> 39ec333 (feat: implement Solana recharge feature with wallet connection, transaction handling, and UI enhancements for better user experience)

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
    <BrowserRouter>
      <AuthProvider>
        {/* Global Toaster for notifications */}
        <Toaster />

        {/* Global API error handler */}
        <ErrorHandler />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* AppLayout Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<ChatPage isModal={false} />} />
            </Route>

            {/* iOS Layout Routes - These don't use the AppLayout */}
            <Route path="/ios-desktop" element={<IOSDesktop />} />
            <Route path="/wallet-finder" element={<WalletFinder isModal={false} />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

<<<<<<< HEAD
=======
function AppContent() {
  const { toast } = useToast();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* AppLayout Routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
<<<<<<< HEAD
          <Route path="/chat" element={<ChatPage isModal={true} />} />
=======
          {/* <Route path="/chat" element={<ChatPage />} /> */}
          {/* <Route path="/ca-signal" element={<CaSignal />} /> */}
          {/* <Route path="/smart-wallet" element={<SmartWallet />} /> */}
<<<<<<< HEAD
          <Route path="/solana-payment" element={<SolanaPaymentPage />} />
>>>>>>> fcc14ea (refactor: remove unused SolanaTransactionDemo route from App component to streamline routing)
=======
          <Route path="/payment" element={<SolanaPaymentPage />} />
>>>>>>> a66dc54 (refactor: rename SolanaPayment route and update related links for consistency)
        </Route>

        {/* iOS Layout Routes - These don't use the AppLayout */}
        <Route path="/ios-desktop" element={<IOSDesktop />} />
        <Route path="/wallet-finder" element={<WalletFinder isModal={true} />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

>>>>>>> 6a8b710 (feat: update chat components to support modal mode and enhance sidebar functionality, including custom scrollbar styles and improved message handling)
export default App;
