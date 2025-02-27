import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Telegram as TelegramIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import axios from 'axios';

function ChannelsPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add' ou 'edit'
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'whatsapp',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Carregar canais
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/channels');
        
        if (response.data && !response.data.error) {
          setChannels(response.data.data || response.data);
        } else {
          throw new Error(response.data.message || 'Erro ao carregar canais');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar canais:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao carregar canais: ' + (error.response?.data?.message || error.message),
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchChannels();
  }, []);
  
  // Abrir diálogo para adicionar canal
  const handleAddChannel = () => {
    setDialogType('add');
    setFormData({
      name: '',
      type: 'whatsapp',
      description: ''
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  // Abrir diálogo para editar canal
  const handleEditChannel = (channel) => {
    setDialogType('edit');
    setSelectedChannel(channel);
    setFormData({
      name: channel.name,
      type: channel.type,
      description: channel.description
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  // Fechar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Atualizar dados do formulário
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.type) {
      errors.type = 'Tipo é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Salvar canal
  const handleSaveChannel = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      let response;
      
      if (dialogType === 'add') {
        // Criar novo canal
        response = await axios.post('/api/channels', formData);
        
        if (response.data && !response.data.error) {
          const newChannel = response.data.data || response.data;
          setChannels(prev => [...prev, newChannel]);
          
          setSnackbar({
            open: true,
            message: 'Canal criado com sucesso',
            severity: 'success'
          });
        }
      } else {
        // Atualizar canal existente
        response = await axios.put(`/api/channels/${selectedChannel.id}`, formData);
        
        if (response.data && !response.data.error) {
          const updatedChannel = response.data.data || response.data;
          
          setChannels(prev => 
            prev.map(ch => ch.id === selectedChannel.id ? updatedChannel : ch)
          );
          
          setSnackbar({
            open: true,
            message: 'Canal atualizado com sucesso',
            severity: 'success'
          });
        }
      }
      
      setOpenDialog(false);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao salvar canal:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar canal: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  // Excluir canal
  const handleDeleteChannel = async (channel) => {
    if (!window.confirm(`Tem certeza que deseja excluir o canal "${channel.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.delete(`/api/channels/${channel.id}`);
      
      if (response.data && !response.data.error) {
        setChannels(prev => prev.filter(ch => ch.id !== channel.id));
        
        setSnackbar({
          open: true,
          message: 'Canal excluído com sucesso',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Erro ao excluir canal');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao excluir canal:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir canal: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  // Conectar/desconectar canal
  const handleToggleConnection = async (channel) => {
    try {
      setLoading(true);
      
      const response = await axios.put(`/api/channels/${channel.id}/toggle-connection`);
      
      if (response.data && !response.data.error) {
        const updatedChannel = response.data.data || response.data;
        
        setChannels(prev => 
          prev.map(ch => ch.id === channel.id ? updatedChannel : ch)
        );
        
        setSnackbar({
          open: true,
          message: `Canal ${channel.status === 'connected' ? 'desconectado' : 'conectado'} com sucesso`,
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Erro ao alterar conexão do canal');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao alterar conexão do canal:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao alterar conexão do canal: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  // Visualizar detalhes do canal
  const handleViewChannel = (channelId) => {
    navigate(`/channels/${channelId}`);
  };
  
  // Fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Obter ícone do canal com base no tipo
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
        return <LinkIcon />;
    }
  };
  
  // Obter cor do canal com base no tipo
  const getChannelColor = (type) => {
    switch (type) {
      case 'whatsapp':
        return '#25D366';
      case 'instagram':
        return '#E1306C';
      case 'facebook':
        return '#4267B2';
      case 'telegram':
        return '#0088cc';
      default:
        return '#757575';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Canais</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddChannel}
        >
          Adicionar Canal
        </Button>
      </Box>
      
      {channels.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum canal encontrado
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Clique no botão "Adicionar Canal" para começar.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddChannel}
          >
            Adicionar Canal
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {channels.map((channel) => (
            <Grid item xs={12} sm={6} md={4} key={channel.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderTop: `4px solid ${getChannelColor(channel.type)}`
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        backgroundColor: `${getChannelColor(channel.type)}20`,
                        color: getChannelColor(channel.type),
                        mr: 2
                      }}
                    >
                      {getChannelIcon(channel.type)}
                    </Box>
                    <Box>
                      <Typography variant="h6" component="div">
                        {channel.name}
                      </Typography>
                      <Chip
                        label={channel.status === 'connected' ? 'Conectado' : 'Desconectado'}
                        color={channel.status === 'connected' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {channel.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleToggleConnection(channel)}
                      color={channel.status === 'connected' ? 'error' : 'success'}
                    >
                      {channel.status === 'connected' ? <LinkOffIcon /> : <LinkIcon />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditChannel(channel)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteChannel(channel)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Button 
                    size="small" 
                    onClick={() => handleViewChannel(channel.id)}
                  >
                    Detalhes
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Diálogo para adicionar/editar canal */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'add' ? 'Adicionar Canal' : 'Editar Canal'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nome do Canal"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            fullWidth
            error={!!formErrors.name}
            helperText={formErrors.name}
            autoFocus
          />
          <TextField
            select
            margin="dense"
            label="Tipo de Canal"
            name="type"
            value={formData.type}
            onChange={handleFormChange}
            fullWidth
            error={!!formErrors.type}
            helperText={formErrors.type}
          >
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="instagram">Instagram</MenuItem>
            <MenuItem value="facebook">Facebook</MenuItem>
            <MenuItem value="telegram">Telegram</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Descrição"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveChannel} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ChannelsPage;
