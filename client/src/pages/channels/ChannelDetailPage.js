import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  Telegram as TelegramIcon,
  Facebook as FacebookIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  PowerSettingsNew as PowerSettingsNewIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  QrCode as QrCodeIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import axios from 'axios';
import ConversationList from '../../components/ConversationList';
import ConversationChat from '../../components/ConversationChat';

// Componente para exibir QR Code
const QRCodeDisplay = ({ qrCode, refreshQR }) => {
  const [countdown, setCountdown] = useState(60);
  
  useEffect(() => {
    if (!qrCode) return;
    
    // Iniciar countdown
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [qrCode]);
  
  if (!qrCode) return null;
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        textAlign: 'center',
        borderRadius: 4,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.03) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.12)',
        backdropFilter: 'blur(8px)',
        maxWidth: 500,
        mx: 'auto',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: 6, 
          bgcolor: 'primary.light',
          opacity: 0.7,
        }}
      >
        <Box 
          sx={{ 
            height: '100%',
            width: `${(countdown / 60) * 100}%`,
            bgcolor: 'primary.main',
            borderRadius: '0 3px 3px 0',
            transition: 'width 1s linear'
          }}
        />
      </Box>
      
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          fontWeight: 600, 
          mb: 1,
          background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px',
        }}
      >
        Conecte seu WhatsApp
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
        Escaneie o QR code com seu celular para conectar sua conta WhatsApp (válido por {countdown} segundos)
      </Typography>
      
      <Box 
        sx={{ 
          m: 'auto', 
          mb: 3, 
          p: 2, 
          bgcolor: 'white', 
          width: 'fit-content', 
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -5,
            left: -5,
            right: -5,
            bottom: -5,
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            zIndex: -1,
            borderRadius: 4,
            opacity: 0.2,
          }
        }}
      >
        <img 
          src={`data:image/png;base64,${qrCode}`} 
          alt="QR Code WhatsApp" 
          style={{ 
            width: 220, 
            height: 220, 
            display: 'block',
          }} 
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={refreshQR}
          startIcon={<RefreshIcon />}
          size="large"
          sx={{ 
            borderRadius: 2, 
            px: 3,
            fontWeight: 600,
            borderColor: 'rgba(99, 102, 241, 0.5)',
            '&:hover': {
              borderColor: '#6366F1',
              backgroundColor: 'rgba(99, 102, 241, 0.04)'
            }
          }}
        >
          Gerar Novo QR Code
        </Button>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon sx={{ fontSize: 16, mr: 0.5, color: 'info.main' }} /> 
          Mantenha esta página aberta até concluir a conexão
        </Typography>
      </Box>
    </Paper>
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

// Componente personalizado TabPanel
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

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
  
  // Função para verificar e atualizar o status do canal
  const checkConnectionStatus = useCallback(async (attemptNumber = 1) => {
    if (!id || !channel || channel.type !== 'whatsapp') return;
    
    try {
      // Limitar o número total de verificações para evitar loop infinito
      if (attemptNumber > 60) {
        console.log('Número máximo de verificações atingido', attemptNumber);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`/api/channels/whatsapp/${id}/status`, { 
        timeout: 5000 // 5 segundos de timeout
      });
      
      // Verificamos dados da API (pode variar conforme estrutura)
      const newStatus = response.data.data?.status || response.data.status;
      
      // Lógica para determinar frequência de polling:
      // - Mais frequente durante conexão inicial (a cada 2 segundos)
      // - Menos frequente quando já estabilizado (a cada 5 segundos)
      const nextDelay = (attemptNumber < 10 || 
                       newStatus === 'connecting' || 
                       newStatus === 'qr_ready') ? 2000 : 5000;
      
      // Se o status mudou, atualizamos o canal localmente
      if (newStatus && channel.status !== newStatus) {
        setChannel(prev => ({ ...prev, status: newStatus }));
        
        // Se conectado, podemos parar o polling ou continuar com intervalo maior
        if (newStatus === 'connected') {
          console.log('WhatsApp conectado com sucesso!');
          setSnackbar({
            open: true,
            message: 'WhatsApp conectado com sucesso!',
            severity: 'success'
          });
          setLoading(false);
        } 
        // Se desconectado após tentar conectar, mostramos o erro
        else if (newStatus === 'disconnected' && attemptNumber > 3) {
          console.log('Não foi possível conectar o WhatsApp');
          setSnackbar({
            open: true,
            message: 'Não foi possível conectar o WhatsApp. Tente novamente.',
            severity: 'error'
          });
          setLoading(false);
        }
        // Se em erro, paramos o polling e mostramos o erro
        else if (newStatus === 'error') {
          console.error('Erro na conexão do WhatsApp');
          setSnackbar({
            open: true,
            message: 'Erro na conexão do WhatsApp. Tente novamente.',
            severity: 'error'
          });
          setLoading(false);
          return; // Não continuamos o polling
        }
      }
      
      // Continuar verificando o status (recursive polling with timeout)
      setTimeout(() => {
        // Apenas continuamos o polling se o canal não estiver em estado "final" 
        // ou se ainda estivermos nas primeiras verificações
        if (attemptNumber < 10 || 
            (newStatus !== 'connected' && newStatus !== 'error' && newStatus !== 'disconnected')) {
          checkConnectionStatus(attemptNumber + 1);
        } else {
          setLoading(false);
        }
      }, nextDelay);
      
    } catch (err) {
      console.error('Erro ao verificar status da conexão:', err);
      
      // Apenas mostramos erro após algumas tentativas, para evitar alertas prematuros
      if (attemptNumber > 3) {
        setSnackbar({
          open: true,
          message: 'Erro ao verificar status da conexão. ' + (err.response?.data?.message || err.message),
          severity: 'error'
        });
        setLoading(false);
      } else {
        // Se for erro nas primeiras tentativas, continuamos o polling com backoff
        const nextDelay = Math.min(2000 * Math.pow(1.5, attemptNumber - 1), 10000);
        setTimeout(() => checkConnectionStatus(attemptNumber + 1), nextDelay);
      }
    }
  }, [id, channel]);
  
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
    if (!channel || !id) return;
    
    setLoading(true);
    
    try {
      // Conectar ou desconectar canal WhatsApp
      if (channel.type === 'whatsapp') {
        if (channel.status === 'connected') {
          // Desconectar
          const response = await axios.post(`/api/channels/whatsapp/${id}/disconnect`);
          
          if (response.data.success) {
            setSnackbar({
              open: true,
              message: 'Canal desconectado com sucesso',
              severity: 'success'
            });
            setChannel(prev => ({ ...prev, status: 'disconnected' }));
            setQrCode(null);
          } else {
            throw new Error(response.data.message || 'Não foi possível desconectar o canal');
          }
        } else {
          // Conectar
          const response = await axios.post(`/api/channels/whatsapp/${id}/connect`);
          
          if (response.data.success) {
            setSnackbar({
              open: true,
              message: 'Iniciando conexão...',
              severity: 'info'
            });
            
            // Atualizar status para conectando
            setChannel(prev => ({ ...prev, status: 'connecting' }));
            
            // Buscar QR Code
            const qrCodeData = await fetchWhatsAppQR(id);
            if (qrCodeData) {
              setQrCode(qrCodeData);
            }
            
            // Iniciar verificação de status
            checkConnectionStatus();
          } else {
            throw new Error(response.data.message || 'Não foi possível iniciar a conexão');
          }
        }
      }
      // Outros tipos de canais podem ser implementados aqui
      
    } catch (err) {
      console.error('Erro ao alternar conexão:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao alternar conexão: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
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
  
  // Função para atualizar manualmente o QR Code
  const handleRefreshQR = async () => {
    if (id && channel?.type === 'whatsapp') {
      try {
        setSnackbar({
          open: true,
          message: 'Solicitando novo QR Code...',
          severity: 'info'
        });
        
        // Primeiro verificamos o status atual do canal
        const statusResponse = await axios.get(`/api/channels/whatsapp/${id}/status`);
        const currentStatus = statusResponse.data.data?.status || statusResponse.data.status;
        
        // Se estiver em um estado que permita atualização do QR code
        if (currentStatus === 'qr_ready' || currentStatus === 'connecting' || currentStatus === 'disconnected') {
          // Opcionalmente podemos reiniciar a conexão
          if (currentStatus === 'disconnected') {
            await axios.post(`/api/channels/whatsapp/${id}/connect`);
            // Esperar um pouco para que o backend gere um novo QR code
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          const newQrResponse = await fetchWhatsAppQR(id);
          if (newQrResponse) {
            setQrCode(newQrResponse);
            setSnackbar({
              open: true,
              message: 'QR Code atualizado com sucesso',
              severity: 'success'
            });
          } else {
            setSnackbar({
              open: true,
              message: 'Não foi possível obter um novo QR Code',
              severity: 'error'
            });
          }
        } else {
          setSnackbar({
            open: true,
            message: `Não é possível atualizar o QR Code no estado atual (${currentStatus})`,
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar QR Code:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao atualizar QR Code: ' + error.message,
          severity: 'error'
        });
      }
    }
  };
  
  // Função para buscar QR code do WhatsApp com retry
  const fetchWhatsAppQR = async (channelId, retryCount = 0) => {
    try {
      const response = await axios.get(`/api/channels/whatsapp/${channelId}/qr-code`, { 
        timeout: 10000 // 10 segundos de timeout
      });
      
      if (response.data && (response.data.data?.qrcode || response.data.qrcode)) {
        // Tratamento normalizado para diferentes estruturas de resposta
        const qrCode = response.data.data?.qrcode || response.data.qrcode;
        return qrCode;
      } else if (response.data && response.data.error) {
        // Caso a API retorne um erro explícito
        console.error('Erro retornado pela API:', response.data.error);
        setSnackbar({
          open: true,
          message: `Erro ao obter QR Code: ${response.data.error || response.data.message || 'Erro desconhecido'}`,
          severity: 'error'
        });
        return null;
      } else {
        // Resposta sem erro explícito mas sem o qrcode esperado
        console.error('Resposta inválida ao buscar QR Code:', response.data);
        
        // Tenta novamente se estiver dentro do limite de retentativas
        if (retryCount < 3) {
          console.log(`Tentando novamente obter QR Code (${retryCount + 1}/3)...`);
          
          // Espera exponencial entre retentativas (500ms, 1000ms, 2000ms)
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, retryCount)));
          return fetchWhatsAppQR(channelId, retryCount + 1);
        } else {
          setSnackbar({
            open: true,
            message: 'Não foi possível obter o QR Code após várias tentativas',
            severity: 'error'
          });
          return null;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar QR Code:', err);
      
      // Tratamento específico para timeout
      if (err.code === 'ECONNABORTED') {
        setSnackbar({
          open: true,
          message: 'Tempo limite excedido ao buscar QR Code. O servidor pode estar sobrecarregado.',
          severity: 'error'
        });
      } 
      // Tratamento para erros HTTP com resposta
      else if (err.response) {
        setSnackbar({
          open: true,
          message: `Erro ao buscar QR Code: ${err.response.data?.message || err.response.statusText || err.message}`,
          severity: 'error'
        });
      } 
      // Erro de conexão ou rede
      else if (err.request) {
        setSnackbar({
          open: true,
          message: 'Erro de conexão ao buscar QR Code. Verifique sua conexão com a internet.',
          severity: 'warning'
        });
      } 
      // Outros erros
      else {
        setSnackbar({
          open: true,
          message: `Erro ao buscar QR Code: ${err.message}`,
          severity: 'error'
        });
      }
      
      // Tenta novamente se estiver dentro do limite de retentativas
      if (retryCount < 3) {
        console.log(`Tentando novamente após erro (${retryCount + 1}/3)...`);
        
        // Espera exponencial entre retentativas (1s, 2s, 4s)
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        return fetchWhatsAppQR(channelId, retryCount + 1);
      }
      
      return null;
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/channels')}
          sx={{ 
            mr: 2,
            borderColor: 'rgba(0, 0, 0, 0.12)',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.24)',
              backgroundColor: 'rgba(0, 0, 0, 0.02)'
            }
          }}
        >
          Voltar
        </Button>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 600,
            background: 'linear-gradient(90deg, #111827 0%, #374151 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {channel?.name || 'Detalhes do Canal'}
        </Typography>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />} 
          onClick={() => setOpenDeleteDialog(true)}
          sx={{ 
            borderColor: 'rgba(239, 68, 68, 0.5)',
            '&:hover': {
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.04)'
            }
          }}
        >
          Excluir
        </Button>
      </Box>
      
      {/* Barra de status de conexão */}
      {channel?.type === 'whatsapp' && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            background: 'white',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  mr: 2,
                  background: 
                    channel.status === 'connected' 
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                      : (channel.status === 'connecting' || channel.status === 'qr_ready') 
                        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                        : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  boxShadow: 
                    channel.status === 'connected' 
                      ? '0 0 8px rgba(16, 185, 129, 0.6)' 
                      : (channel.status === 'connecting' || channel.status === 'qr_ready')
                        ? '0 0 8px rgba(245, 158, 11, 0.6)'
                        : '0 0 8px rgba(239, 68, 68, 0.6)',
                  animation: (channel.status === 'connecting' || channel.status === 'qr_ready')
                    ? 'pulse 2s infinite'
                    : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)'
                    },
                    '70%': {
                      boxShadow: '0 0 0 6px rgba(245, 158, 11, 0)'
                    },
                    '100%': {
                      boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)'
                    }
                  }
                }}
              />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                  Status do Canal
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {channel.status === 'connected' ? 'Conectado' :
                  channel.status === 'connecting' ? 'Conectando...' :
                  channel.status === 'qr_ready' ? 'Aguardando escaneamento do QR Code' :
                  channel.status === 'disconnected' ? 'Desconectado' :
                  channel.status === 'error' ? 'Erro de conexão' : channel.status}
                </Typography>
              </Box>
            </Box>
            
            {/* Botões contextuais baseados no status */}
            {channel.status === 'connected' && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleToggleConnection}
                startIcon={<CloseIcon />}
                disabled={loading}
                sx={{ 
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  '&:hover': {
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.04)'
                  }
                }}
              >
                Desconectar
              </Button>
            )}
            
            {(channel.status === 'disconnected' || channel.status === 'error') && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleToggleConnection}
                startIcon={<PowerSettingsNewIcon />}
                disabled={loading}
                sx={{ 
                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
                  }
                }}
              >
                Conectar
              </Button>
            )}
            
            {(channel.status === 'connecting' || channel.status === 'qr_ready') && (
              <Button
                variant="outlined"
                color="warning"
                onClick={handleToggleConnection}
                startIcon={<CancelIcon />}
                disabled={loading}
                sx={{ 
                  borderColor: 'rgba(245, 158, 11, 0.5)',
                  color: '#D97706',
                  '&:hover': {
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.04)'
                  }
                }}
              >
                Cancelar Conexão
              </Button>
            )}
          </Box>
          {loading && <LinearProgress sx={{ mt: 2, borderRadius: 1, height: 4 }} />}
        </Paper>
      )}
      
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
          <Box sx={{ mb: 4 }}>
            <QRCodeDisplay qrCode={qrCode} refreshQR={handleRefreshQR} />
          </Box>
        )}
      </Paper>
      
      {/* Tabs de conteúdo */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              px: 2, 
              backgroundColor: 'rgba(249, 250, 251, 0.7)',
              '& .MuiTab-root': {
                py: 2,
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
                mx: 1
              }
            }}
          >
            <Tab label="Configurações" icon={<SettingsIcon />} iconPosition="start" />
            <Tab label="Estatísticas" icon={<BarChartIcon />} iconPosition="start" />
            <Tab label="Eventos" icon={<HistoryIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {/* Tab de configurações */}
          <TabPanel value={tabValue} index={0}>
            {channel?.type === 'whatsapp' && channel?.status === 'qr_ready' && qrCode && (
              <Box sx={{ mb: 4 }}>
                <QRCodeDisplay qrCode={qrCode} refreshQR={handleRefreshQR} />
              </Box>
            )}
            
            <ChannelSettings 
              settings={channel?.settings} 
              onSave={handleSaveSettings} 
              readOnly={loading || !channel}
            />
          </TabPanel>
          
          {/* Tab de estatísticas */}
          <TabPanel value={tabValue} index={1}>
            <ChannelStats stats={stats} />
          </TabPanel>
          
          {/* Tab de mensagens */}
          <TabPanel value={tabValue} index={2}>
            <ChannelHistory events={events} />
          </TabPanel>
        </Box>
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
