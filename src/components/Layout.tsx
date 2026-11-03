/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FC } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Box, Alert, Button, Typography } from "@mui/material";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useHrms } from "../context/HrmsContext";

export const Layout: FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasAccountId, storesError } = useHrms();
  const navigate = useNavigate();

  const isConfigured = Boolean(hasAccountId && !storesError);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

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
        {/* Top Header */}
        <Header />

        {/* Global Live Key Configuration Notice if unconfigured */}
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
                  sx={{ fontWeight: 700, textTransform: "none" }}
                >
                  Configure Account Secret
                </Button>
              }
              sx={{
                bgcolor: "#fffbeb",
                color: "#92400e",
                border: "1px solid #fde68a",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Live API Connection Setup Required
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#b45309", display: "block" }}
              >
                All demo data has been removed. To load real employees, store
                locations, and attendance records, please configure your
                administrative credentials in the environment configuration (
                <code>.env</code>).
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Dynamic Route Content */}
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
