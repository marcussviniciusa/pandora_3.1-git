import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ConversationList = ({ channelId, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/channels/${channelId}/conversations`);
        setConversations(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar conversas:', err);
        setError('Não foi possível carregar as conversas.');
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchConversations();
    }
  }, [channelId]);

  // Filtrar conversas baseado no termo de busca
  const filteredConversations = conversations.filter(
    (conversation) => {
      const contactName = conversation.contact_name || '';
      return contactName.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  const handleSelectConversation = (conversation) => {
    setSelectedId(conversation.id);
    if (onSelectConversation) {
      onSelectConversation(conversation);
    }
  };

  // Formatar data da última mensagem
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    // Se for hoje, mostrar só a hora
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'HH:mm');
    }
    
    // Se for esta semana, mostrar o dia da semana
    const diffDays = Math.round((today - messageDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return format(messageDate, 'EEEE', { locale: ptBR });
    }
    
    // Caso contrário, mostrar a data completa
    return format(messageDate, 'dd/MM/yyyy');
  };

  if (loading && conversations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <TextField
          fullWidth
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <React.Fragment key={conversation.id}>
              <ListItem
                button
                selected={selectedId === conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={conversation.contact_name || conversation.contact_id}
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                        {conversation.last_message || 'Iniciar conversa'}
                      </Box>
                      <Box component="span" sx={{ ml: 1, flexShrink: 0 }}>
                        {formatLastMessageTime(conversation.last_message_at)}
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <MessageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography color="textSecondary">
              {searchTerm ? 'Nenhum contato encontrado' : 'Nenhuma conversa iniciada'}
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
};

export default ConversationList;
