import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Avatar
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const ConversationChat = ({ channelId, conversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Carregar mensagens quando a conversa for selecionada
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversation || !conversation.id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/messages/conversation/${conversation.id}`);
        setMessages(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        setError('Não foi possível carregar as mensagens.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation]);

  // Rolar para a última mensagem quando mensagens forem atualizadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversation || !conversation.id) {
      return;
    }
    
    try {
      setSending(true);
      const response = await axios.post(`/api/messages/whatsapp/${channelId}/${conversation.id}`, {
        message: newMessage
      });
      
      // Adicionar mensagem à lista local (otimista)
      setMessages(prev => [
        {
          id: response.data.data.messageId,
          conversation_id: conversation.id,
          channel_id: channelId,
          direction: 'outbound',
          content: newMessage,
          status: 'sent',
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
      
      // Limpar campo de mensagem
      setNewMessage('');
      setError(null);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  // Formatar a hora da mensagem
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'HH:mm');
  };

  if (!conversation) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="textSecondary">
          Selecione uma conversa para começar
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabeçalho da conversa */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 2 }}>
          <PersonIcon />
        </Avatar>
        <Typography variant="h6">
          {conversation.contact_name || conversation.contact_id}
        </Typography>
      </Box>
      
      {/* Área de mensagens */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <div ref={messagesEndRef} />
            {messages.length > 0 ? (
              messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: message.direction === 'outbound' ? 'primary.main' : 'grey.100',
                      color: message.direction === 'outbound' ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: 'right',
                        mt: 0.5,
                        opacity: 0.8
                      }}
                    >
                      {formatMessageTime(message.timestamp)}
                      {message.direction === 'outbound' && (
                        <span style={{ marginLeft: 4 }}>
                          {message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Typography color="textSecondary">
                  Nenhuma mensagem encontrada
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
      
      {/* Área de input */}
      <Divider />
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex' }}>
            <IconButton
              color="primary"
              aria-label="anexar arquivo"
              component="span"
              disabled={sending}
            >
              <AttachFileIcon />
            </IconButton>
            <TextField
              fullWidth
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              variant="outlined"
              size="small"
              disabled={sending}
              sx={{ mx: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              endIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={sending || !newMessage.trim()}
              type="submit"
            >
              Enviar
            </Button>
          </Box>
        </form>
      </Box>
    </Paper>
  );
};

export default ConversationChat;
