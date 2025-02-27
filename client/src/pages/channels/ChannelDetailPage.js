import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
  Divider,
  TextField,
  Switch,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Person as PersonIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Telegram as TelegramIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Chat as ChatIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import ConversationList from '../../components/ConversationList';
import ConversationChat from '../../components/ConversationChat';

// Componente para exibir QR Code
const QRCodeDisplay = ({ qrCode, refreshQR }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  
  useEffect(() => {
    if (qrCode) {
      setTimeLeft(60); // Reset do contador quando novo QR code é recebido
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [qrCode]);
  
  if (!qrCode) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Gerando QR Code...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <img src={qrCode} alt="QR Code para conexão WhatsApp" style={{ maxWidth: '100%' }} />
      </Box>
      <Typography variant="body2" gutterBottom>
        Escaneie este QR Code com seu WhatsApp
      </Typography>
      <Typography variant="caption" color="error" display="block" gutterBottom>
        Expira em {timeLeft} segundos
      </Typography>
      {timeLeft === 0 && (
        <Button 
          variant="outlined" 
          color="primary"
          size="small"
          onClick={refreshQR}
          sx={{ mt: 1 }}
        >
          Atualizar QR Code
        </Button>
      )}
    </Box>
  );
};

// Componente para exibir as estatísticas do canal
const ChannelStats = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Mensagens Enviadas
            </Typography>
            <Typography variant="h4">
              {stats?.messagesSent || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Mensagens Recebidas
            </Typography>
            <Typography variant="h4">
              {stats?.messagesReceived || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Conversas Ativas
            </Typography>
            <Typography variant="h4">
              {stats?.activeConversations || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Contatos
            </Typography>
            <Typography variant="h4">
              {stats?.contacts || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Componente para exibir o histórico de eventos do canal
const ChannelHistory = ({ events }) => {
  return (
    <List>
      {events && events.length > 0 ? (
        events.map((event, index) => (
          <ListItem key={index} divider={index < events.length - 1}>
            <ListItemIcon>
              {event.type === 'connection' ? <RefreshIcon /> : <MessageIcon />}
            </ListItemIcon>
            <ListItemText
              primary={event.description}
              secondary={new Date(event.timestamp).toLocaleString()}
            />
          </ListItem>
        ))
      ) : (
        <ListItem>
          <ListItemText primary="Nenhum evento registrado" />
        </ListItem>
      )}
    </List>
  );
};

// Componente para exibir e editar as configurações do canal
const ChannelSettings = ({ settings, onSave, readOnly }) => {
  const [formData, setFormData] = useState(settings || {});
  const [editing, setEditing] = useState(false);
  
  useEffect(() => {
    setFormData(settings || {});
  }, [settings]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = () => {
    onSave(formData);
    setEditing(false);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      {!readOnly && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          {editing ? (
            <>
              <Button 
                startIcon={<SaveIcon />} 
                variant="contained" 
                color="primary" 
                onClick={handleSave}
                sx={{ mr: 1 }}
              >
                Salvar
              </Button>
              <Button 
                startIcon={<CancelIcon />} 
                variant="outlined" 
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button 
              startIcon={<EditIcon />} 
              variant="outlined" 
              onClick={() => setEditing(true)}
            >
              Editar Configurações
            </Button>
          )}
        </Box>
      )}
      
      <Grid container spacing={3}>
        {Object.entries(formData).map(([key, value]) => (
          <Grid item xs={12} sm={6} key={key}>
            <TextField
              fullWidth
              label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              name={key}
              value={value || ''}
              onChange={handleChange}
              disabled={!editing || readOnly}
              variant="outlined"
              margin="normal"
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Função para buscar o QR code do WhatsApp
const fetchWhatsAppQR = async (channelId) => {
  try {
    const response = await axios.get(`/api/channels/whatsapp/${channelId}/qrcode`);
    if (response.data && response.data.data && response.data.data.qrCode) {
      return response.data.data.qrCode;
    }
    return null;
  } catch (err) {
    console.error('Erro ao buscar QR Code:', err);
    return null;
  }
};

function ChannelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [qrCode, setQrCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  // Obter dados do canal
  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/channels/${id}`);
        setChannel(response.data);
        
        // Obter estatísticas
        const statsResponse = await axios.get(`/api/channels/${id}/stats`);
        setStats(statsResponse.data);
        
        // Obter histórico de eventos
        const eventsResponse = await axios.get(`/api/channels/${id}/events`);
        setEvents(eventsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dados do canal:', err);
        setError('Não foi possível carregar os dados do canal. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChannelData();
  }, [id]);
  
  // Função para obter o ícone do canal com base no tipo
  const getChannelIcon = (type) => {
    switch (type) {
      case 'whatsapp':
        return <WhatsAppIcon />;
      case 'instagram':
        return <InstagramIcon />;
      case 'facebook':
        return <FacebookIcon />;
      case 'telegram':
        return <TelegramIcon />;
      default:
        return <MessageIcon />;
    }
  };
  
  // Função para obter a cor do chip de status
  const getStatusColor = (status) => {
    return status === 'connected' ? 'success' : 'error';
  };
  
  // Manipulador de mudança de aba
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Função para conectar/desconectar o canal
  const handleToggleConnection = async () => {
    try {
      setLoading(true);
      
      if (channel?.status === 'connected') {
        // Desconectar
        await axios.post(`/api/channels/${id}/disconnect`);
        setChannel(prev => ({ ...prev, status: 'disconnected' }));
        setSnackbar({
          open: true,
          message: 'Canal desconectado com sucesso',
          severity: 'success'
        });
      } else {
        // Conectar
        let response;
        
        if (channel?.type === 'whatsapp') {
          response = await axios.post(`/api/channels/whatsapp/${id}/connect`);
        } else {
          response = await axios.post(`/api/channels/${id}/connect`);
        }
        
        // Se a conexão foi iniciada e é um canal WhatsApp, começar a buscar o QR code
        if (channel?.type === 'whatsapp') {
          setChannel(prev => ({ ...prev, status: 'connecting' }));
          
          // Esperar um pouco para que o QR code seja gerado no backend
          setTimeout(async () => {
            // Obter QR Code
            const qrResponse = await fetchWhatsAppQR(channel.id);
            if (qrResponse) {
              setQrCode(qrResponse);
            }
          }, 3000);
          
          // Configurar polling para verificar status e QR code
          const pollingInterval = setInterval(async () => {
            try {
              // Verificar status do canal
              const statusResponse = await axios.get(`/api/channels/whatsapp/${id}/status`);
              const newStatus = statusResponse.data.data.status || statusResponse.data.status;
              setChannel(prev => ({ ...prev, status: newStatus }));
              
              // Se conectado, parar polling
              if (newStatus === 'connected') {
                clearInterval(pollingInterval);
                setQrCode(null);
                setSnackbar({
                  open: true,
                  message: 'Canal conectado com sucesso',
                  severity: 'success'
                });
              } 
              // Se ainda em QR ready, obter QR code atualizado
              else if (newStatus === 'qr_ready' || newStatus === 'connecting') {
                const newQrResponse = await fetchWhatsAppQR(channel.id);
                if (newQrResponse) {
                  setQrCode(newQrResponse);
                }
              }
            } catch (err) {
              console.error('Erro durante polling de status:', err);
            }
          }, 5000); // Verificar a cada 5 segundos
          
          // Limpar polling quando o componente for desmontado
          return () => clearInterval(pollingInterval);
        } else {
          setChannel(prev => ({ ...prev, status: response.data.status }));
        }
        
        setSnackbar({
          open: true,
          message: 'Iniciando conexão do canal',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Erro ao alterar conexão do canal:', err);
      setSnackbar({
        open: true,
        message: `Erro ao ${channel?.status === 'connected' ? 'desconectar' : 'conectar'} o canal`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para salvar configurações
  const handleSaveSettings = async (settings) => {
    try {
      setLoading(true);
      await axios.put(`/api/channels/${id}/settings`, settings);
      setChannel(prev => ({ ...prev, settings }));
      setSnackbar({
        open: true,
        message: 'Configurações salvas com sucesso',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar configurações',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para excluir o canal
  const handleDeleteChannel = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/channels/${id}`);
      setSnackbar({
        open: true,
        message: 'Canal excluído com sucesso',
        severity: 'success'
      });
      // Redirecionar para a lista de canais
      navigate('/channels');
    } catch (err) {
      console.error('Erro ao excluir canal:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir canal',
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  // Fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  if (loading && !channel) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/channels')}
          sx={{ mt: 2 }}
        >
          Voltar para Canais
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/channels')}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          Detalhes do Canal
        </Typography>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />} 
          onClick={() => setOpenDeleteDialog(true)}
          sx={{ ml: 1 }}
        >
          Excluir
        </Button>
      </Box>
      
      {/* Informações do canal */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 2 }}>
                {getChannelIcon(channel?.type)}
              </Box>
              <Box>
                <Typography variant="h6">{channel?.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {channel?.type?.charAt(0).toUpperCase() + channel?.type?.slice(1)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Chip 
              label={channel?.status === 'connected' ? 'Conectado' : 'Desconectado'} 
              color={getStatusColor(channel?.status)} 
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              color={channel?.status === 'connected' ? 'error' : 'primary'}
              onClick={handleToggleConnection}
              disabled={loading}
              startIcon={channel?.status === 'connected' ? <LinkOffIcon /> : <LinkIcon />}
            >
              {channel?.status === 'connected' ? 'Desconectar' : 'Conectar'}
            </Button>
          </Grid>
        </Grid>
        
        {/* QR Code (se necessário) */}
        {qrCode && channel?.type === 'whatsapp' && channel?.status !== 'connected' && (
          <QRCodeDisplay qrCode={qrCode} refreshQR={() => {
            setQrCode(null);
            handleToggleConnection();
          }} />
        )}
      </Paper>
      
      {/* Abas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
        >
          <Tab label="Estatísticas" icon={<HistoryIcon />} iconPosition="start" />
          <Tab label="Histórico" icon={<RefreshIcon />} iconPosition="start" />
          <Tab label="Configurações" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Conversas" icon={<ChatIcon />} iconPosition="start" />
        </Tabs>
        
        {/* Conteúdo da aba de estatísticas */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <ChannelStats stats={stats} />
          </Box>
        )}
        
        {/* Conteúdo da aba de histórico */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <ChannelHistory events={events} />
          </Box>
        )}
        
        {/* Conteúdo da aba de configurações */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <ChannelSettings 
              settings={channel?.settings} 
              onSave={handleSaveSettings} 
              readOnly={channel?.status === 'connected'}
            />
            
            <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Typography variant="h6" color="error" gutterBottom>
                Zona de Perigo
              </Typography>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={() => setOpenDeleteDialog(true)}
              >
                Excluir Canal
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Conteúdo da aba de conversas */}
        {tabValue === 3 && (
          <Box sx={{ p: 3, height: '600px' }}>
            {channel?.status === 'connected' ? (
              <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                  <ConversationList 
                    channelId={channel.id} 
                    onSelectConversation={(conversation) => setSelectedConversation(conversation)}
                  />
                </Grid>
                <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                  <ConversationChat 
                    channelId={channel.id} 
                    conversation={selectedConversation}
                  />
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h6" gutterBottom color="textSecondary">
                  O canal precisa estar conectado para visualizar conversas
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleToggleConnection}
                  disabled={loading}
                  startIcon={<LinkIcon />}
                  sx={{ mt: 2 }}
                >
                  Conectar Canal
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Excluir Canal</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o canal "{channel?.name}"? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDeleteChannel} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChannelDetailPage;
