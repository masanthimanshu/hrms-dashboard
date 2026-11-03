/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useHrms } from "../context/HrmsContext";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { users, stores, currentUser, logout } = useHrms();

  const navItems = [
    {
      path: "/overview",
      alias: "/",
      label: "Overview",
      icon: <DashboardRoundedIcon fontSize="small" />,
    },
    {
      path: "/employees",
      label: "Staff Directory",
      badge: users.length,
      icon: <PeopleAltRoundedIcon fontSize="small" />,
    },
    {
      path: "/stores",
      label: "Workplace Locations",
      badge: stores.length,
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

  const currentPath =
    location.pathname === "/" ? "/overview" : location.pathname;

  return (
    <Box
      component="aside"
      sx={{
        width: collapsed ? 80 : 260,
        transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        bgcolor: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 20,
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
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
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "#0f172a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.15rem",
              letterSpacing: "-0.03em",
              flexShrink: 0,
            }}
          >
            S
          </Box>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                }}
              >
                Scoobies HRMS
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Live Employer Portal
              </Typography>
            </Box>
          )}
        </Box>

        <IconButton
          size="small"
          onClick={onToggleCollapse}
          sx={{
            display: { xs: "none", md: "flex" },
            color: "#94a3b8",
            "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" },
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRightRoundedIcon fontSize="small" />
          ) : (
            <ChevronLeftRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      {/* Navigation Menu (react-router-dom) */}
      <Box sx={{ p: 1.5, flex: 1, overflowY: "auto" }}>
        <List
          disablePadding
          sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
        >
          {navItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.alias && currentPath === item.alias);
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
                    borderRadius: 1.5,
                    px: collapsed ? 1.5 : 2,
                    py: 1.2,
                    minHeight: 44,
                    bgcolor: isActive ? "#f1f5f9" : "transparent",
                    color: isActive ? "#0f172a" : "#475569",
                    fontWeight: isActive ? 600 : 500,
                    justifyContent: collapsed ? "center" : "flex-start",
                    "&:hover": {
                      bgcolor: isActive ? "#f1f5f9" : "#f8fafc",
                      color: "#0f172a",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? "auto" : 34,
                      color: isActive ? "#2563eb" : "#64748b",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: isActive ? 600 : 500,
                            }}
                          >
                            {item.label}
                          </Typography>
                        }
                      />
                      {item.badge !== undefined && (
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: isActive ? "#e2e8f0" : "#f1f5f9",
                            color: "#475569",
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {item.badge}
                        </Typography>
                      )}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* Authenticated User & Secure Sign Out */}
      <Box sx={{ borderTop: "1px solid #f1f5f9", p: collapsed ? 1.5 : 2 }}>
        {collapsed ? (
          <Tooltip
            title={`Sign Out (${currentUser?.name || "Admin"})`}
            placement="right"
            arrow
          >
            <IconButton
              onClick={() => {
                logout();
                navigate("/login");
              }}
              sx={{
                width: 44,
                height: 44,
                mx: "auto",
                display: "flex",
                color: "#64748b",
                borderRadius: 2,
                "&:hover": {
                  color: "#dc2626",
                  bgcolor: "#fef2f2",
                },
              }}
              aria-label="Sign Out"
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
              p: 1,
              borderRadius: 2,
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
                  bgcolor: "#0f172a",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {(currentUser?.name || "Admin").charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#0f172a",
                    fontSize: "0.825rem",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentUser?.name || "Scoobies Admin"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#16a34a",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  ● Active Session
                </Typography>
              </Box>
            </Box>

            <Tooltip title="Sign Out" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                sx={{
                  color: "#94a3b8",
                  borderRadius: 1.5,
                  p: 0.75,
                  "&:hover": {
                    color: "#dc2626",
                    bgcolor: "#fee2e2",
                  },
                }}
                aria-label="Sign Out"
              >
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
};
