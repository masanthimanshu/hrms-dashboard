/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import { StatCard } from '../components/StatCard';
import { VerificationPhotoModal } from '../components/VerificationPhotoModal';
import { useHrms } from '../context/HrmsContext';
import { AttendanceRecord } from '../types';
import { formatAttendanceImageUrl } from '../services/api';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { stores, users, attendance, isLoading, hasAccountId, storesError } = useHrms();
  const [inspectingRecord, setInspectingRecord] = useState<AttendanceRecord | null>(null);

  const activeUsersCount = users.filter((u) => u.isValid).length;
  const pendingUsersCount = users.length - activeUsersCount;

  // Real-time compliance calculation from live attendance
  const withinGeofenceCount = attendance.filter(
    (a) => Number(a.distance) <= 100
  ).length;
  const complianceRate =
    attendance.length > 0
      ? Math.round((withinGeofenceCount / attendance.length) * 100)
      : 100;

  // Real-time staff per store
  const storeStaffMap: Record<string, number> = {};
  stores.forEach((s) => {
    storeStaffMap[s._id] = users.filter((u) => u.storeId === s._id).length;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Welcome Banner */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2.5, sm: 3 },
          bgcolor: '#ffffff',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}
          >
            Live Workforce Command Center
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 650 }}>
            Live administrative console connected to <strong>https://hrms.scoobies.ai/app</strong>.
            All statistics and data tables are retrieved in real-time with zero mock data.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineRoundedIcon />}
            onClick={() => navigate('/employees')}
            sx={{ bgcolor: '#0f172a' }}
          >
            Onboard Staff
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/stores')}
            sx={{
              borderColor: '#cbd5e1',
              color: '#334155',
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            Add Workplace
          </Button>
        </Box>
      </Paper>

      {/* If no Account ID configured */}
      {!hasAccountId && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <KeyRoundedIcon sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Configure Live Backend Credentials
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 500, mx: 'auto', mb: 2 }}>
            Please ensure your administrative <code>ACCOUNT_ID</code> is configured to stream live employee rosters and store records.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/settings')}
            sx={{ bgcolor: '#0f172a' }}
          >
            Go to Settings & Configure Key
          </Button>
        </Paper>
      )}

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        <StatCard
          title="Total Live Employees"
          value={isLoading ? '...' : users.length}
          subtitle={`${activeUsersCount} active · ${pendingUsersCount} pending`}
          trend={{ text: `${activeUsersCount} Verified Active`, isPositive: true }}
          icon={<PeopleAltRoundedIcon fontSize="small" />}
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title="Registered Stores"
          value={isLoading ? '...' : stores.length}
          subtitle="Physical branches mapped"
          trend={{ text: 'Live database records', isPositive: true }}
          icon={<StorefrontRoundedIcon fontSize="small" />}
          onClick={() => navigate('/stores')}
        />
        <StatCard
          title="Attendance Logs"
          value={isLoading ? '...' : attendance.length}
          subtitle="Captured check-in events"
          trend={{ text: 'Live GPS verified', isPositive: true }}
          icon={<HowToRegRoundedIcon fontSize="small" />}
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Geofence Compliance"
          value={attendance.length > 0 ? `${complianceRate}%` : 'N/A'}
          subtitle="Within 100m of store"
          trend={{
            text: complianceRate >= 80 ? 'Within Safe Perimeter' : 'Review Outliers',
            isPositive: complianceRate >= 80,
          }}
          icon={<SecurityRoundedIcon fontSize="small" />}
          onClick={() => navigate('/attendance')}
        />
      </Box>

      {/* Main Content Split: Live Attendance & Store Breakdown */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
          gap: 2.5,
        }}
      >
        {/* Left Column: Real-time Attendance Feed */}
        <Paper elevation={1} sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Recent Attendance Verification
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Real-time check-ins with Haversine distance from live MongoDB database
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/attendance')}
              sx={{ color: '#2563eb' }}
            >
              View Full Feed
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {attendance.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                No attendance logs found in the live backend yet.
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                Attendance records appear here automatically when employees check in via the mobile app using <code>/secure/attendance/add</code>.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/attendance')}
              >
                Open Geofence Distance Tool
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {attendance.slice(0, 5).map((log) => {
                const distNum = Number(log.distance);
                const isCompliant = distNum <= 100;
                const formattedTime = new Date(log.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <Box
                    key={log._id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid #f1f5f9',
                      bgcolor: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: '#f1f5f9',
                        borderColor: '#e2e8f0',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar
                        src={formatAttendanceImageUrl(log.imageUrl)}
                        alt={log.userName}
                        onClick={() => setInspectingRecord(log)}
                        sx={{
                          width: 42,
                          height: 42,
                          cursor: 'pointer',
                          border: '2px solid #ffffff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        {log.userName ? log.userName.charAt(0) : 'U'}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}
                        >
                          {log.userName || 'Employee'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: '#64748b', display: 'block' }}
                        >
                          {log.storeName || 'Branch'} · {formattedTime}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        {isCompliant ? (
                          <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                        ) : (
                          <WarningAmberRoundedIcon sx={{ fontSize: 16, color: '#d97706' }} />
                        )}
                        <Typography
                          variant="body2"
                          className="tabular-nums font-mono-numbers"
                          sx={{
                            fontWeight: 700,
                            color: isCompliant ? '#15803d' : '#b45309',
                          }}
                        >
                          {log.distance}m
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: isCompliant ? '#16a34a' : '#d97706',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                        }}
                      >
                        {isCompliant ? 'Inside Geofence' : 'Out of Bounds'}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Right Column: Store Workforce Allocation */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Paper elevation={1} sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Workplace Distribution
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/stores')}
                sx={{ color: '#2563eb' }}
              >
                Manage
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {stores.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                  No workplace locations registered on live backend.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/stores')}
                  sx={{ bgcolor: '#0f172a' }}
                >
                  Register First Store
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stores.map((store) => {
                  const count = storeStaffMap[store._id] || 0;
                  const percentage =
                    users.length > 0 ? Math.round((count / users.length) * 100) : 0;

                  return (
                    <Box key={store._id}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: '#0f172a' }}
                        >
                          {store.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="tabular-nums"
                          sx={{ color: '#64748b', fontWeight: 600 }}
                        >
                          {count} staff ({percentage}%)
                        </Typography>
                      </Box>

                      {/* Progress bar */}
                      <Box
                        sx={{
                          height: 6,
                          width: '100%',
                          bgcolor: '#f1f5f9',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${Math.max(percentage, 4)}%`,
                            bgcolor: '#2563eb',
                            borderRadius: 3,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', mt: 0.25 }}
                      >
                        GPS Anchor: {store.latitude}, {store.longitude}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Backend Info Card */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              bgcolor: '#0f172a',
              color: '#ffffff',
              borderRadius: 3,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Backend Live Service Information
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 2 }}
            >
              Real-time API gateway at <strong>https://hrms.scoobies.ai/app</strong>.
              All operations execute directly on the live MongoDB database.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                  Automated Resend Onboarding Email Delivery
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                  Haversine Geofencing GPS Distance Calculation
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                  Direct-to-S3 Presigned Media Pipeline
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Verification Photo Modal */}
      <VerificationPhotoModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
      />
    </Box>
  );
};
