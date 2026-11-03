import { useState, useEffect, type FC } from "react";
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
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { VerificationPhotoModal } from "../components/VerificationPhotoModal";
import {
  apiService,
  formatAttendanceImageUrl,
  enrichAttendance,
  downloadCSV,
  notify,
  type AttendanceRecord,
  type Store,
} from "../services/api";

export const AttendancePage: FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [ruleFilter, setRuleFilter] = useState("ALL");
  const [inspectingRecord, setInspectingRecord] =
    useState<AttendanceRecord | null>(null);

  const loadData = async () => {
    try {
      const [attRes, storeRes, userRes] = await Promise.all([
        apiService.getLiveAttendance(),
        apiService.getStores(),
        apiService.getUsers(),
      ]);
      setStores(storeRes.data);
      setAttendanceError(attRes.error || null);
      setAttendance(enrichAttendance(attRes.data, userRes.data, storeRes.data));
    } catch {
      notify("Failed to update logs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = attendance.filter((rec) => {
    const s = search.toLowerCase();
    const matchSearch =
      (rec.userName || "").toLowerCase().includes(s) ||
      (rec.userEmail || "").toLowerCase().includes(s) ||
      (rec.storeName || "").toLowerCase().includes(s);
    const matchStore = storeFilter === "ALL" || rec.storeId === storeFilter;
    const dist = Number(rec.distance);
    const matchRule =
      ruleFilter === "ALL" ||
      (ruleFilter === "COMPLIANT" && dist <= 100) ||
      (ruleFilter === "OUT" && dist > 100);
    return matchSearch && matchStore && matchRule;
  });

  const exportCSV = () => {
    const rows = [
      [
        "Employee",
        "Email",
        "Store",
        "Clock-in",
        "Distance(m)",
        "Within 100m",
        "Image",
      ].join(","),
      ...filtered.map((r) =>
        [
          `"${r.userName || ""}"`,
          `"${r.userEmail || ""}"`,
          `"${r.storeName || ""}"`,
          `"${r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}"`,
          r.distance,
          Number(r.distance) <= 100 ? "YES" : "NO",
          `"${r.imageUrl || ""}"`,
        ].join(","),
      ),
    ].join("\n");
    downloadCSV(
      `attendance_${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
    );
  };

  const total = attendance.length;
  const compliant = attendance.filter((r) => Number(r.distance) <= 100).length;
  const near = attendance.filter(
    (r) => Number(r.distance) > 100 && Number(r.distance) <= 250,
  ).length;
  const outOfBounds = attendance.filter((r) => Number(r.distance) > 250).length;

  const statCards = [
    {
      title: "TOTAL CHECK-INS",
      val: total,
      sub: "Across all branches",
      color: "#64748b",
      border: "transparent",
    },
    {
      title: "ON-SITE COMPLIANT (≤ 100m)",
      val: compliant,
      sub: "Within authorized geofence",
      color: "#047857",
      border: "#10b981",
    },
    {
      title: "NEAR BOUNDARY (100m - 250m)",
      val: near,
      sub: "Proximity alert flagged",
      color: "#b45309",
      border: "#f59e0b",
    },
    {
      title: "OUT OF BOUNDS (> 250m)",
      val: outOfBounds,
      sub: "Geofence violation detected",
      color: "#b91c1c",
      border: "#ef4444",
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Top Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3.5,
          bgcolor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.015em",
              mb: 0.5,
            }}
          >
            Live Geofenced Attendance Logs & S3 Media Verification
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Auditing company-wide workforce check-ins, S3 verification selfies,
            and Haversine distance calculations.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => {
              setIsLoading(true);
              loadData().then(() =>
                notify("Attendance logs updated", "success"),
              );
            }}
            disabled={isLoading}
          >
            {isLoading ? "Syncing..." : "Sync"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            Export Logs CSV
          </Button>
        </Box>
      </Paper>

      {attendanceError && (
        <Alert
          severity="error"
          sx={{ borderRadius: 3, border: "1px solid #fecaca" }}
          action={
            <Button color="inherit" size="small" onClick={() => loadData()}>
              Retry
            </Button>
          }
        >
          {attendanceError}
        </Alert>
      )}

      {/* Metrics Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2.5,
        }}
      >
        {statCards.map((c) => (
          <Paper
            key={c.title}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              bgcolor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderLeft:
                c.border !== "transparent"
                  ? `4px solid ${c.border}`
                  : "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: c.color, fontWeight: 700, letterSpacing: "0.04em" }}
            >
              {c.title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                my: 0.5,
                color: c.color === "#64748b" ? "#0f172a" : c.color,
                letterSpacing: "-0.02em",
              }}
            >
              {c.val}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              {c.sub}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Filter Row */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3.5,
          bgcolor: "#ffffff",
          border: "1px solid #e2e8f0",
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Filter by employee name, email, or store..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            minWidth: 240,
            "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: 2 },
          }}
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
        <FormControl
          size="small"
          sx={{
            minWidth: 170,
            "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: 2 },
          }}
        >
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
        <FormControl
          size="small"
          sx={{
            minWidth: 170,
            "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: 2 },
          }}
        >
          <InputLabel>Geofence Rule</InputLabel>
          <Select
            value={ruleFilter}
            label="Geofence Rule"
            onChange={(e) => setRuleFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Check-ins</MenuItem>
            <MenuItem value="COMPLIANT">Within 100m (Valid)</MenuItem>
            <MenuItem value="OUT">Outside 100m (Flagged)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: 3.5,
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>EMPLOYEE</TableCell>
                <TableCell>WORKPLACE BRANCH</TableCell>
                <TableCell>CLOCK-IN TIME</TableCell>
                <TableCell>DISTANCE TO STORE</TableCell>
                <TableCell>GEOFENCE STATUS</TableCell>
                <TableCell align="right">VERIFICATION ASSET</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      Loading attendance records from live database...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", mb: 0.5, fontWeight: 600 }}
                    >
                      No attendance check-ins found in the live database yet.
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      All demo data has been removed. Check-in events recorded
                      by employees will appear here in real-time.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record) => {
                  const dist = Number(record.distance);
                  const isCompliant = dist <= 100;
                  const isNear = dist > 100 && dist <= 250;
                  const img = formatAttendanceImageUrl(record.imageUrl);

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
                            src={img}
                            sx={{
                              width: 38,
                              height: 38,
                              cursor: "pointer",
                              border: "1px solid #e2e8f0",
                            }}
                            onClick={() => setInspectingRecord(record)}
                          >
                            {(record.userName || "U").charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700, color: "#0f172a" }}
                            >
                              {record.userName || "Unknown Employee"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b" }}
                            >
                              {record.userEmail || `ID: ${record.userId}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#334155" }}
                        >
                          {record.storeName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          LAT {record.latitude} · LNG {record.longitude}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#334155" }}
                        >
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleDateString(
                                [],
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: isCompliant
                              ? "#16a34a"
                              : isNear
                                ? "#d97706"
                                : "#dc2626",
                          }}
                        >
                          {record.distance} meters
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          {isCompliant
                            ? "Inside authorized radius"
                            : "Exceeds 100m perimeter"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.6,
                            px: 1.25,
                            py: 0.35,
                            borderRadius: 2,
                            bgcolor: isCompliant
                              ? "#dcfce7"
                              : isNear
                                ? "#fef3c7"
                                : "#fee2e2",
                            color: isCompliant
                              ? "#15803d"
                              : isNear
                                ? "#b45309"
                                : "#b91c1c",
                          }}
                        >
                          {isCompliant ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
                          ) : (
                            <WarningAmberRoundedIcon sx={{ fontSize: 14 }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                          >
                            {isCompliant
                              ? "COMPLIANT"
                              : isNear
                                ? "NEAR BOUNDARY"
                                : "FLAGGED"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {record.imageUrl ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              <PhotoCameraRoundedIcon sx={{ fontSize: 14 }} />
                            }
                            onClick={() => setInspectingRecord(record)}
                            sx={{ fontSize: "0.75rem", borderRadius: 2 }}
                          >
                            Inspect Photo
                          </Button>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: "#94a3b8" }}
                          >
                            No Asset
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <VerificationPhotoModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
      />
    </Box>
  );
};
