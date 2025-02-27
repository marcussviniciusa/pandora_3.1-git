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
        
        // Em um cenário real, você buscaria dados da API
        // Simulando dados para demonstração
        
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dados simulados
        const mockChannels = [
          {
            id: 1,
            name: 'WhatsApp Principal',
            type: 'whatsapp',
            description: 'Canal principal de WhatsApp para atendimento',
            status: 'connected',
            createdAt: new Date(2023, 0, 15)
          },
          {
            id: 2,
            name: 'Instagram Oficial',
            type: 'instagram',
            description: 'Canal oficial do Instagram',
            status: 'connected',
            createdAt: new Date(2023, 1, 20)
          },
          {
            id: 3,
            name: 'WhatsApp Vendas',
            type: 'whatsapp',
            description: 'Canal de WhatsApp exclusivo para vendas',
            status: 'disconnected',
            createdAt: new Date(2023, 2, 10)
          }
        ];
        
        setChannels(mockChannels);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar canais:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao carregar canais',
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
      // Em um cenário real, você enviaria dados para a API
      // Simulando operação para demonstração
      
      // Simular atraso de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (dialogType === 'add') {
        // Simular adição de canal
        const newChannel = {
          id: Date.now(),
          ...formData,
          status: 'disconnected',
          createdAt: new Date()
        };
        
        setChannels(prev => [...prev, newChannel]);
        
        setSnackbar({
          open: true,
          message: 'Canal adicionado com sucesso',
          severity: 'success'
        });
      } else {
        // Simular edição de canal
        setChannels(prev => 
          prev.map(ch => 
            ch.id === selectedChannel.id 
              ? { ...ch, ...formData } 
              : ch
          )
        );
        
        setSnackbar({
          open: true,
          message: 'Canal atualizado com sucesso',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar canal:', error);
      setSnackbar({
        open: true,
        message: `Erro ao ${dialogType === 'add' ? 'adicionar' : 'atualizar'} canal`,
        severity: 'error'
      });
    }
  };
  
  // Excluir canal
  const handleDeleteChannel = async (channel) => {
    if (!window.confirm(`Tem certeza que deseja excluir o canal "${channel.name}"?`)) {
      return;
    }
    
    try {
      // Em um cenário real, você enviaria uma requisição para a API
      // Simulando operação para demonstração
      
      // Simular atraso de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remover canal da lista
      setChannels(prev => prev.filter(ch => ch.id !== channel.id));
      
      setSnackbar({
        open: true,
        message: 'Canal excluído com sucesso',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir canal:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir canal',
        severity: 'error'
      });
    }
  };
  
  // Conectar/desconectar canal
  const handleToggleConnection = async (channel) => {
    try {
      // Em um cenário real, você enviaria uma requisição para a API
      // Simulando operação para demonstração
      
      // Simular atraso de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar status do canal
      setChannels(prev => 
        prev.map(ch => 
          ch.id === channel.id 
            ? { 
                ...ch, 
                status: ch.status === 'connected' ? 'disconnected' : 'connected' 
              } 
            : ch
        )
      );
      
      setSnackbar({
        open: true,
        message: `Canal ${channel.status === 'connected' ? 'desconectado' : 'conectado'} com sucesso`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao alterar conexão do canal:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao alterar conexão do canal',
        severity: 'error'
      });
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
