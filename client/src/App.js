import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ChannelsPage from './pages/channels/ChannelsPage';
import ChannelDetailPage from './pages/channels/ChannelDetailPage';
import ConversationsPage from './pages/conversations/ConversationsPage';
import ConversationDetailPage from './pages/conversations/ConversationDetailPage';
import WebhooksPage from './pages/webhooks/WebhooksPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated } = useAuth();
  const { connectSocket, disconnectSocket } = useSocket();
  
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, connectSocket, disconnectSocket]);
  
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
      
      {/* Rotas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="channels/:id" element={<ChannelDetailPage />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="conversations/:id" element={<ConversationDetailPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      
      {/* Rota 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
