import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

// Criar contexto
const AuthContext = createContext();

// Hook personalizado para usar o contexto
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Verificar se o token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };
  
  // Configurar interceptor para adicionar token às requisições
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Se o erro for 401 (não autorizado) e não for uma tentativa de refresh
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;
          
          try {
            // Tentar renovar o token
            const response = await axios.post('/api/auth/refresh', {
              refreshToken,
              sessionId
            });
            
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
            
            // Atualizar tokens
            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Reenviar a requisição original com o novo token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Se não conseguir renovar, fazer logout
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken, sessionId]);
  
  // Verificar autenticação ao carregar
  useEffect(() => {
    const verifyAuth = async () => {
      setLoading(true);
      
      if (accessToken && !isTokenExpired(accessToken)) {
        try {
          // Obter dados do usuário
          const response = await axios.get('/api/auth/profile');
          setUser(response.data.data);
        } catch (error) {
          console.error('Erro ao obter perfil:', error);
          logout();
        }
      } else if (refreshToken && !isTokenExpired(refreshToken)) {
        try {
          // Tentar renovar o token
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
            sessionId
          });
          
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Atualizar tokens
          setAccessToken(newAccessToken);
          setRefreshToken(newRefreshToken);
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Obter dados do usuário
          const profileResponse = await axios.get('/api/auth/profile', {
            headers: { Authorization: `Bearer ${newAccessToken}` }
          });
          
          setUser(profileResponse.data.data);
        } catch (error) {
          console.error('Erro ao renovar token:', error);
          logout();
        }
      } else {
        // Se não houver tokens válidos, fazer logout
        logout();
      }
      
      setLoading(false);
    };
    
    verifyAuth();
  }, []);
  
  // Função de login
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      const { user: userData, accessToken: newAccessToken, refreshToken: newRefreshToken, sessionId: newSessionId } = response.data.data;
      
      // Atualizar estado
      setUser(userData);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setSessionId(newSessionId);
      
      // Armazenar tokens no localStorage
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('sessionId', newSessionId);
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      setError(error.response?.data?.message || 'Erro ao fazer login');
      setLoading(false);
      return false;
    }
  };
  
  // Função de logout
  const logout = async () => {
    try {
      if (sessionId) {
        await axios.post('/api/auth/logout', { sessionId });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar estado
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setSessionId(null);
      
      // Limpar localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionId');
    }
  };
  
  // Valor do contexto
  const value = {
    user,
    accessToken,
    refreshToken,
    sessionId,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
