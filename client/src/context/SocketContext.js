import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Criar contexto
const SocketContext = createContext();

// Hook personalizado para usar o contexto
export const useSocket = () => useContext(SocketContext);

// Provedor do contexto
export const SocketProvider = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Conectar ao socket
  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !accessToken) return;
    
    // Criar instância do socket
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || '', {
      auth: {
        token: accessToken
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Configurar eventos
    socketInstance.on('connect', () => {
      console.log('Socket conectado:', socketInstance.id);
      setConnected(true);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason);
      setConnected(false);
    });
    
    socketInstance.on('error', (error) => {
      console.error('Erro no socket:', error);
    });
    
    // Armazenar instância
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, isAuthenticated]);
  
  // Desconectar do socket
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);
  
  // Reconectar ao socket quando o token mudar
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      disconnectSocket();
      connectSocket();
    }
    
    return () => {
      disconnectSocket();
    };
  }, [accessToken, isAuthenticated, connectSocket, disconnectSocket]);
  
  // Inscrever em uma conversa
  const subscribeToConversation = useCallback((conversationId) => {
    if (socket && connected) {
      socket.emit('subscribe', conversationId);
    }
  }, [socket, connected]);
  
  // Cancelar inscrição em uma conversa
  const unsubscribeFromConversation = useCallback((conversationId) => {
    if (socket && connected) {
      socket.emit('unsubscribe', conversationId);
    }
  }, [socket, connected]);
  
  // Registrar um listener para eventos
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      
      return () => {
        socket.off(event, callback);
      };
    }
    
    return () => {};
  }, [socket]);
  
  // Valor do contexto
  const value = {
    socket,
    connected,
    connectSocket,
    disconnectSocket,
    subscribeToConversation,
    unsubscribeFromConversation,
    on
  };
  
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
