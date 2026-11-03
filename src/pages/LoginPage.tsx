/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import { useHrms } from '../context/HrmsContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useHrms();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Security brute-force limiter
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/overview';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your work email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        setFailedAttempts(0);
        const from = (location.state as any)?.from?.pathname || '/overview';
        navigate(from, { replace: true });
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setErrorMsg(res.message || 'Invalid email or password credentials.');

        // Impose a 30s lockout after 3 consecutive failed attempts
        if (nextAttempts >= 3) {
          setLockoutSeconds(30);
          setErrorMsg('Too many failed login attempts. Account temporarily locked for 30 seconds for security.');
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        backgroundImage:
          'radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.15), transparent 70%)',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 3.5,
          bgcolor: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Brand Lockup */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: '#0f172a',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
              letterSpacing: '-0.03em',
              mb: 1.5,
              boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)',
            }}
          >
            S
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}
          >
            Scoobies Admin Portal
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Workforce Management & Geofenced Attendance
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}
              >
                Work Email Address
              </Typography>
              <TextField
                type="email"
                placeholder="name@scoobies.co.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                disabled={loading || lockoutSeconds > 0}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }}>
                  Admin Password
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#64748b', fontSize: '0.72rem' }}
                >
                  Dual JWT Verified
                </Typography>
              </Box>
              <TextField
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                disabled={loading || lockoutSeconds > 0}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                          ) : (
                            <VisibilityRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                    Remember session on this device
                  </Typography>
                }
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || lockoutSeconds > 0}
              sx={{
                mt: 1,
                py: 1.2,
                bgcolor: '#0f172a',
                fontSize: '0.9rem',
                fontWeight: 700,
                '&:hover': { bgcolor: '#1e293b' },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: '#ffffff' }} />
              ) : lockoutSeconds > 0 ? (
                `Locked (${lockoutSeconds}s)`
              ) : (
                'Sign In to Dashboard'
              )}
            </Button>
          </Box>
        </form>

      </Paper>
    </Box>
  );
};
