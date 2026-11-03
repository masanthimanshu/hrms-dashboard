import { useState, useEffect, type FC } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import {
  apiService,
  BASE_URL,
  hasConfiguredAccountId,
  notify,
  type BackendHealthState,
} from "../services/api";

export const SettingsPage: FC = () => {
  const [testing, setTesting] = useState(false);
  const [healthState, setHealthState] = useState<BackendHealthState | null>(
    null,
  );

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await apiService.testHealth();
      setHealthState(result);
      if (result.rootHealth)
        notify("Backend health check completed", "success");
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    let active = true;
    apiService.testHealth().then((result) => {
      if (active) {
        setHealthState(result);
        if (result.rootHealth)
          notify("Backend health check completed", "success");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const healthItems = [
    { label: "Root Gateway (GET /health)", ok: healthState?.rootHealth },
    {
      label: "Store Route Guard (/account/store/*)",
      ok: healthState?.storeHealth,
    },
    {
      label: "Admin Route Guard (/account/admin/*)",
      ok: healthState?.adminHealth,
    },
    { label: "JWT Token Service (/jwt/*)", ok: healthState?.jwtHealth },
  ];

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 840 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          borderRadius: 3.5,
          bgcolor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.015em",
            mb: 0.5,
          }}
        >
          Live API & Backend Credentials
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
          Connection status to your live backend at{" "}
          <strong>{BASE_URL || "configured endpoint"}</strong>.
        </Typography>

        {/* Credentials Status */}
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            bgcolor: hasConfiguredAccountId
              ? "rgba(22, 163, 74, 0.05)"
              : "rgba(217, 119, 6, 0.05)",
            border: `1px solid ${hasConfiguredAccountId ? "rgba(22, 163, 74, 0.2)" : "rgba(217, 119, 6, 0.2)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <SecurityRoundedIcon
              sx={{
                color: hasConfiguredAccountId ? "#16a34a" : "#d97706",
                fontSize: 26,
              }}
            />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "#0f172a" }}
              >
                Administrative Credentials:{" "}
                {hasConfiguredAccountId
                  ? "Active & Configured"
                  : "Not Detected in .env"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Your administrative secret is securely attached to all
                authorized requests.
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={testConnection}
            disabled={testing}
            startIcon={<RefreshRoundedIcon fontSize="small" />}
            sx={{ borderRadius: 2 }}
          >
            {testing ? "Testing..." : "Re-sync"}
          </Button>
        </Box>

        {/* Diagnostic Health */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, color: "#0f172a" }}
          >
            Diagnostic Health Probes
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={testConnection}
            disabled={testing}
            startIcon={
              testing ? (
                <CircularProgress size={14} />
              ) : (
                <RefreshRoundedIcon fontSize="small" />
              )
            }
          >
            {testing ? "Testing..." : "Re-run"}
          </Button>
        </Box>

        {healthState && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {healthItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  bgcolor: item.ok
                    ? "rgba(22, 163, 74, 0.04)"
                    : "rgba(220, 38, 38, 0.04)",
                  border: `1px solid ${item.ok ? "rgba(22, 163, 74, 0.15)" : "rgba(220, 38, 38, 0.15)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#334155" }}
                >
                  {item.label}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {item.ok ? (
                    <CheckCircleRoundedIcon
                      sx={{ fontSize: 18, color: "#16a34a" }}
                    />
                  ) : (
                    <ErrorOutlineRoundedIcon
                      sx={{ fontSize: 18, color: "#dc2626" }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: item.ok ? "#16a34a" : "#dc2626",
                      fontSize: "0.825rem",
                    }}
                  >
                    {item.ok ? "200 OK (Running)" : "Unavailable"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
