import { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import { theme } from "./theme";
import { Layout } from "./components/Layout";
import { apiService, subscribeNotification } from "./services/api";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const OverviewPage = lazy(() =>
  import("./pages/OverviewPage").then((m) => ({ default: m.OverviewPage })),
);
const EmployeesPage = lazy(() =>
  import("./pages/EmployeesPage").then((m) => ({ default: m.EmployeesPage })),
);
const StoresPage = lazy(() =>
  import("./pages/StoresPage").then((m) => ({ default: m.StoresPage })),
);
const AttendancePage = lazy(() =>
  import("./pages/AttendancePage").then((m) => ({ default: m.AttendancePage })),
);
const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

function RouteLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
      }}
    >
      <CircularProgress size={32} sx={{ color: "#0f172a" }} />
    </Box>
  );
}

function ProtectedRoute() {
  const isAuth = apiService.isAuthenticated();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

export default function App() {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    return subscribeNotification((message, severity) => {
      setSnackbar({ open: true, message, severity });
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="stores" element={<StoresPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
