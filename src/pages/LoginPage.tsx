import { useState, useEffect, type FC, type SubmitEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { apiService, notify } from "../services/api";

const inputFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#f8fafc",
    borderRadius: 2.25,
    transition: "all 0.15s ease",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#cbd5e1" },
    "&.Mui-focused": {
      bgcolor: "#ffffff",
      "& fieldset": { borderColor: "#2563eb", borderWidth: 1.5 },
      boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
    },
  },
  "& .MuiInputBase-input": { fontSize: "0.9rem", py: 1.3 },
};

export const LoginPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (apiService.isAuthenticated()) {
      const from = (location.state as any)?.from?.pathname || "/overview";
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiService.login(email.trim(), password);
      if (res.success && res.user) {
        notify(`Welcome back, ${res.user.name}!`, "success");
        const from = (location.state as any)?.from?.pathname || "/overview";
        navigate(from, { replace: true });
      } else {
        setErrorMsg(res.message || "Invalid email or password");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#090d16",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        position: "relative",
        overflow: "hidden",
        backgroundImage: `
          radial-gradient(ellipse 90% 60% at 50% -10%, rgba(37, 99, 235, 0.28), transparent 70%),
          radial-gradient(ellipse 60% 40% at 85% 95%, rgba(14, 165, 233, 0.15), transparent 70%),
          radial-gradient(circle, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 24px 24px",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 250,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3.5, sm: 4.5 },
          borderRadius: 4,
          bgcolor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3.5 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.4,
              borderRadius: 20,
              bgcolor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.15)",
              color: "#2563eb",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              mb: 2,
            }}
          >
            <VerifiedUserOutlinedIcon sx={{ fontSize: 13 }} />
            Scoobies HRMS
          </Box>

          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.5rem",
              mx: "auto",
              mb: 1.75,
              boxShadow:
                "0 10px 20px -5px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
            }}
          >
            S
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            Scoobies Admin Portal
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#64748b", fontSize: "0.85rem" }}
          >
            Workforce Management & Geofenced Attendance
          </Typography>
        </Box>

        {errorMsg && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: 2,
              fontSize: "0.825rem",
              alignItems: "center",
              border: "1px solid #fecaca",
            }}
          >
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.75,
                  display: "block",
                  fontSize: "0.78rem",
                }}
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
                disabled={loading}
                sx={inputFieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineRoundedIcon
                          fontSize="small"
                          sx={{ color: "#94a3b8" }}
                        />
                      </InputAdornment>
                    ),
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
                  fontSize: "0.78rem",
                }}
              >
                Admin Password
              </Typography>
              <TextField
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                disabled={loading}
                sx={inputFieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon
                          fontSize="small"
                          sx={{ color: "#94a3b8" }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon
                              fontSize="small"
                              sx={{ color: "#94a3b8" }}
                            />
                          ) : (
                            <VisibilityRoundedIcon
                              fontSize="small"
                              sx={{ color: "#94a3b8" }}
                            />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              endIcon={
                !loading && <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              }
              sx={{
                mt: 1,
                py: 1.35,
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.92rem",
                borderRadius: 2.25,
                boxShadow:
                  "0 4px 12px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                transition: "all 0.15s ease",
                "&:hover": {
                  background:
                    "linear-gradient(180deg, #334155 0%, #1e293b 100%)",
                  boxShadow: "0 6px 16px rgba(15, 23, 42, 0.35)",
                  transform: "translateY(-1px)",
                },
                "&:active": { transform: "translateY(0)" },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: "#ffffff" }} />
              ) : (
                "Sign In to Dashboard"
              )}
            </Button>
          </Box>
        </form>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mt: 3.5,
            pt: 2.5,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "#16a34a",
              boxShadow: "0 0 6px #16a34a",
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.72rem" }}
          >
            Dual JWT Verification · Haversine GPS Audited
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
