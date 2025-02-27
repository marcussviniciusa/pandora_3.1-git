import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const AuthContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(2),
}));

const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 450,
  width: '100%',
  borderRadius: 16,
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
}));

const Logo = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  marginBottom: theme.spacing(2),
}));

function AuthLayout() {
  return (
    <AuthContainer maxWidth="sm">
      <AuthPaper elevation={3}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Logo src="/logo192.png" alt="Pandora Logo" />
          <Typography variant="h4" component="h1" gutterBottom>
            Pandora 3.1
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sistema de Gerenciamento de Mensagens Multicanal
          </Typography>
        </Box>
        
        <Outlet />
      </AuthPaper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Pandora 3.1 - Todos os direitos reservados
        </Typography>
      </Box>
    </AuthContainer>
  );
}

export default AuthLayout;
