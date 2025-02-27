import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Paper,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Message as MessageIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(4),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundImage: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
  backgroundColor: 'rgba(99, 102, 241, 0.03)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
}));

const LogoContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 0',
});

const LogoTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '0.5px',
}));

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };
  
  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Canais', icon: <LinkIcon />, path: '/channels' },
    { text: 'Conversas', icon: <MessageIcon />, path: '/conversations' },
    { text: 'Webhooks', icon: <SettingsIcon />, path: '/webhooks' }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ 
              mr: 2, 
              ...(open && { display: 'none' }),
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            Pandora 3.1
          </Typography>
          
          <IconButton 
            color="inherit"
            sx={{
              mr: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Box sx={{ ml: 1 }}>
            <IconButton
              size="medium"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                padding: '8px'
              }}
            >
              {user?.avatar ? (
                <Avatar 
                  src={user.avatar} 
                  alt={user.name}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    border: '2px solid #fff',
                  }}
                />
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 2,
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    my: 0.5,
                    borderRadius: 1,
                    mx: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.08)'
                    }
                  }
                }
              }}
            >
              <MenuItem onClick={handleProfile}>Meu Perfil</MenuItem>
              <MenuItem onClick={handleLogout}>Sair</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(180deg, rgba(249, 250, 251, 0.7) 0%, rgba(255, 255, 255, 1) 100%)',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <LogoContainer>
            <Box sx={{ 
              width: 35, 
              height: 35, 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)'
            }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>P</Typography>
            </Box>
            <LogoTypography variant="h5">Pandora</LogoTypography>
          </LogoContainer>
          <IconButton onClick={handleDrawerClose} sx={{ 
            '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
            borderRadius: 1.5
          }}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ opacity: 0.1 }} />
        <Box sx={{ p: 2, mb: 1 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              ml: 1, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Menu Principal
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      height: '60%',
                      width: 4,
                      backgroundColor: '#6366F1',
                      borderRadius: '0 4px 4px 0',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}
                selected={window.location.pathname.includes(item.path)}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: window.location.pathname.includes(item.path) ? '#6366F1' : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographySx={{ 
                    fontWeight: window.location.pathname.includes(item.path) ? 600 : 500,
                    fontSize: '0.95rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ p: 2, mt: 2 }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(79, 70, 229, 0.06) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Precisa de ajuda?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
              Acesse nossa documentação para tirar suas dúvidas.
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              fullWidth
              sx={{ 
                borderColor: 'rgba(99, 102, 241, 0.5)',
                color: '#6366F1',
                '&:hover': {
                  borderColor: '#6366F1',
                  backgroundColor: 'rgba(99, 102, 241, 0.04)'
                }
              }}
            >
              Ver Documentação
            </Button>
          </Paper>
        </Box>
      </Drawer>
      
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
}

export default MainLayout;
