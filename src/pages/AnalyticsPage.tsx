import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Divider, Button } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import { apiService } from "../services/api";
import type { AttendanceRecord, Store } from "../types";

export const AnalyticsPage: FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    Promise.all([apiService.getStores(), apiService.getLiveAttendance()]).then(
      ([storeRes, attRes]) => {
        setStores(storeRes.data || []);
        setAttendance(attRes.data || []);
      },
    );
  }, []);

  const total = attendance.length;
  const compliant = attendance.filter((a) => Number(a.distance) <= 100).length;
  const borderline = attendance.filter(
    (a) => Number(a.distance) > 100 && Number(a.distance) <= 250,
  ).length;
  const outlier = total - compliant - borderline;

  const compliantPct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const borderlinePct = total > 0 ? Math.round((borderline / total) * 100) : 0;
  const outlierPct = total > 0 ? Math.round((outlier / total) * 100) : 0;

  const hourly = [
    { hour: "7 AM", count: 0 },
    { hour: "8 AM", count: 0 },
    { hour: "9 AM", count: 0 },
    { hour: "10 AM", count: 0 },
    { hour: "11 AM", count: 0 },
    { hour: "12 PM", count: 0 },
    { hour: "1 PM+", count: 0 },
  ];

  attendance.forEach((rec) => {
    if (!rec.createdAt) return;
    const h = new Date(rec.createdAt).getHours();
    if (h <= 7) hourly[0].count++;
    else if (h === 8) hourly[1].count++;
    else if (h === 9) hourly[2].count++;
    else if (h === 10) hourly[3].count++;
    else if (h === 11) hourly[4].count++;
    else if (h === 12) hourly[5].count++;
    else hourly[6].count++;
  });

  const maxHour = Math.max(...hourly.map((b) => b.count), 1);

  const storeCheckinMap: Record<string, number> = {};
  attendance.forEach((a) => {
    if (a.storeId)
      storeCheckinMap[a.storeId] = (storeCheckinMap[a.storeId] || 0) + 1;
  });
  const maxStore = Math.max(
    ...stores.map((s) => storeCheckinMap[s._id] || 0),
    1,
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.015em",
            mb: 0.5,
          }}
        >
          Live Workforce Analytics & Compliance Audit
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Real-time metrics computed directly from active staff and database
          attendance events.
        </Typography>
      </Paper>

      {total === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3.5,
            textAlign: "center",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <QueryStatsRoundedIcon
            sx={{ fontSize: 48, color: "#94a3b8", mb: 1.5 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            No Live Attendance Logs Recorded Yet
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
            Once employees begin clocking in, rush hours and accuracy
            distributions will chart here in real-time.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/attendance")}>
            Go to Attendance View
          </Button>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" },
              gap: 2.5,
            }}
          >
            {/* Accuracy circle */}
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 800, color: "#0f172a" }}
                >
                  Live Geofence Accuracy
                </Typography>
                <CheckCircleRoundedIcon sx={{ color: "#16a34a" }} />
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <Box sx={{ position: "relative", width: 170, height: 170 }}>
                  <svg width="170" height="170" viewBox="0 0 170 170">
                    <circle
                      cx="85"
                      cy="85"
                      r="70"
                      stroke="#f1f5f9"
                      strokeWidth="15"
                      fill="transparent"
                    />
                    <circle
                      cx="85"
                      cy="85"
                      r="70"
                      stroke="#16a34a"
                      strokeWidth="15"
                      strokeDasharray={`${(compliantPct / 100) * 440} 440`}
                      strokeLinecap="round"
                      transform="rotate(-90 85 85)"
                      fill="transparent"
                    />
                  </svg>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: "#0f172a",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {compliantPct}%
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#64748b",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                      }}
                    >
                      On-Site Valid
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#16a34a",
                        boxShadow: "0 0 6px #16a34a",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", fontWeight: 600 }}
                    >
                      Strictly On-Site (≤100m)
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 800, color: "#0f172a" }}
                  >
                    {compliant} ({compliantPct}%)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#d97706",
                        boxShadow: "0 0 6px #d97706",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", fontWeight: 600 }}
                    >
                      Near Boundary (100–250m)
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 800, color: "#0f172a" }}
                  >
                    {borderline} ({borderlinePct}%)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#dc2626",
                        boxShadow: "0 0 6px #dc2626",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", fontWeight: 600 }}
                    >
                      Outside Perimeter (&gt;250m)
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 800, color: "#0f172a" }}
                  >
                    {outlier} ({outlierPct}%)
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Hourly */}
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, color: "#0f172a" }}
                  >
                    Clock-in Volume by Hour
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Shift arrival distribution
                  </Typography>
                </Box>
                <AccessTimeRoundedIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  height: 190,
                  px: 1,
                }}
              >
                {hourly.map((b) => (
                  <Box
                    key={b.hour}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      height: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: b.count > 0 ? "#0f172a" : "#94a3b8",
                        fontSize: "0.75rem",
                      }}
                    >
                      {b.count}
                    </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: 38,
                        height: `${Math.max((b.count / maxHour) * 100, 6)}%`,
                        background:
                          b.count > 0
                            ? "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)"
                            : "#f1f5f9",
                        borderRadius: "6px 6px 0 0",
                        transition: "height 0.2s ease",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#64748b",
                        fontWeight: 600,
                        fontSize: "0.72rem",
                      }}
                    >
                      {b.hour}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* Branch Activity */}
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
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 800, color: "#0f172a" }}
                >
                  Live Turnout by Workplace Branch
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Real attendance count recorded per registered location
                </Typography>
              </Box>
              <StorefrontRoundedIcon sx={{ color: "#64748b" }} />
            </Box>
            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {stores.map((store) => {
                const count = storeCheckinMap[store._id] || 0;
                const pct = Math.round((count / maxStore) * 100);
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
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "#0f172a" }}
                      >
                        {store.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {count} check-ins
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        width: "100%",
                        bgcolor: "#f1f5f9",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${Math.max(pct, 4)}%`,
                          background:
                            count > 0
                              ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                              : "#cbd5e1",
                          borderRadius: 4,
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};
