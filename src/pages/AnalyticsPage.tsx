/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Divider, Button } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import { useHrms } from "../context/HrmsContext";

export const AnalyticsPage: FC = () => {
  const navigate = useNavigate();
  const { stores, attendance } = useHrms();

  // 1. Geofence Compliance stats from live attendance
  const totalLogs = attendance.length;
  const compliantLogs = attendance.filter(
    (a) => Number(a.distance) <= 100,
  ).length;
  const borderlineLogs = attendance.filter(
    (a) => Number(a.distance) > 100 && Number(a.distance) <= 250,
  ).length;
  const outlierLogs = totalLogs - compliantLogs - borderlineLogs;

  const compliantPct =
    totalLogs > 0 ? Math.round((compliantLogs / totalLogs) * 100) : 0;
  const borderlinePct =
    totalLogs > 0 ? Math.round((borderlineLogs / totalLogs) * 100) : 0;
  const outlierPct =
    totalLogs > 0 ? Math.round((outlierLogs / totalLogs) * 100) : 0;

  // 2. Clock-in hourly distribution
  const hourlyBuckets = [
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
    const date = new Date(rec.createdAt);
    const h = date.getHours();
    if (h <= 7) hourlyBuckets[0].count++;
    else if (h === 8) hourlyBuckets[1].count++;
    else if (h === 9) hourlyBuckets[2].count++;
    else if (h === 10) hourlyBuckets[3].count++;
    else if (h === 11) hourlyBuckets[4].count++;
    else if (h === 12) hourlyBuckets[5].count++;
    else hourlyBuckets[6].count++;
  });

  const maxHourCount = Math.max(...hourlyBuckets.map((b) => b.count), 1);

  // 3. Store check-ins breakdown
  const storeCheckinMap: Record<string, number> = {};
  attendance.forEach((a) => {
    if (a.storeId) {
      storeCheckinMap[a.storeId] = (storeCheckinMap[a.storeId] || 0) + 1;
    }
  });

  const maxStoreCount = Math.max(
    ...stores.map((s) => storeCheckinMap[s._id] || 0),
    1,
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Overview Intro */}
      <Paper
        elevation={1}
        sx={{ p: 2.5, bgcolor: "#ffffff", borderRadius: 2.5 }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}
        >
          Live Workforce Analytics & Compliance Audit
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Real-time metrics computed directly from active staff and MongoDB
          attendance events.
        </Typography>
      </Paper>

      {totalLogs === 0 ? (
        <Paper
          elevation={1}
          sx={{ p: 6, borderRadius: 3, textAlign: "center" }}
        >
          <QueryStatsRoundedIcon
            sx={{ fontSize: 48, color: "#94a3b8", mb: 1.5 }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}
          >
            No Live Attendance Logs Recorded Yet
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#64748b", maxWidth: 460, mx: "auto", mb: 2 }}
          >
            Once employees begin clocking in via the mobile app, arrival rush
            hours and geofence accuracy distributions will chart here in
            real-time.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/attendance")}
            sx={{ bgcolor: "#0f172a" }}
          >
            Go to Attendance View
          </Button>
        </Paper>
      ) : (
        <>
          {/* Row 1: Geofence Compliance & Hourly Distribution */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" },
              gap: 2.5,
            }}
          >
            {/* Geofence Scorecard */}
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 2.5,
                display: "flex",
                flexDirection: "column",
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
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#0f172a" }}
                >
                  Live Geofence Accuracy
                </Typography>
                <CheckCircleRoundedIcon sx={{ color: "#16a34a" }} />
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              {/* Circular representation */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  my: 2,
                }}
              >
                <Box sx={{ position: "relative", width: 170, height: 170 }}>
                  <svg width="170" height="170" viewBox="0 0 170 170">
                    <circle
                      cx="85"
                      cy="85"
                      r="70"
                      stroke="#e2e8f0"
                      strokeWidth="16"
                      fill="transparent"
                    />
                    <circle
                      cx="85"
                      cy="85"
                      r="70"
                      stroke="#16a34a"
                      strokeWidth="16"
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
                        lineHeight: 1,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {compliantPct}%
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748b", fontWeight: 600 }}
                    >
                      On-Site Valid
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Breakdown */}
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
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#16a34a",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", fontWeight: 500 }}
                    >
                      Strictly On-Site (&le;100m)
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {compliantLogs} ({compliantPct}%)
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#d97706",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", fontWeight: 500 }}
                    >
                      Near Boundary (100–250m)
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {borderlineLogs} ({borderlinePct}%)
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#dc2626",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", fontWeight: 500 }}
                    >
                      Outside Perimeter (&gt;250m)
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {outlierLogs} ({outlierPct}%)
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Hourly Distribution */}
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 2.5,
                display: "flex",
                flexDirection: "column",
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
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "#0f172a" }}
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
                  gap: { xs: 1, sm: 2 },
                  height: 200,
                  pt: 2,
                  pb: 1,
                  px: 1,
                }}
              >
                {hourlyBuckets.map((bucket) => {
                  const heightPct = Math.max(
                    (bucket.count / maxHourCount) * 100,
                    6,
                  );
                  return (
                    <Box
                      key={bucket.hour}
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
                          fontWeight: 700,
                          color: bucket.count > 0 ? "#0f172a" : "#94a3b8",
                          fontSize: "0.75rem",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {bucket.count}
                      </Typography>

                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: 38,
                          height: `${heightPct}%`,
                          bgcolor: bucket.count > 0 ? "#2563eb" : "#f1f5f9",
                          borderRadius: "6px 6px 2px 2px",
                          transition: "height 0.3s ease",
                        }}
                      />

                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {bucket.hour}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>

          {/* Row 2: Branch Activity */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2.5 }}>
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
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#0f172a" }}
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

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {stores.map((store) => {
                const count = storeCheckinMap[store._id] || 0;
                const pct = Math.round((count / maxStoreCount) * 100);

                return (
                  <Box key={store._id}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.75,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: "#0f172a" }}
                        >
                          {store.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          {store.address}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "#0f172a",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {count} check-ins
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        height: 10,
                        width: "100%",
                        bgcolor: "#f1f5f9",
                        borderRadius: 5,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${Math.max(pct, 4)}%`,
                          bgcolor: count > 0 ? "#3b82f6" : "#cbd5e1",
                          borderRadius: 5,
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
