import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#EC4899',
      light: '#F472B6',
      dark: '#DB2777',
      contrastText: '#ffffff',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#F9FAFB',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      fontWeight: 600,
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(31, 41, 55, 0.06)',
    '0px 4px 6px rgba(31, 41, 55, 0.08)',
    '0px 5px 8px rgba(31, 41, 55, 0.08)',
    '0px 8px 16px rgba(31, 41, 55, 0.08)',
    '0px 10px 20px rgba(31, 41, 55, 0.08)',
    '0px 12px 24px rgba(31, 41, 55, 0.08)',
    '0px 14px 28px rgba(31, 41, 55, 0.08)',
    '0px 16px 32px rgba(31, 41, 55, 0.08)',
    '0px 18px 36px rgba(31, 41, 55, 0.08)',
    '0px 20px 40px rgba(31, 41, 55, 0.08)',
    '0px 22px 44px rgba(31, 41, 55, 0.08)',
    '0px 24px 48px rgba(31, 41, 55, 0.08)',
    '0px 26px 52px rgba(31, 41, 55, 0.08)',
    '0px 28px 56px rgba(31, 41, 55, 0.08)',
    '0px 30px 60px rgba(31, 41, 55, 0.08)',
    '0px 32px 64px rgba(31, 41, 55, 0.08)',
    '0px 34px 68px rgba(31, 41, 55, 0.08)',
    '0px 36px 72px rgba(31, 41, 55, 0.08)',
    '0px 38px 76px rgba(31, 41, 55, 0.08)',
    '0px 40px 80px rgba(31, 41, 55, 0.08)',
    '0px 42px 84px rgba(31, 41, 55, 0.08)',
    '0px 44px 88px rgba(31, 41, 55, 0.08)',
    '0px 46px 92px rgba(31, 41, 55, 0.08)',
    '0px 48px 96px rgba(31, 41, 55, 0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          boxShadow: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          },
          '&.MuiButton-containedSecondary': {
            background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
          },
          overflow: 'hidden',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: 16,
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
          backgroundImage: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: 'rgba(99, 102, 241, 0.04)',
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 48,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #fff',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '4px 0 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          padding: '10px 12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
            },
            '& .MuiListItemIcon-root': {
              color: '#6366F1',
            },
          },
        },
      },
    },
  },
});

export default theme;
