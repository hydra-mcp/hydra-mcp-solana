import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppWindowProvider } from '@/contexts/AppWindowContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from './Login';
import { AppLayout } from '@/layouts/AppLayout';
import { ChatPage } from '@/pages/ChatPage';
import Home from '@/pages/index';
import { PhantomTest } from '@/pages/PhantomTest';
import { Toaster } from '@/components/ui/toaster';
import { ErrorHandler } from '@/components/ErrorHandler';
import { IOSDesktop } from '@/pages/IOSDesktop';
import { WalletFinder } from '@/pages/WalletFinder';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWindowProvider>
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
                <Route path="/phantom-test" element={<PhantomTest />} />
              </Route>

              {/* iOS Layout Routes - These don't use the AppLayout */}
              <Route path="/ios-desktop" element={<IOSDesktop />} />
              <Route path="/wallet-finder" element={<WalletFinder isModal={false} />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppWindowProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
