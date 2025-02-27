import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Paper,
  Divider,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Telegram as TelegramIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Message as MessageIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

// Componente para exibir o QR Code quando necessário
const QRCodeDisplay = ({ qrCode }) => {
  if (!qrCode) return null;
  
  return (
    <Box sx={{ textAlign: 'center', my: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Escaneie o QR Code com seu WhatsApp para conectar
      </Typography>
      <Box sx={{ 
        display: 'inline-block', 
        p: 2, 
        bgcolor: 'white', 
        borderRadius: 1,
        boxShadow: 1
      }}>
        <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" style={{ width: 256, height: 256 }} />
      </Box>
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
      
      if (channel.status === 'connected') {
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
        const response = await axios.post(`/api/channels/${id}/connect`);
        
        if (response.data.qrCode) {
          setQrCode(response.data.qrCode);
        }
        
        setChannel(prev => ({ ...prev, status: response.data.status }));
        setSnackbar({
          open: true,
          message: response.data.qrCode 
            ? 'Escaneie o QR Code para conectar' 
            : 'Canal conectado com sucesso',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Erro ao alterar conexão do canal:', err);
      setSnackbar({
        open: true,
        message: `Erro ao ${channel.status === 'connected' ? 'desconectar' : 'conectar'} o canal`,
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
                  {channel?.type.charAt(0).toUpperCase() + channel?.type.slice(1)}
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
          <QRCodeDisplay qrCode={qrCode} />
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
          <Tab label="Configurações" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Histórico" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {/* Conteúdo da aba de estatísticas */}
          {tabValue === 0 && (
            <ChannelStats stats={stats} />
          )}
          
          {/* Conteúdo da aba de configurações */}
          {tabValue === 1 && (
            <ChannelSettings 
              settings={channel?.connection_data} 
              onSave={handleSaveSettings}
              readOnly={channel?.status === 'connected'}
            />
          )}
          
          {/* Conteúdo da aba de histórico */}
          {tabValue === 2 && (
            <ChannelHistory events={events} />
          )}
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
