/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type FC } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import type { AttendanceRecord } from "../types";
import { formatAttendanceImageUrl } from "../services/api";

interface VerificationPhotoModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export const VerificationPhotoModal: FC<VerificationPhotoModalProps> = ({
  record,
  onClose,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [record?._id]);

  if (!record) return null;

  const distNum = Number(record.distance);
  const isCompliant = distNum <= 100;
  const formattedImgUrl = formatAttendanceImageUrl(record.imageUrl);

  return (
    <Dialog
      open={Boolean(record)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          pb: 1.5,
          pt: 2.5,
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
          Attendance Verification
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: isCompliant ? "#f0fdf4" : "#fef2f2",
            color: isCompliant ? "#15803d" : "#dc2626",
            fontSize: "0.8rem",
            fontWeight: 700,
            border: `1px solid ${isCompliant ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {isCompliant ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
          ) : (
            <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />
          )}
          <span>{isCompliant ? "Geofence Passed" : "Boundary Alert"}</span>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          {/* Left Column: Full-Height, Fully Visible Photo */}
          <Box
            sx={{
              flex: { xs: "1 1 auto", md: "0 0 50%" },
              minHeight: { xs: 260, sm: 340, md: 420 },
              maxHeight: { md: 480 },
              borderRadius: 2.5,
              overflow: "hidden",
              bgcolor: "#090d16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #cbd5e1",
              position: "relative",
              p: 1,
            }}
          >
            {!imgError && formattedImgUrl ? (
              <img
                src={formattedImgUrl}
                alt={`Check-in verification for ${record.userName}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 6,
                }}
              />
            ) : (
              <Box sx={{ textAlign: "center", p: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#94a3b8", mb: 0.5, fontWeight: 600 }}
                >
                  Verification Asset
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    wordBreak: "break-all",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {record.imageUrl || "No image key attached"}
                </Typography>
              </Box>
            )}

            {!imgError && formattedImgUrl && (
              <Button
                variant="contained"
                size="small"
                startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 13 }} />}
                href={formattedImgUrl}
                target="_blank"
                rel="noreferrer"
                sx={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  fontSize: "0.7rem",
                  py: 0.25,
                  px: 1,
                  bgcolor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(4px)",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "#0f172a" },
                }}
              >
                Open Full Image
              </Button>
            )}
          </Box>

          {/* Right Column: All Metadata & Information */}
          <Box
            sx={{
              flex: { xs: "1 1 auto", md: "1 1 50%" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}
                >
                  {record.userName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.25 }}>
                  {record.userEmail || `User ID: ${record.userId}`}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}
                >
                  <StorefrontRoundedIcon
                    sx={{ fontSize: 20, color: "#64748b", mt: 0.25 }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#0f172a" }}
                    >
                      {record.storeName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Assigned Workplace Location
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}
                >
                  <AccessTimeRoundedIcon
                    sx={{ fontSize: 20, color: "#64748b", mt: 0.25 }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontFamily: '"JetBrains Mono", monospace',
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {record.createdAt
                        ? new Date(record.createdAt).toLocaleString()
                        : "N/A"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Timestamp of shift check-in
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}
                >
                  <PlaceRoundedIcon
                    sx={{ fontSize: 20, color: "#64748b", mt: 0.25 }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        fontFamily: '"JetBrains Mono", monospace',
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {record.latitude}, {record.longitude}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Captured GPS Coordinates
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Haversine Distance Card */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isCompliant ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${isCompliant ? "#bbf7d0" : "#fde68a"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 0.5,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#64748b", fontWeight: 600 }}
                  >
                    Haversine Distance to Store:
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: isCompliant ? "#15803d" : "#b45309",
                      lineHeight: 1.2,
                      fontFamily: '"JetBrains Mono", monospace',
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {record.distance} meters
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: isCompliant ? "#15803d" : "#b45309",
                  }}
                >
                  {isCompliant ? "Within 100m Rule" : "Outside 100m Perimeter"}
                </Typography>
              </Box>
            </Box>

            <Button
              onClick={onClose}
              fullWidth
              variant="contained"
              size="medium"
              sx={{
                bgcolor: "#0f172a",
                py: 1.2,
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Dismiss Inspection
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
