import { useState, type FC } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Alert,
  Button,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { apiService, hasConfiguredAccountId, notify } from "../services/api";

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

const NAV_ITEMS = [
  {
    path: "/overview",
    label: "Overview",
    icon: <DashboardRoundedIcon fontSize="small" />,
  },
  {
    path: "/employees",
    label: "Staff Directory",
    icon: <PeopleAltRoundedIcon fontSize="small" />,
  },
  {
    path: "/stores",
    label: "Workplace Locations",
    icon: <StorefrontRoundedIcon fontSize="small" />,
  },
  {
    path: "/attendance",
    label: "Geofence Attendance",
    icon: <LocationOnRoundedIcon fontSize="small" />,
  },
  {
    path: "/analytics",
    label: "Analytics & Trends",
    icon: <QueryStatsRoundedIcon fontSize="small" />,
  },
];

export const Layout: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isConfigured = hasConfiguredAccountId;
  const page = PAGE_MAP[location.pathname] || {
    title: "Dashboard",
    section: "Portal",
  };
  const currentPath =
    location.pathname === "/" ? "/overview" : location.pathname;
  const currentUser = apiService.getCurrentUser();

  const handleLogout = () => {
    apiService.clearSession();
    notify("Signed out successfully", "info");
    navigate("/login");
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
      {/* Sidebar */}
      <Box
        component="aside"
        sx={{
          width: collapsed ? 80 : 256,
          transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          bgcolor: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            p: collapsed ? 2 : 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            borderBottom: "1px solid #f1f5f9",
            minHeight: 68,
          }}
        >
          <Box
            onClick={() => navigate("/overview")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.25,
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.15rem",
                flexShrink: 0,
                boxShadow:
                  "0 4px 10px -2px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              }}
            >
              S
            </Box>
            {!collapsed && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.2,
                  }}
                >
                  Scoobies HRMS
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Enterprise Portal
                </Typography>
              </Box>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              display: { xs: "none", md: "flex" },
              color: "#94a3b8",
              "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" },
            }}
          >
            {collapsed ? (
              <ChevronRightRoundedIcon fontSize="small" />
            ) : (
              <ChevronLeftRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </Box>

        <Box sx={{ p: 1.5, flex: 1, overflowY: "auto" }}>
          <List
            disablePadding
            sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Tooltip
                  key={item.path}
                  title={collapsed ? item.label : ""}
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      px: collapsed ? 1.5 : 2,
                      py: 1.1,
                      minHeight: 44,
                      background: isActive
                        ? "linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.02) 100%)"
                        : "transparent",
                      borderLeft: isActive
                        ? "3px solid #2563eb"
                        : "3px solid transparent",
                      color: isActive ? "#0f172a" : "#64748b",
                      justifyContent: collapsed ? "center" : "flex-start",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: isActive
                          ? "rgba(37, 99, 235, 0.1)"
                          : "#f8fafc",
                        color: "#0f172a",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? "auto" : 34,
                        color: isActive ? "#2563eb" : "#94a3b8",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: isActive ? 700 : 500,
                            }}
                          >
                            {item.label}
                          </Typography>
                        }
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </Box>

        <Box sx={{ borderTop: "1px solid #f1f5f9", p: collapsed ? 1.5 : 2 }}>
          {collapsed ? (
            <Tooltip title="Sign Out" placement="right">
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: "#64748b",
                  mx: "auto",
                  display: "flex",
                  "&:hover": { color: "#dc2626", bgcolor: "#fef2f2" },
                }}
              >
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  minWidth: 0,
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    background:
                      "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    fontSize: "0.825rem",
                    fontWeight: 700,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  {(currentUser?.name || "Admin").charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "0.82rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {currentUser?.name || "Scoobies Admin"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#16a34a",
                        boxShadow: "0 0 6px #16a34a",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#16a34a",
                        fontWeight: 600,
                        fontSize: "0.68rem",
                      }}
                    >
                      Active Session
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{
                  color: "#94a3b8",
                  "&:hover": { color: "#dc2626", bgcolor: "#fee2e2" },
                }}
              >
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Main Content Area */}
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
