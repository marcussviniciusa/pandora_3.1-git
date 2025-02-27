import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const NotFoundContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  textAlign: 'center',
  padding: theme.spacing(2),
}));

const ErrorCode = styled(Typography)(({ theme }) => ({
  fontSize: '10rem',
  fontWeight: 700,
  marginBottom: theme.spacing(2),
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

function NotFoundPage() {
  return (
    <NotFoundContainer maxWidth="md">
      <ErrorCode variant="h1">404</ErrorCode>
      
      <Typography variant="h4" component="h2" gutterBottom>
        Página não encontrada
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        A página que você está procurando não existe ou foi movida.
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/"
          size="large"
        >
          Voltar para a página inicial
        </Button>
      </Box>
    </NotFoundContainer>
  );
}

export default NotFoundPage;
