import { useState, useEffect, type FC, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Button, Avatar, Divider } from "@mui/material";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { VerificationPhotoModal } from "../components/VerificationPhotoModal";
import type { AttendanceRecord, Store, User } from "../types";
import { apiService, formatAttendanceImageUrl } from "../services/api";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { text: string; isPositive?: boolean };
  onClick?: () => void;
}) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.75,
        borderRadius: 3.5,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.03), 0 6px 12px -2px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              boxShadow: "0 12px 24px -6px rgba(15, 23, 42, 0.08)",
              borderColor: "#cbd5e1",
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#64748b",
            letterSpacing: "0.04em",
            fontSize: "0.72rem",
          }}
        >
          {title}
        </Typography>
        {icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "#f8fafc",
              color: "#334155",
              border: "1px solid #f1f5f9",
              display: "flex",
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.025em",
            mb: 0.75,
          }}
        >
          {value}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {trend && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: trend.isPositive ? "#16a34a" : "#d97706",
                fontSize: "0.75rem",
              }}
            >
              {trend.text}
            </Typography>
          )}
          {trend && subtitle && <span style={{ color: "#cbd5e1" }}>·</span>}
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontSize: "0.75rem" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export const OverviewPage: FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectingRecord, setInspectingRecord] =
    useState<AttendanceRecord | null>(null);

  const loadData = async () => {
    try {
      const [storeRes, userRes, attRes] = await Promise.all([
        apiService.getStores(),
        apiService.getUsers(),
        apiService.getLiveAttendance(),
      ]);
      const storeList = storeRes.data || [];
      const userList = userRes.data || [];
      const attList = attRes.data || [];

      setStores(storeList);
      setUsers(userList);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = users.filter((u) => u.isValid).length;
  const compliantCount = attendance.filter(
    (a) => Number(a.distance) <= 100,
  ).length;
  const complianceRate =
    attendance.length > 0
      ? Math.round((compliantCount / attendance.length) * 100)
      : 100;

  const storeStaffMap: Record<string, number> = {};
  stores.forEach((s) => {
    storeStaffMap[s._id] = users.filter((u) => u.storeId === s._id).length;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 3.5 },
          borderRadius: 4,
          bgcolor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.03), 0 8px 16px -4px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Box>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.35,
              borderRadius: 10,
              bgcolor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.15)",
              color: "#2563eb",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              mb: 1.5,
            }}
          >
            Live Production Gateway
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              mb: 0.5,
            }}
          >
            Workforce Command Center
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 650 }}>
            Live administrative portal connected directly to MongoDB and S3
            storage. Real-time workforce telemetry with zero mock data.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineRoundedIcon />}
            onClick={() => navigate("/employees")}
          >
            Onboard Staff
          </Button>
          <Button variant="outlined" onClick={() => navigate("/stores")}>
            Add Workplace
          </Button>
        </Box>
      </Paper>

      {/* KPI Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2.5,
        }}
      >
        <StatCard
          title="Total Live Employees"
          value={isLoading ? "..." : users.length}
          subtitle={`${activeCount} active · ${users.length - activeCount} pending`}
          trend={{ text: `${activeCount} Verified Active`, isPositive: true }}
          icon={<PeopleAltRoundedIcon fontSize="small" />}
          onClick={() => navigate("/employees")}
        />
        <StatCard
          title="Registered Stores"
          value={isLoading ? "..." : stores.length}
          subtitle="Physical branches mapped"
          trend={{ text: "Live DB records", isPositive: true }}
          icon={<StorefrontRoundedIcon fontSize="small" />}
          onClick={() => navigate("/stores")}
        />
        <StatCard
          title="Attendance Logs"
          value={isLoading ? "..." : attendance.length}
          subtitle="Captured check-in events"
          trend={{ text: "Haversine audited", isPositive: true }}
          icon={<HowToRegRoundedIcon fontSize="small" />}
          onClick={() => navigate("/attendance")}
        />
        <StatCard
          title="Geofence Compliance"
          value={attendance.length > 0 ? `${complianceRate}%` : "N/A"}
          subtitle="Within 100m perimeter"
          trend={{
            text:
              complianceRate >= 80 ? "Perimeter Verified" : "Review Outliers",
            isPositive: complianceRate >= 80,
          }}
          icon={<SecurityRoundedIcon fontSize="small" />}
          onClick={() => navigate("/attendance")}
        />
      </Box>

      {/* Main Split */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
          gap: 2.5,
        }}
      >
        {/* Recent Attendance */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3.5,
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.015em",
                }}
              >
                Recent Attendance Verification
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Live GPS check-ins from database
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate("/attendance")}
              sx={{ color: "#2563eb", fontWeight: 700 }}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {attendance.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                No attendance logs found in backend yet.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/attendance")}
              >
                Open Attendance Page
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {attendance.slice(0, 5).map((log) => {
                const isCompliant = Number(log.distance) <= 100;
                return (
                  <Box
                    key={log._id}
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      border: "1px solid #f1f5f9",
                      bgcolor: "#fbfcfe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: "#f8fafc",
                        borderColor: "#e2e8f0",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        src={formatAttendanceImageUrl(log.imageUrl)}
                        onClick={() => setInspectingRecord(log)}
                        sx={{
                          width: 42,
                          height: 42,
                          cursor: "pointer",
                          border: "2px solid #ffffff",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        {(log.userName || "U").charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: "#0f172a" }}
                        >
                          {log.userName || "Employee"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          {log.storeName || "Branch"} ·{" "}
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          justifyContent: "flex-end",
                        }}
                      >
                        {isCompliant ? (
                          <CheckCircleRoundedIcon
                            sx={{ fontSize: 16, color: "#16a34a" }}
                          />
                        ) : (
                          <WarningAmberRoundedIcon
                            sx={{ fontSize: 16, color: "#d97706" }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: isCompliant ? "#15803d" : "#b45309",
                          }}
                        >
                          {log.distance}m
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: isCompliant ? "#16a34a" : "#d97706",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                        }}
                      >
                        {isCompliant ? "Inside Geofence" : "Out of Bounds"}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Store Distribution & Service Info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              bgcolor: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.015em",
                }}
              >
                Workplace Distribution
              </Typography>
              <Button
                size="small"
                onClick={() => navigate("/stores")}
                sx={{ color: "#2563eb", fontWeight: 700 }}
              >
                Manage
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {stores.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: "#64748b", py: 2, textAlign: "center" }}
              >
                No workplace locations registered.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {stores.map((store) => {
                  const count = storeStaffMap[store._id] || 0;
                  const pct =
                    users.length > 0
                      ? Math.round((count / users.length) * 100)
                      : 0;
                  return (
                    <Box key={store._id}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.75,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "#0f172a" }}
                        >
                          {store.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontWeight: 600 }}
                        >
                          {count} staff ({pct}%)
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 7,
                          width: "100%",
                          bgcolor: "#f1f5f9",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width: `${Math.max(pct, 5)}%`,
                            bgcolor: "#2563eb",
                            borderRadius: 4,
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Backend Info Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: "linear-gradient(135deg, #090d16 0%, #0f172a 100%)",
              color: "#ffffff",
              borderRadius: 3.5,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.35)",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, mb: 0.75, letterSpacing: "-0.015em" }}
            >
              Backend Live Services
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#94a3b8", mb: 2.25, fontSize: "0.82rem" }}
            >
              API gateway connected directly to MongoDB and S3 storage with dual
              JWT auth.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleRoundedIcon
                  sx={{ fontSize: 16, color: "#4ade80" }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "#e2e8f0", fontWeight: 600 }}
                >
                  Automated Resend Email Password Dispatch
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleRoundedIcon
                  sx={{ fontSize: 16, color: "#4ade80" }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "#e2e8f0", fontWeight: 600 }}
                >
                  Haversine Geofencing GPS Verification
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleRoundedIcon
                  sx={{ fontSize: 16, color: "#4ade80" }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "#e2e8f0", fontWeight: 600 }}
                >
                  Direct-to-S3 Presigned Media Pipeline
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <VerificationPhotoModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
      />
    </Box>
  );
};
