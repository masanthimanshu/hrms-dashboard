/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Clean modern blue
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#475569',
      light: '#64748b',
      dark: '#334155',
    },
    success: {
      main: '#16a34a', // Emerald
      light: '#86efac',
      dark: '#15803d',
    },
    warning: {
      main: '#d97706', // Amber
      light: '#fcd34d',
      dark: '#b45309',
    },
    error: {
      main: '#dc2626', // Crimson
      light: '#fca5a5',
      dark: '#b91c1c',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'].join(','),
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.005em' },
    subtitle1: { fontSize: '0.95rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.85rem', fontWeight: 500, color: '#64748b' },
    body1: { fontSize: '0.925rem', lineHeight: 1.55 },
    body2: { fontSize: '0.85rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#0f172a',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1e293b',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderColor: '#f1f5f9',
          fontSize: '0.875rem',
        },
        head: {
          backgroundColor: '#f8fafc',
          color: '#475569',
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          fontSize: '0.75rem',
          height: 24,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
});
