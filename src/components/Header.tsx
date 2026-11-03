/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

interface HeaderProps {
  onOpenCreateEmployee?: () => void;
  onOpenCreateStore?: () => void;
}

export const Header: FC<HeaderProps> = ({
  onOpenCreateEmployee,
  onOpenCreateStore,
}) => {
  const location = useLocation();

  const getPageInfo = () => {
    switch (location.pathname) {
      case "/":
      case "/overview":
        return { title: "Executive Overview", section: "Overview" };
      case "/employees":
        return { title: "Staff Directory & Access", section: "Staff" };
      case "/stores":
        return {
          title: "Workplace Locations & Geofences",
          section: "Locations",
        };
      case "/attendance":
        return {
          title: "Geofence Verification & Attendance",
          section: "Attendance",
        };
      case "/analytics":
        return { title: "Workforce Analytics & Metrics", section: "Analytics" };
      case "/settings":
        return { title: "API & Configuration", section: "Settings" };
      default:
        return { title: "Dashboard", section: "Portal" };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <Box
      component="header"
      sx={{
        height: 68,
        bgcolor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        px: { xs: 2, sm: 3, md: 4 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Zone 1: Breadcrumb & Title */}
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#64748b",
            fontSize: "0.8rem",
          }}
        >
          <span>HRMS</span>
          <span aria-hidden="true">/</span>
          <Box
            component="span"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {pageInfo.section}
          </Box>
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#0f172a",
            fontSize: { xs: "1rem", sm: "1.15rem" },
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {pageInfo.title}
        </Typography>
      </Box>

      {/* Zone 2: Contextual Primary Action Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          flexShrink: 0,
        }}
      >
        {location.pathname === "/employees" && onOpenCreateEmployee && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon />}
            onClick={onOpenCreateEmployee}
            sx={{
              fontSize: "0.825rem",
              py: 0.9,
              px: 1.75,
              bgcolor: "#0f172a",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Onboard Staff
          </Button>
        )}

        {location.pathname === "/stores" && onOpenCreateStore && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon />}
            onClick={onOpenCreateStore}
            sx={{
              fontSize: "0.825rem",
              py: 0.9,
              px: 1.75,
              bgcolor: "#0f172a",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Add Workplace
          </Button>
        )}
      </Box>
    </Box>
  );
};
