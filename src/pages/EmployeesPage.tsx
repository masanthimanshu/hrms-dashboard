/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Tooltip,
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
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import { useHrms } from "../context/HrmsContext";
import type { User, AttendanceRecord } from "../types";
import { VerificationPhotoModal } from "../components/VerificationPhotoModal";

export const EmployeesPage: FC = () => {
  const navigate = useNavigate();
  const {
    users,
    stores,
    isLoading,
    usersError,
    hasAccountId,
    createUser,
    toggleUserValidation,
    getAttendanceForUser,
  } = useHrms();

  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  // Employee-specific live attendance logs
  const [userAttendance, setUserAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingUserAtt, setLoadingUserAtt] = useState(false);
  const [inspectingRecord, setInspectingRecord] =
    useState<AttendanceRecord | null>(null);

  // New staff modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newStoreId, setNewStoreId] = useState(stores[0]?._id || "");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch employee-specific logs when selectedUser changes
  useEffect(() => {
    if (!selectedUser) {
      setUserAttendance([]);
      return;
    }

    let active = true;
    setLoadingUserAtt(true);
    getAttendanceForUser(selectedUser._id)
      .then((records) => {
        if (active) setUserAttendance(records);
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
  }, [selectedUser, getAttendanceForUser]);

  // Sync newStoreId if stores load
  useEffect(() => {
    if (!newStoreId && stores.length > 0) {
      setNewStoreId(stores[0]._id);
    }
  }, [stores, newStoreId]);

  // Filtered live users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = storeFilter === "ALL" || user.storeId === storeFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && user.isValid) ||
      (statusFilter === "SUSPENDED" && !user.isValid);

    return matchesSearch && matchesStore && matchesStatus;
  });

  const getStoreName = (storeId: string) => {
    const store = stores.find((s) => s._id === storeId);
    return store ? store.name : "Unassigned Location";
  };

  const handleToggleStatus = async (uid: string) => {
    setTogglingUid(uid);
    try {
      await toggleUserValidation(uid);
    } finally {
      setTogglingUid(null);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError("Please enter employee full name");
      return;
    }
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setFormError("Please enter a valid work email address");
      return;
    }
    if (!newStoreId) {
      setFormError("Please select a workplace location");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        storeId: newStoreId,
      });
      if (res.success) {
        setNewName("");
        setNewEmail("");
        setCreateModalOpen(false);
      } else {
        setFormError(res.message || "Failed to onboard employee");
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Error submitting onboarding request",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Store ID",
      "Store Name",
      "Status",
      "Joined Date",
    ];
    const rows = filteredUsers.map((u) => [
      u._id,
      `"${u.name}"`,
      `"${u.email}"`,
      u.storeId,
      `"${getStoreName(u.storeId)}"`,
      u.isValid ? "Active" : "Suspended",
      u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `hrms_live_staff_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Top Banner or Error Alert */}
      {usersError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/settings")}
            >
              Settings
            </Button>
          }
          sx={{ borderRadius: 2 }}
        >
          {usersError}
        </Alert>
      )}

      {/* Filter Toolbar */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: 1.5,
            flex: 1,
            flexWrap: "wrap",
          }}
        >
          <TextField
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: { xs: "100%", sm: 260 } }}
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
            sx={{ minWidth: 160, width: { xs: "100%", sm: "auto" } }}
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
            sx={{ minWidth: 140, width: { xs: "100%", sm: "auto" } }}
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

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={handleExportCSV}
            size="small"
            disabled={filteredUsers.length === 0}
            sx={{
              borderColor: "#cbd5e1",
              color: "#334155",
              "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddRoundedIcon />}
            onClick={() => setCreateModalOpen(true)}
            size="small"
            sx={{ bgcolor: "#0f172a" }}
          >
            Onboard Staff
          </Button>
        </Box>
      </Paper>

      {/* Real-time Employee Table */}
      <Paper elevation={1} sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: "#0f172a" }}
            >
              Live Staff Records
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}
            >
              ({filteredUsers.length} total from database)
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Streaming directly from GET /account/auth/users
          </Typography>
        </Box>

        <Divider />

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Workplace Location</TableCell>
                <TableCell>Activation Status (isValid)</TableCell>
                <TableCell>Onboarded Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress
                      size={28}
                      sx={{ color: "#2563eb", mb: 1 }}
                    />
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      Querying live employee records from backend...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", mb: 1 }}
                    >
                      {!hasAccountId
                        ? "Account ID not configured yet. Set your key in secrets to load live staff records."
                        : "No employee records found in live database."}
                    </Typography>
                    {!hasAccountId ? (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate("/settings")}
                        startIcon={<KeyRoundedIcon />}
                        sx={{ bgcolor: "#0f172a", mt: 1 }}
                      >
                        Enter Account Secret
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setCreateModalOpen(true)}
                        startIcon={<PersonAddRoundedIcon />}
                        sx={{ bgcolor: "#0f172a", mt: 1 }}
                      >
                        Onboard First Employee
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isToggling = togglingUid === user._id;
                  const storeName = getStoreName(user.storeId);
                  const joinedDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A";

                  return (
                    <TableRow key={user._id} hover>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: user.isValid ? "#0f172a" : "#cbd5e1",
                              color: "#ffffff",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                            }}
                          >
                            {(user.name || "U").charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: "#0f172a",
                                lineHeight: 1.2,
                              }}
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
                            sx={{ fontWeight: 500, color: "#334155" }}
                          >
                            {storeName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
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
                                fontWeight: 600,
                                color: user.isValid ? "#15803d" : "#b45309",
                                fontSize: "0.825rem",
                              }}
                            >
                              {user.isValid ? "Active" : "Suspended"}
                            </Typography>
                          </Box>

                          <Tooltip
                            title={
                              user.isValid
                                ? "Click to suspend employee access"
                                : "Click to validate & activate account"
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={isToggling}
                                onClick={() => handleToggleStatus(user._id)}
                                sx={{
                                  py: 0.25,
                                  px: 1,
                                  fontSize: "0.72rem",
                                  borderColor: user.isValid
                                    ? "#fecaca"
                                    : "#bbf7d0",
                                  color: user.isValid ? "#dc2626" : "#16a34a",
                                  "&:hover": {
                                    bgcolor: user.isValid
                                      ? "#fef2f2"
                                      : "#f0fdf4",
                                    borderColor: user.isValid
                                      ? "#dc2626"
                                      : "#16a34a",
                                  },
                                }}
                              >
                                {isToggling ? (
                                  <CircularProgress size={12} />
                                ) : user.isValid ? (
                                  "Suspend"
                                ) : (
                                  "Activate"
                                )}
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontWeight: 500,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {joinedDate}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="View staff profile">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedUser(user)}
                            sx={{
                              color: "#64748b",
                              "&:hover": { color: "#0f172a" },
                            }}
                          >
                            <VisibilityRoundedIcon fontSize="small" />
                          </IconButton>
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

      {/* Onboard New Employee Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Onboard New Employee
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
          >
            <Alert
              severity="info"
              sx={{
                bgcolor: "#eff6ff",
                color: "#1e40af",
                border: "1px solid #bfdbfe",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Direct Onboarding Dispatch via Resend
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#1e3a8a", display: "block", lineHeight: 1.4 }}
              >
                Submitting this form calls{" "}
                <code>POST /account/auth/create</code> on the live backend. A
                cryptographically secure random password will be generated and
                dispatched directly to the employee's inbox.
              </Typography>
            </Alert>

            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Full Name"
              placeholder="e.g. Maya Lin"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Work Email Address"
              type="email"
              placeholder="e.g. maya.lin@company.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              required
              helperText="The generated password will be delivered to this email."
            />

            <FormControl fullWidth required>
              <InputLabel>Assigned Workplace Branch</InputLabel>
              <Select
                value={newStoreId}
                label="Assigned Workplace Branch"
                onChange={(e) => setNewStoreId(e.target.value)}
              >
                {stores.length === 0 ? (
                  <MenuItem value="" disabled>
                    No stores registered yet. Please create a store first.
                  </MenuItem>
                ) : (
                  stores.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name} ({s.address})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setCreateModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formSubmitting || stores.length === 0}
              startIcon={
                formSubmitting ? (
                  <CircularProgress size={16} />
                ) : (
                  <SendRoundedIcon />
                )
              }
              sx={{ bgcolor: "#0f172a" }}
            >
              {formSubmitting ? "Dispatching..." : "Dispatch Onboarding"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Staff Detail Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 }, p: 3 } } }}
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
                  bgcolor: selectedUser.isValid ? "#0f172a" : "#cbd5e1",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                }}
              >
                {(selectedUser.name || "U").charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#0f172a" }}
                >
                  {selectedUser.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  {selectedUser.email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#64748b",
                letterSpacing: "0.04em",
                mb: 1.5,
              }}
            >
              Employee Metadata
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  MongoDB ID:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#0f172a",
                    fontSize: "0.8rem",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {selectedUser._id}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Assigned Branch:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#0f172a" }}
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
                  Registered At:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#0f172a", fontVariantNumeric: "tabular-nums" }}
                >
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : "N/A"}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleToggleStatus(selectedUser._id)}
              disabled={togglingUid === selectedUser._id}
              sx={{
                mb: 3,
                borderColor: selectedUser.isValid ? "#fecaca" : "#bbf7d0",
                color: selectedUser.isValid ? "#dc2626" : "#16a34a",
              }}
            >
              {selectedUser.isValid
                ? "Suspend Access"
                : "Validate & Activate Account"}
            </Button>

            <Divider sx={{ mb: 2 }} />

            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#64748b",
                letterSpacing: "0.04em",
                mb: 1.5,
              }}
            >
              Recent Attendance Check-ins (GET /account/admin/attendance/:uid)
            </Typography>

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {loadingUserAtt ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <CircularProgress
                    size={20}
                    sx={{ color: "#2563eb", mb: 1 }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "#64748b", display: "block" }}
                  >
                    Querying employee check-in logs...
                  </Typography>
                </Box>
              ) : userAttendance.length === 0 ? (
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  No attendance records logged for this employee yet.
                </Typography>
              ) : (
                userAttendance.map((log) => {
                  const isWithin = Number(log.distance) <= 100;
                  return (
                    <Box
                      key={log._id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
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
                          sx={{
                            fontWeight: 600,
                            color: "#334155",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {new Date(log.createdAt).toLocaleString()}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: isWithin ? "#16a34a" : "#d97706",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {log.distance}m from store
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          Coords: {log.latitude}, {log.longitude}
                        </Typography>
                        {log.imageUrl && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={
                              <PhotoCameraRoundedIcon sx={{ fontSize: 13 }} />
                            }
                            onClick={() => setInspectingRecord(log)}
                            sx={{ fontSize: "0.7rem", p: 0.25 }}
                          >
                            Photo
                          </Button>
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={() => setSelectedUser(null)}
              sx={{ mt: 2, bgcolor: "#0f172a" }}
            >
              Close Details
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Verification Photo Modal */}
      <VerificationPhotoModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
      />
    </Box>
  );
};
