/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FC } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { useHrms } from "../context/HrmsContext";
import { apiService } from "../services/api";
import { BASE_URL } from "../config/env";
import type { BackendHealthState } from "../types";

export const SettingsPage: FC = () => {
  const { hasAccountId, refreshData, showNotification } = useHrms();
  const [testing, setTesting] = useState(false);
  const [healthState, setHealthState] = useState<BackendHealthState | null>(
    null,
  );

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await apiService.testHealth();
      setHealthState(result);
      if (result.rootHealth && result.storeHealth && result.authHealth) {
        showNotification(
          "All live backend endpoints authenticated successfully!",
          "success",
        );
      } else if (result.rootHealth && result.storeHealth === false) {
        showNotification(
          "Server reachable, but Account ID authorization was rejected.",
          "warning",
        );
      }
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    handleTestConnection();
  }, []);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 850 }}
    >
      <Paper elevation={1} sx={{ p: 3, borderRadius: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}
        >
          Live API & Backend Credentials
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5 }}>
          Connection status to your live backend at{" "}
          <strong>{BASE_URL || "configured endpoint"}</strong>.
        </Typography>

        {/* Server Secret Managed Alert */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: hasAccountId ? "#f0fdf4" : "#fffbeb",
            border: `1px solid ${hasAccountId ? "#bbf7d0" : "#fde68a"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <SecurityRoundedIcon
              sx={{ color: hasAccountId ? "#16a34a" : "#d97706", fontSize: 24 }}
            />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#0f172a" }}
              >
                Administrative Credentials:{" "}
                {hasAccountId
                  ? "Configured in Environment"
                  : "Not Detected in .env"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", display: "block" }}
              >
                Your administrative key is sourced securely from <code>.env</code> and
                automatically dispatched with authorized API calls.
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={async () => {
              await refreshData(false);
              await handleTestConnection();
            }}
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{ borderColor: "#cbd5e1", color: "#334155" }}
          >
            Re-sync
          </Button>
        </Box>

        <Alert
          severity="info"
          sx={{
            bgcolor: "#eff6ff",
            color: "#1e40af",
            border: "1px solid #bfdbfe",
            mb: 3,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Header Requirements for Administrative Actions
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#1e3a8a", display: "block", lineHeight: 1.4 }}
          >
            Administrative routes under <code>/account/*</code> (such as{" "}
            <code>/account/store/create</code>, <code>/account/store/get</code>,{" "}
            <code>/account/auth/users</code>, and{" "}
            <code>/account/auth/validate/:uid</code>) require authorization headers.
            The dashboard automatically dispatches these using the credentials
            configured in your environment.
          </Typography>
        </Alert>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#0f172a" }}
          >
            Diagnostic Health Probes
          </Typography>
          <Button
            type="button"
            variant="contained"
            onClick={handleTestConnection}
            disabled={testing}
            startIcon={
              testing ? <CircularProgress size={14} /> : <RefreshRoundedIcon />
            }
            sx={{ bgcolor: "#0f172a" }}
          >
            {testing ? "Testing Live Endpoints..." : "Re-run Diagnostics"}
          </Button>
        </Box>

        {healthState && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {/* Root */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: healthState.rootHealth ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${healthState.rootHealth ? "#bbf7d0" : "#fecaca"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#334155" }}
              >
                Root Gateway (GET /health)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {healthState.rootHealth ? (
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
                    fontWeight: 700,
                    color: healthState.rootHealth ? "#16a34a" : "#dc2626",
                  }}
                >
                  {healthState.rootHealth
                    ? "200 OK (Server Running)"
                    : "Offline / Unreachable"}
                </Typography>
              </Box>
            </Box>

            {/* Store Health */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: healthState.storeHealth ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${healthState.storeHealth ? "#bbf7d0" : "#fecaca"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#334155" }}
              >
                Store Route Guard (/account/store/health)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {healthState.storeHealth ? (
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
                    fontWeight: 700,
                    color: healthState.storeHealth ? "#16a34a" : "#dc2626",
                  }}
                >
                  {healthState.storeHealth
                    ? "Authorized (200 OK)"
                    : "401 Authorization Error"}
                </Typography>
              </Box>
            </Box>

            {/* Admin Health */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: healthState.adminHealth ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${healthState.adminHealth ? "#bbf7d0" : "#e2e8f0"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#334155" }}
              >
                Admin Route Guard (/account/admin/health)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {healthState.adminHealth ? (
                  <CheckCircleRoundedIcon
                    sx={{ fontSize: 18, color: "#16a34a" }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Available on new backend
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: healthState.adminHealth ? "#16a34a" : "#64748b",
                  }}
                >
                  {healthState.adminHealth
                    ? "Authorized (200 OK)"
                    : "Pending Deployment"}
                </Typography>
              </Box>
            </Box>

            {/* JWT Health */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: healthState.jwtHealth ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${healthState.jwtHealth ? "#bbf7d0" : "#fecaca"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#334155" }}
              >
                JWT Token Service (/jwt/health)
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {healthState.jwtHealth ? (
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
                    fontWeight: 700,
                    color: healthState.jwtHealth ? "#16a34a" : "#dc2626",
                  }}
                >
                  {healthState.jwtHealth ? "200 OK (Running)" : "Offline"}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
