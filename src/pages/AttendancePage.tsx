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
import type { AttendanceRecord, Store } from "../types";
import { apiService, formatAttendanceImageUrl } from "../services/api";
import { notify } from "../services/notify";

export const AttendancePage: FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [attRes, storeRes, userRes] = await Promise.all([
        apiService.getLiveAttendance(),
        apiService.getStores(),
        apiService.getUsers(),
      ]);
      const storeList = storeRes.data || [];
      const userList = userRes.data || [];
      const attList = attRes.data || [];

      setStores(storeList);
      setAttendanceError(attRes.error || null);

      const enrichedLogs: AttendanceRecord[] = attList.map((log) => {
        const u = userList.find((usr) => usr._id === log.userId);
        const s = u ? storeList.find((st) => st._id === u.storeId) : undefined;
        return {
          ...log,
          userName:
            log.userName ||
            u?.name ||
            `Staff (${log.userId?.slice(-6) || "Unknown"})`,
          userEmail: log.userEmail || u?.email || "",
          storeId: log.storeId || u?.storeId || "",
          storeName: log.storeName || s?.name || "Assigned Branch",
        };
      });
      setAttendance(enrichedLogs);
    } catch {
      notify("Failed to update logs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [ruleFilter, setRuleFilter] = useState("ALL");
  const [inspectingRecord, setInspectingRecord] =
    useState<AttendanceRecord | null>(null);

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
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + rows);
    link.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const total = attendance.length;
  const compliant = attendance.filter((r) => Number(r.distance) <= 100).length;
  const near = attendance.filter(
    (r) => Number(r.distance) > 100 && Number(r.distance) <= 250,
  ).length;
  const outOfBounds = attendance.filter((r) => Number(r.distance) > 250).length;

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
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
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
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}
          >
            TOTAL CHECK-INS
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              my: 0.5,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            {total}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Across all branches
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderLeft: "4px solid #10b981",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#047857", fontWeight: 700, letterSpacing: "0.04em" }}
          >
            ON-SITE COMPLIANT (≤ 100m)
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              my: 0.5,
              color: "#047857",
              letterSpacing: "-0.02em",
            }}
          >
            {compliant}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Within authorized geofence
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderLeft: "4px solid #f59e0b",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#b45309", fontWeight: 700, letterSpacing: "0.04em" }}
          >
            NEAR BOUNDARY (100m - 250m)
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              my: 0.5,
              color: "#b45309",
              letterSpacing: "-0.02em",
            }}
          >
            {near}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Proximity alert flagged
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderLeft: "4px solid #ef4444",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#b91c1c", fontWeight: 700, letterSpacing: "0.04em" }}
          >
            OUT OF BOUNDS (&gt; 250m)
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              my: 0.5,
              color: "#b91c1c",
              letterSpacing: "-0.02em",
            }}
          >
            {outOfBounds}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            Geofence violation detected
          </Typography>
        </Paper>
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
                              {record.userName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b" }}
                            >
                              {record.userEmail || record.userId}
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
                          {record.latitude}, {record.longitude}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleDateString()
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
                              ? "#15803d"
                              : isNear
                                ? "#b45309"
                                : "#dc2626",
                          }}
                        >
                          {record.distance} m
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
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
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: isCompliant
                                ? "#15803d"
                                : isNear
                                  ? "#b45309"
                                  : "#dc2626",
                            }}
                          >
                            {isCompliant
                              ? "On-Site (≤100m)"
                              : isNear
                                ? "Near Boundary"
                                : "Outside Perimeter"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            <PhotoCameraRoundedIcon fontSize="small" />
                          }
                          onClick={() => setInspectingRecord(record)}
                          sx={{ borderRadius: 2 }}
                        >
                          View Photo
                        </Button>
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
