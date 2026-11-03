import { useState, type FC } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box, Alert, Button, Typography } from "@mui/material";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import { Sidebar } from "./Sidebar";
import { hasConfiguredAccountId } from "../services/api";

const PAGE_MAP: Record<string, { title: string; section: string }> = {
  "/": { title: "Executive Overview", section: "Overview" },
  "/overview": { title: "Executive Overview", section: "Overview" },
  "/employees": { title: "Staff Directory & Access", section: "Staff" },
  "/stores": { title: "Workplace Locations & Geofences", section: "Locations" },
  "/attendance": {
    title: "Geofence Verification & Attendance",
    section: "Attendance",
  },
  "/analytics": {
    title: "Workforce Analytics & Metrics",
    section: "Analytics",
  },
  "/settings": { title: "API & Configuration", section: "Settings" },
};

export const Layout: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isConfigured = hasConfiguredAccountId;
  const page = PAGE_MAP[location.pathname] || {
    title: "Dashboard",
    section: "Portal",
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f8fafc",
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37, 99, 235, 0.04), transparent 70%)",
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        {/* Top Header */}
        <Box
          component="header"
          sx={{
            height: 68,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #e2e8f0",
            px: { xs: 2, sm: 3, md: 4 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: "0.02em",
              }}
            >
              HRMS / <span style={{ color: "#0f172a" }}>{page.section}</span>
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
              }}
            >
              {page.title}
            </Typography>
          </Box>
        </Box>

        {!isConfigured && (
          <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2 }}>
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate("/settings")}
                  startIcon={<KeyRoundedIcon />}
                  sx={{ fontWeight: 700 }}
                >
                  Configure Account
                </Button>
              }
              sx={{ borderRadius: 3, border: "1px solid #fde68a" }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                API Configuration Setup Required
              </Typography>
              <Typography variant="caption" sx={{ color: "#b45309" }}>
                Configure your administrative credentials in .env to connect to
                live backend.
              </Typography>
            </Alert>
          </Box>
        )}

        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            flex: 1,
            maxWidth: 1600,
            width: "100%",
            mx: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
