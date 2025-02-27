import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Message as MessageIcon,
  Link as LinkIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';

// Componente de estatísticas
const StatCard = ({ icon, title, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            width: 48,
            height: 48,
            backgroundColor: `${color}.light`,
            color: `${color}.main`,
            mr: 2
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChannels: 0,
    activeChannels: 0,
    totalConversations: 0,
    pendingConversations: 0,
    totalMessages: 0,
    todayMessages: 0
  });
  const [recentConversations, setRecentConversations] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Em um cenário real, você buscaria dados da API
        // Simulando dados para demonstração
        
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dados simulados
        setStats({
          totalChannels: 5,
          activeChannels: 3,
          totalConversations: 128,
          pendingConversations: 12,
          totalMessages: 3542,
          todayMessages: 87
        });
        
        setRecentConversations([
          {
            id: 1,
            contact: {
              name: 'João Silva',
              avatar: null,
              phone: '+5511987654321'
            },
            channel: {
              type: 'whatsapp',
              name: 'WhatsApp Principal'
            },
            lastMessage: {
              content: 'Olá, gostaria de saber mais sobre os serviços oferecidos.',
              timestamp: new Date(Date.now() - 15 * 60 * 1000),
              isFromContact: true
            },
            status: 'pending'
          },
          {
            id: 2,
            contact: {
              name: 'Maria Oliveira',
              avatar: null,
              phone: '+5511976543210'
            },
            channel: {
              type: 'instagram',
              name: 'Instagram Oficial'
            },
            lastMessage: {
              content: 'Obrigado pelo atendimento!',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              isFromContact: true
            },
            status: 'resolved'
          },
          {
            id: 3,
            contact: {
              name: 'Carlos Pereira',
              avatar: null,
              phone: '+5511965432109'
            },
            channel: {
              type: 'whatsapp',
              name: 'WhatsApp Principal'
            },
            lastMessage: {
              content: 'Vou verificar essa informação e retorno em breve.',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
              isFromContact: false
            },
            status: 'pending'
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const handleViewAllConversations = () => {
    navigate('/conversations');
  };
  
  const handleViewConversation = (conversationId) => {
    navigate(`/conversations/${conversationId}`);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'active':
        return 'info';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'active':
        return 'Ativo';
      case 'resolved':
        return 'Resolvido';
      default:
        return status;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<LinkIcon fontSize="large" />}
            title="Canais Ativos"
            value={`${stats.activeChannels}/${stats.totalChannels}`}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<MessageIcon fontSize="large" />}
            title="Conversas Pendentes"
            value={stats.pendingConversations}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<NotificationsIcon fontSize="large" />}
            title="Mensagens Hoje"
            value={stats.todayMessages}
            color="info"
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Conversas Recentes</Typography>
              <Button 
                variant="text" 
                onClick={handleViewAllConversations}
              >
                Ver Todas
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {recentConversations.length > 0 ? (
              <List>
                {recentConversations.map((conversation) => (
                  <React.Fragment key={conversation.id}>
                    <ListItem 
                      alignItems="flex-start"
                      secondaryAction={
                        <Chip
                          label={getStatusLabel(conversation.status)}
                          color={getStatusColor(conversation.status)}
                          size="small"
                        />
                      }
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewConversation(conversation.id)}
                    >
                      <ListItemAvatar>
                        <Avatar alt={conversation.contact.name}>
                          {conversation.contact.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography component="span" variant="subtitle1">
                              {conversation.contact.name}
                            </Typography>
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              via {conversation.channel.name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {conversation.lastMessage.isFromContact ? '' : 'Você: '}
                              {conversation.lastMessage.content}
                            </Typography>
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              {format(conversation.lastMessage.timestamp, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhuma conversa recente
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Resumo do Sistema
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Estatísticas Gerais
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Canais
                  </Typography>
                  <Typography variant="h6">
                    {stats.totalChannels}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Conversas
                  </Typography>
                  <Typography variant="h6">
                    {stats.totalConversations}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Mensagens
                  </Typography>
                  <Typography variant="h6">
                    {stats.totalMessages}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Mensagens Hoje
                  </Typography>
                  <Typography variant="h6">
                    {stats.todayMessages}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Status do Sistema
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Servidores"
                    secondary="Todos os serviços estão operacionais"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Banco de Dados"
                    secondary="Conexão estável"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light' }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="API de Mensagens"
                    secondary="Funcionando normalmente"
                  />
                </ListItem>
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
