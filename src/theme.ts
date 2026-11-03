import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      light: "#60a5fa",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#475569",
      light: "#64748b",
      dark: "#334155",
    },
    success: {
      main: "#16a34a",
      light: "#86efac",
      dark: "#15803d",
    },
    warning: {
      main: "#d97706",
      light: "#fcd34d",
      dark: "#b45309",
    },
    error: {
      main: "#dc2626",
      light: "#fca5a5",
      dark: "#b91c1c",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: [
      '"Plus Jakarta Sans"',
      "system-ui",
      "-apple-system",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontWeight: 800, letterSpacing: "-0.025em" },
    h3: { fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.015em" },
    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontSize: "0.95rem", fontWeight: 600 },
    subtitle2: { fontSize: "0.85rem", fontWeight: 600, color: "#64748b" },
    body1: { fontSize: "0.925rem", lineHeight: 1.55 },
    body2: { fontSize: "0.85rem", lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily:
            '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
          color: "#0f172a",
          backgroundColor: "#f8fafc",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "::-webkit-scrollbar": {
          width: "6px",
          height: "6px",
        },
        "::-webkit-scrollbar-thumb": {
          background: "#cbd5e1",
          borderRadius: "3px",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "7px 16px",
          boxShadow: "none",
          whiteSpace: "nowrap",
          transition: "all 0.15s ease",
          "&:hover": {
            boxShadow: "none",
          },
        },
        contained: {
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          color: "#ffffff",
          boxShadow:
            "0 2px 6px rgba(15, 23, 42, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          "&:hover": {
            background: "linear-gradient(180deg, #334155 0%, #1e293b 100%)",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.3)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        outlined: {
          borderColor: "#e2e8f0",
          color: "#334155",
          backgroundColor: "#ffffff",
          "&:hover": {
            borderColor: "#cbd5e1",
            backgroundColor: "#f8fafc",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 14,
        },
        elevation1: {
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "13px 18px",
          borderColor: "#f1f5f9",
          fontSize: "0.875rem",
        },
        head: {
          backgroundColor: "#f8fafc",
          color: "#475569",
          fontWeight: 700,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.12s ease",
          "&:hover": {
            backgroundColor: "rgba(241, 245, 249, 0.6)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          fontSize: "0.75rem",
          height: 24,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
  },
});
