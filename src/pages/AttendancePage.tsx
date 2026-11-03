/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type FC } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useHrms } from "../context/HrmsContext";
import { VerificationPhotoModal } from "../components/VerificationPhotoModal";
import type { AttendanceRecord } from "../types";
import { formatAttendanceImageUrl } from "../services/api";

export const AttendancePage: FC = () => {
  const { attendance, stores, isLoading, refreshData, attendanceError } =
    useHrms();

  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [complianceFilter, setComplianceFilter] = useState("ALL");
  const [inspectingRecord, setInspectingRecord] =
    useState<AttendanceRecord | null>(null);

  const filteredRecords = attendance.filter((rec) => {
    const matchesSearch =
      (rec.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.storeName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = storeFilter === "ALL" || rec.storeId === storeFilter;

    const distNum = Number(rec.distance);
    const matchesCompliance =
      complianceFilter === "ALL" ||
      (complianceFilter === "COMPLIANT" && distNum <= 100) ||
      (complianceFilter === "OUT_OF_BOUNDS" && distNum > 100);

    return matchesSearch && matchesStore && matchesCompliance;
  });

  const handleExportCSV = () => {
    const headers = [
      "Log ID",
      "Employee",
      "Email",
      "Store",
      "Check-In Time",
      "Distance (m)",
      "Within 100m Geofence",
      "Latitude",
      "Longitude",
      "Image Asset",
    ];
    const rows = filteredRecords.map((r) => [
      r._id,
      `"${r.userName || ""}"`,
      `"${r.userEmail || ""}"`,
      `"${r.storeName || ""}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}"`,
      r.distance,
      Number(r.distance) <= 100 ? "YES" : "NO",
      r.latitude,
      r.longitude,
      `"${r.imageUrl || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `hrms_attendance_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLogs = attendance.length;
  const compliantLogs = attendance.filter(
    (r) => Number(r.distance) <= 100,
  ).length;
  const nearLogs = attendance.filter(
    (r) => Number(r.distance) > 100 && Number(r.distance) <= 250,
  ).length;
  const outOfBoundsLogs = attendance.filter(
    (r) => Number(r.distance) > 250,
  ).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Top Banner */}
      <Paper
        elevation={1}
        sx={{
          p: 2.5,
          bgcolor: "#ffffff",
          borderRadius: 2.5,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}
          >
            Live Geofenced Attendance Logs & S3 Media Verification
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Auditing company-wide workforce check-ins, S3 verification selfies,
            and Haversine distance calculations.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => refreshData()}
            size="small"
            disabled={isLoading}
            sx={{
              borderColor: "#cbd5e1",
              color: "#334155",
              whiteSpace: "nowrap",
            }}
          >
            {isLoading ? "Syncing..." : "Sync"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={handleExportCSV}
            size="small"
            disabled={filteredRecords.length === 0}
            sx={{
              borderColor: "#cbd5e1",
              color: "#334155",
              whiteSpace: "nowrap",
            }}
          >
            Export Logs CSV
          </Button>
        </Box>
      </Paper>

      {/* Backend Synchronization Alert */}
      {attendanceError && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refreshData()}>
              Retry
            </Button>
          }
        >
          {attendanceError}
        </Alert>
      )}

      {/* Metric Cards Summary Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 600 }}
          >
            TOTAL CHECK-INS
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#0f172a", mt: 0.5 }}
          >
            {totalLogs}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Across all branches
          </Typography>
        </Paper>

        <Paper
          elevation={1}
          sx={{ p: 2, borderRadius: 2, borderLeft: "4px solid #10b981" }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#047857", fontWeight: 600 }}
          >
            ON-SITE COMPLIANT (≤ 100m)
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#047857", mt: 0.5 }}
          >
            {compliantLogs}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Within authorized geofence radius
          </Typography>
        </Paper>

        <Paper
          elevation={1}
          sx={{ p: 2, borderRadius: 2, borderLeft: "4px solid #f59e0b" }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#b45309", fontWeight: 600 }}
          >
            NEAR BOUNDARY (100m - 250m)
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#b45309", mt: 0.5 }}
          >
            {nearLogs}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Proximity alert flagged
          </Typography>
        </Paper>

        <Paper
          elevation={1}
          sx={{ p: 2, borderRadius: 2, borderLeft: "4px solid #ef4444" }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#b91c1c", fontWeight: 600 }}
          >
            OUT OF BOUNDS (&gt; 250m)
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#b91c1c", mt: 0.5 }}
          >
            {outOfBoundsLogs}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Geofence violation detected
          </Typography>
        </Paper>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Filter by employee name, email, or store..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 260, flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon
                    fontSize="small"
                    sx={{ color: "#94a3b8" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Branch Location</InputLabel>
          <Select
            value={storeFilter}
            label="Branch Location"
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Branches ({stores.length})</MenuItem>
            {stores.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Geofence Rule</InputLabel>
          <Select
            value={complianceFilter}
            label="Geofence Rule"
            onChange={(e) => setComplianceFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Check-ins</MenuItem>
            <MenuItem value="COMPLIANT">Within 100m (Valid)</MenuItem>
            <MenuItem value="OUT_OF_BOUNDS">Outside 100m (Flagged)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Attendance Records Table */}
      <Paper elevation={1} sx={{ overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Workplace Branch</TableCell>
                <TableCell>Clock-in Time</TableCell>
                <TableCell>Distance to Store</TableCell>
                <TableCell>Geofence Status</TableCell>
                <TableCell align="right">Verification Asset</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress
                      size={28}
                      sx={{ color: "#2563eb", mb: 1 }}
                    />
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      Querying live attendance records from backend...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", mb: 1 }}
                    >
                      No attendance check-ins found in the live database yet.
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#94a3b8", display: "block" }}
                    >
                      All demo data has been removed. Check-in events recorded
                      by employees will appear here in real-time.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const distNum = Number(record.distance);
                  const isCompliant = distNum <= 100;
                  const isNear = distNum > 100 && distNum <= 250;
                  const formattedImg = formatAttendanceImageUrl(
                    record.imageUrl,
                  );

                  return (
                    <TableRow key={record._id} hover>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            src={formattedImg}
                            alt={record.userName}
                            onClick={() => setInspectingRecord(record)}
                            sx={{
                              width: 36,
                              height: 36,
                              cursor: "pointer",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            {(record.userName || "U").charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, color: "#0f172a" }}
                            >
                              {record.userName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b" }}
                            >
                              {record.userEmail || `User ID: ${record.userId}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: "#334155" }}
                        >
                          {record.storeName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#94a3b8",
                            fontSize: "0.72rem",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {record.latitude}, {record.longitude}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "#334155",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleDateString(
                                [],
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "N/A"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )
                            : ""}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: isCompliant
                              ? "#15803d"
                              : isNear
                                ? "#b45309"
                                : "#dc2626",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {record.distance} m
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#94a3b8", fontSize: "0.72rem" }}
                        >
                          Haversine distance
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                          }}
                        >
                          {isCompliant ? (
                            <CheckCircleRoundedIcon
                              sx={{ fontSize: 18, color: "#16a34a" }}
                            />
                          ) : (
                            <WarningAmberRoundedIcon
                              sx={{
                                fontSize: 18,
                                color: isNear ? "#d97706" : "#dc2626",
                              }}
                            />
                          )}
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.825rem",
                                color: isCompliant
                                  ? "#15803d"
                                  : isNear
                                    ? "#b45309"
                                    : "#dc2626",
                              }}
                            >
                              {isCompliant
                                ? "On-Site (<100m)"
                                : isNear
                                  ? "Near Boundary"
                                  : "Outside Perimeter"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b", fontSize: "0.72rem" }}
                            >
                              {isCompliant
                                ? "Verified in store"
                                : `${record.distance}m from anchor`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Inspect verification photo & metadata">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              <PhotoCameraRoundedIcon sx={{ fontSize: 14 }} />
                            }
                            onClick={() => setInspectingRecord(record)}
                            sx={{
                              fontSize: "0.75rem",
                              borderColor: "#e2e8f0",
                              color: "#334155",
                              "&:hover": {
                                borderColor: "#cbd5e1",
                                bgcolor: "#f8fafc",
                              },
                            }}
                          >
                            View Photo
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Verification Photo Modal */}
      <VerificationPhotoModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
      />
    </Box>
  );
};
