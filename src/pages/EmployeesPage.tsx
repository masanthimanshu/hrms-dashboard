import { useState, useEffect, type FC, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PauseCircleFilledRoundedIcon from "@mui/icons-material/PauseCircleFilledRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import type { User, Store, AttendanceRecord } from "../types";
import { VerificationPhotoModal } from "../components/VerificationPhotoModal";
import { apiService, hasConfiguredAccountId } from "../services/api";
import { notify } from "../services/notify";

export const EmployeesPage: FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const hasAccountId = hasConfiguredAccountId;

  const loadData = async () => {
    try {
      const [userRes, storeRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getStores(),
      ]);
      setUsers(userRes.data || []);
      setUsersError(userRes.error || null);
      setStores(storeRes.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  const [userAttendance, setUserAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingUserAtt, setLoadingUserAtt] = useState(false);
  const [inspectingRecord, setInspectingRecord] =
    useState<AttendanceRecord | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newStoreId, setNewStoreId] = useState(stores[0]?._id || "");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUser) return;
    let active = true;
    apiService
      .getLiveAttendance(selectedUser._id)
      .then((res) => {
        if (!active) return;
        const s = stores.find((st) => st._id === selectedUser.storeId);
        const enriched = (res.data || []).map((log) => ({
          ...log,
          userName: selectedUser.name,
          userEmail: selectedUser.email,
          storeName: s?.name || log.storeName || "Assigned Branch",
        }));
        setUserAttendance(enriched);
      })
      .catch(() => {
        if (active) setUserAttendance([]);
      })
      .finally(() => {
        if (active) setLoadingUserAtt(false);
      });
    return () => {
      active = false;
    };
  }, [selectedUser, stores]);

  const getStoreName = (id: string) =>
    stores.find((s) => s._id === id)?.name || "Unassigned";

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    const matchStore = storeFilter === "ALL" || u.storeId === storeFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? u.isValid : !u.isValid);
    return matchSearch && matchStore && matchStatus;
  });

  const handleToggle = async (uid: string) => {
    setTogglingUid(uid);
    try {
      const res = await apiService.toggleUserValidation(uid);
      if (res.success) {
        notify("Account status updated", "success");
        await loadData();
        if (selectedUser && selectedUser._id === uid) {
          setSelectedUser((prev) =>
            prev ? { ...prev, isValid: !prev.isValid } : null,
          );
        }
      } else {
        notify(res.message || "Failed to update status", "error");
      }
    } finally {
      setTogglingUid(null);
    }
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newStoreId) {
      setFormError("All fields are required");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    const res = await apiService.createUser({
      name: newName.trim(),
      email: newEmail.trim(),
      storeId: newStoreId,
    });
    setFormSubmitting(false);
    if (res.success) {
      notify("Staff member onboarded", "success");
      setNewName("");
      setNewEmail("");
      setCreateModalOpen(false);
      loadData();
    } else {
      notify(res.message || "Failed to onboard staff", "error");
      setFormError(res.message || "Failed to onboard staff");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["ID", "Name", "Email", "Store", "Status", "Joined"].join(","),
      ...filtered.map((u) =>
        [
          `"${u._id}"`,
          `"${u.name}"`,
          `"${u.email}"`,
          `"${getStoreName(u.storeId)}"`,
          u.isValid ? "Active" : "Suspended",
          u.createdAt ? u.createdAt.slice(0, 10) : "",
        ].join(","),
      ),
    ].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + rows);
    link.download = `staff_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {usersError && (
        <Alert
          severity="error"
          sx={{ borderRadius: 3, border: "1px solid #fecaca" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/settings")}
            >
              Settings
            </Button>
          }
        >
          {usersError}
        </Alert>
      )}

      {/* Filter toolbar */}
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
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            flex: 1,
            alignItems: "center",
          }}
        >
          <TextField
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{
              minWidth: 240,
              flex: 1,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#f8fafc",
                borderRadius: 2,
              },
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
              minWidth: 160,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#f8fafc",
                borderRadius: 2,
              },
            }}
          >
            <InputLabel>Location Filter</InputLabel>
            <Select
              value={storeFilter}
              label="Location Filter"
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
              minWidth: 140,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#f8fafc",
                borderRadius: 2,
              },
            }}
          >
            <InputLabel>Account State</InputLabel>
            <Select
              value={statusFilter}
              label="Account State"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All States</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
              <MenuItem value="SUSPENDED">Suspended Only</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PersonAddRoundedIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Onboard Staff
          </Button>
        </Box>
      </Paper>

      {/* Staff Table */}
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
                <TableCell>Employee</TableCell>
                <TableCell>Workplace Location</TableCell>
                <TableCell>Activation Status</TableCell>
                <TableCell>Onboarded Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      Loading staff directory...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", mb: 1.5 }}
                    >
                      {!hasAccountId
                        ? "Account ID not configured yet."
                        : "No employee records found in live database."}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        hasAccountId
                          ? setCreateModalOpen(true)
                          : navigate("/settings")
                      }
                    >
                      {hasAccountId
                        ? "Onboard First Staff Member"
                        : "Configure Settings"}
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            background: user.isValid
                              ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                              : "#cbd5e1",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {(user.name || "U").charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: "#0f172a" }}
                          >
                            {user.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <EmailRoundedIcon
                              sx={{ fontSize: 13, color: "#94a3b8" }}
                            />
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <StorefrontRoundedIcon
                          sx={{ fontSize: 16, color: "#64748b" }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#334155" }}
                        >
                          {getStoreName(user.storeId)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                          }}
                        >
                          {user.isValid ? (
                            <CheckCircleRoundedIcon
                              sx={{ fontSize: 18, color: "#16a34a" }}
                            />
                          ) : (
                            <PauseCircleFilledRoundedIcon
                              sx={{ fontSize: 18, color: "#d97706" }}
                            />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: user.isValid ? "#15803d" : "#b45309",
                              fontSize: "0.825rem",
                            }}
                          >
                            {user.isValid ? "Active" : "Suspended"}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={togglingUid === user._id}
                          onClick={() => handleToggle(user._id)}
                          sx={{
                            py: 0.25,
                            px: 1.2,
                            fontSize: "0.72rem",
                            borderRadius: 1.5,
                            fontWeight: 700,
                            borderColor: user.isValid ? "#fecaca" : "#bbf7d0",
                            color: user.isValid ? "#dc2626" : "#16a34a",
                            "&:hover": {
                              bgcolor: user.isValid ? "#fef2f2" : "#f0fdf4",
                              borderColor: user.isValid ? "#dc2626" : "#16a34a",
                            },
                          }}
                        >
                          {togglingUid === user._id ? (
                            <CircularProgress size={12} />
                          ) : user.isValid ? (
                            "Suspend"
                          ) : (
                            "Activate"
                          )}
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 600 }}
                      >
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setLoadingUserAtt(true);
                        }}
                        sx={{
                          color: "#64748b",
                          "&:hover": { color: "#0f172a" },
                        }}
                      >
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Onboard Dialog */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: "-0.015em" }}>
          Onboard New Staff
        </DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {formError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {formError}
              </Alert>
            )}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.75,
                  display: "block",
                }}
              >
                Full Name
              </Typography>
              <TextField
                placeholder="e.g. Maya Lin"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#f8fafc",
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.75,
                  display: "block",
                }}
              >
                Work Email Address
              </Typography>
              <TextField
                placeholder="e.g. maya@scoobies.co.in"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#f8fafc",
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.75,
                  display: "block",
                }}
              >
                Assigned Workplace Branch
              </Typography>
              <FormControl
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#f8fafc",
                    borderRadius: 2,
                  },
                }}
              >
                <Select
                  value={newStoreId}
                  onChange={(e) => setNewStoreId(e.target.value)}
                >
                  {stores.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name} ({s.address})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setCreateModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={formSubmitting}>
              {formSubmitting ? "Onboarding..." : "Onboard Staff"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Staff Details Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        slotProps={{
          paper: { sx: { width: { xs: "100%", sm: 420 }, p: 3.5 } },
        }}
      >
        {selectedUser && (
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  background: selectedUser.isValid
                    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                    : "#cbd5e1",
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "#fff",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                }}
              >
                {(selectedUser.name || "U").charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.015em",
                  }}
                >
                  {selectedUser.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  {selectedUser.email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Assigned Branch:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: "#0f172a" }}
                >
                  {getStoreName(selectedUser.storeId)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Account State:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: selectedUser.isValid ? "#16a34a" : "#d97706",
                  }}
                >
                  {selectedUser.isValid ? "Active & Validated" : "Suspended"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Registered:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleToggle(selectedUser._id)}
              disabled={togglingUid === selectedUser._id}
              sx={{
                mb: 2.5,
                color: selectedUser.isValid ? "#dc2626" : "#16a34a",
                borderColor: selectedUser.isValid ? "#fecaca" : "#bbf7d0",
                fontWeight: 700,
              }}
            >
              {selectedUser.isValid ? "Suspend Access" : "Activate Account"}
            </Button>

            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textTransform: "uppercase",
                color: "#64748b",
                letterSpacing: "0.04em",
                mb: 1.5,
              }}
            >
              Recent Check-ins
            </Typography>

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
              }}
            >
              {loadingUserAtt ? (
                <CircularProgress size={20} sx={{ mx: "auto", my: 3 }} />
              ) : userAttendance.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: "#94a3b8", textAlign: "center", py: 2 }}
                >
                  No attendance records logged yet.
                </Typography>
              ) : (
                userAttendance.map((log) => (
                  <Box
                    key={log._id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: "#334155" }}
                      >
                        {new Date(log.createdAt).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color:
                            Number(log.distance) <= 100 ? "#16a34a" : "#d97706",
                        }}
                      >
                        {log.distance}m
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        {log.latitude}, {log.longitude}
                      </Typography>
                      {log.imageUrl && (
                        <Button
                          size="small"
                          startIcon={
                            <PhotoCameraRoundedIcon sx={{ fontSize: 13 }} />
                          }
                          onClick={() => setInspectingRecord(log)}
                          sx={{ fontSize: "0.7rem", p: 0.25 }}
                        >
                          View Photo
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={() => setSelectedUser(null)}
              sx={{ mt: 2.5 }}
            >
              Close
            </Button>
          </Box>
        )}
      </Drawer>

      <VerificationPhotoModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
      />
    </Box>
  );
};
