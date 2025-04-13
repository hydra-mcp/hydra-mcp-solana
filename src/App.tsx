import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppWindowProvider } from '@/contexts/AppWindowContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from './Login';
import { AppLayout } from '@/layouts/AppLayout';
import { ChatPage } from '@/pages/ChatPage';
import Home from '@/pages/index';
import { Toaster } from '@/components/ui/toaster';
import { ErrorHandler } from '@/components/ErrorHandler';
import { IOSDesktop } from '@/pages/IOSDesktop';
import { WalletFinder } from '@/pages/WalletFinder';
import { useToast } from '@/hooks/use-toast';
import { CaSignal } from '@/pages/CaSignal';
import { SmartWallet } from './pages/SmartWallet';
import { SolanaPaymentPage } from './pages/SolanaPaymentPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWindowProvider>
          {/* Global Toaster for notifications */}
          <Toaster />

          {/* Global API error handler */}
          <ErrorHandler />

          <AppContent />
        </AppWindowProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

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
          {/* <Route path="/chat" element={<ChatPage />} /> */}
          {/* <Route path="/ca-signal" element={<CaSignal />} /> */}
          {/* <Route path="/smart-wallet" element={<SmartWallet />} /> */}
          <Route path="/payment" element={<SolanaPaymentPage />} />
        </Route>

        {/* iOS Layout Routes - These don't use the AppLayout */}
        <Route path="/ios-desktop" element={<IOSDesktop />} />
        {/* <Route path="/wallet-finder" element={<WalletFinder isModal={true} />} /> */}
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
