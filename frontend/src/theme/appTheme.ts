import { createTheme, responsiveFontSizes } from '@mui/material/styles'

let appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#58c6ff',
      main: '#1570ef',
      dark: '#155eef',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#ffd9a8',
      main: '#f79009',
      dark: '#dc6803',
      contrastText: '#1f2937',
    },
    success: {
      light: '#dcfae6',
      main: '#16a34a',
      dark: '#15803d',
    },
    warning: {
      light: '#fef3c7',
      main: '#d97706',
      dark: '#b45309',
    },
    error: {
      light: '#fee2e2',
      main: '#dc2626',
      dark: '#b91c1c',
    },
    background: {
      default: '#f6f8fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475467',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Manrope", "Plus Jakarta Sans", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontFamily: '"Manrope", "Plus Jakarta Sans", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Manrope", "Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          background:
            'radial-gradient(circle at 10% 10%, rgba(21,112,239,0.08), transparent 45%), radial-gradient(circle at 90% 15%, rgba(247,144,9,0.10), transparent 40%), #f6f8fb',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 18,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          fontWeight: 700,
        },
      },
    },
  },
})

appTheme = responsiveFontSizes(appTheme)

export { appTheme }
