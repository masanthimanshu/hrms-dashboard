/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useHrms } from "../context/HrmsContext";

export const ProtectedRoute: FC = () => {
  const { isAuthenticated, isAuthChecking } = useHrms();
  const location = useLocation();

  if (isAuthChecking) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8fafc",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: "#0f172a",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.2rem",
          }}
        >
          S
        </Box>
        <CircularProgress size={28} sx={{ color: "#0f172a" }} />
        <Typography
          variant="caption"
          sx={{ color: "#64748b", fontWeight: 600 }}
        >
          Verifying security credentials...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
