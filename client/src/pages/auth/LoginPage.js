import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

// Esquema de validação
const validationSchema = Yup.object({
  username: Yup.string()
    .required('Usuário é obrigatório'),
  password: Yup.string()
    .required('Senha é obrigatória')
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Formik para gerenciar o formulário
  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      const success = await login(values.username, values.password);
      if (success) {
        navigate('/dashboard');
      }
    }
  });
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TextField
        margin="normal"
        fullWidth
        id="username"
        name="username"
        label="Usuário"
        value={formik.values.username}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.username && Boolean(formik.errors.username)}
        helperText={formik.touched.username && formik.errors.username}
        autoComplete="username"
        autoFocus
      />
      
      <TextField
        margin="normal"
        fullWidth
        id="password"
        name="password"
        label="Senha"
        type={showPassword ? 'text' : 'password'}
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
        autoComplete="current-password"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        disabled={formik.isSubmitting}
      >
        {formik.isSubmitting ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Entrar'
        )}
      </Button>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Entre em contato com o administrador se você não conseguir acessar sua conta.
        </Typography>
      </Box>
    </Box>
  );
}

export default LoginPage;
