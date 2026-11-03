import { useState, type FC } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
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

  if (!record) return null;

  const isCompliant = Number(record.distance) <= 100;
  const imgUrl = formatAttendanceImageUrl(record.imageUrl);

  return (
    <Dialog
      open={Boolean(record)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: "hidden" } } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
          px: 3,
          pt: 2.5,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.015em" }}
        >
          Attendance Verification
        </Typography>
        <Chip
          size="small"
          icon={
            isCompliant ? (
              <CheckCircleRoundedIcon sx={{ fontSize: "16px !important" }} />
            ) : (
              <WarningAmberRoundedIcon sx={{ fontSize: "16px !important" }} />
            )
          }
          label={isCompliant ? "Geofence Passed" : "Boundary Alert"}
          color={isCompliant ? "success" : "warning"}
          sx={{ fontWeight: 700, px: 0.5 }}
        />
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
          {/* Photo */}
          <Box
            sx={{
              flex: { xs: "1 1 auto", md: "0 0 50%" },
              minHeight: 320,
              maxHeight: 460,
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "#090d16",
              border: "1px solid #1e293b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              p: 1,
            }}
          >
            {!imgError && imgUrl ? (
              <img
                key={record._id}
                src={imgUrl}
                alt={record.userName}
                onError={() => setImgError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            ) : (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#94a3b8", fontWeight: 600 }}
                >
                  Verification Asset
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {record.imageUrl || "No image key"}
                </Typography>
              </Box>
            )}

            {!imgError && imgUrl && (
              <Button
                variant="contained"
                size="small"
                startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 13 }} />}
                href={imgUrl}
                target="_blank"
                sx={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  fontSize: "0.72rem",
                  bgcolor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(4px)",
                }}
              >
                Open Full Image
              </Button>
            )}
          </Box>

          {/* Details */}
          <Box
            sx={{
              flex: 1,
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
                  sx={{
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {record.userName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  {record.userEmail || `ID: ${record.userId}`}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                <StorefrontRoundedIcon
                  fontSize="small"
                  sx={{ color: "#64748b" }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "#0f172a" }}
                  >
                    {record.storeName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Workplace Branch
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                <AccessTimeRoundedIcon
                  fontSize="small"
                  sx={{ color: "#64748b" }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "#0f172a" }}
                  >
                    {record.createdAt
                      ? new Date(record.createdAt).toLocaleString()
                      : "N/A"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Check-in Timestamp
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                <PlaceRoundedIcon fontSize="small" sx={{ color: "#64748b" }} />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "#0f172a" }}
                  >
                    {record.latitude}, {record.longitude}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Captured GPS Coordinates
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: isCompliant ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${isCompliant ? "#bbf7d0" : "#fde68a"}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 700 }}
                >
                  Distance to Store:
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: isCompliant ? "#15803d" : "#b45309",
                  }}
                >
                  {record.distance} meters{" "}
                  {isCompliant
                    ? "(Within 100m Rule)"
                    : "(Outside 100m Perimeter)"}
                </Typography>
              </Box>
            </Box>

            <Button
              onClick={onClose}
              fullWidth
              variant="contained"
              sx={{ py: 1.1, borderRadius: 2 }}
            >
              Dismiss Inspection
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
