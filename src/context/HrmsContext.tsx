/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type FC,
  type ReactNode,
} from "react";
import type {
  Store,
  User,
  AttendanceRecord,
  AuthUser,
  PresignedUploadResponse,
} from "../types";
import { apiService } from "../services/api";
import { hasConfiguredAccountId } from "../config/env";

interface HrmsContextType {
  stores: Store[];
  users: User[];
  attendance: AttendanceRecord[];
  isLoading: boolean;
  lastUpdated: Date;
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  hasAccountId: boolean;
  backendOnline: boolean;
  storesError: string | null;
  usersError: string | null;
  attendanceError: string | null;
  login: (
    userOrEmail: string,
    pass: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshData: (silent?: boolean) => Promise<void>;
  createStore: (storeInput: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  }) => Promise<{ success: boolean; message?: string }>;
  createUser: (userInput: {
    name: string;
    email: string;
    storeId: string;
  }) => Promise<{ success: boolean; message?: string }>;
  toggleUserValidation: (
    uid: string,
  ) => Promise<{ success: boolean; message?: string }>;
  getAttendanceForUser: (uid: string) => Promise<AttendanceRecord[]>;
  getAdminAttendance: (uid?: string) => Promise<AttendanceRecord[]>;
  calculateDistance: (
    lat: string,
    lng: string,
  ) => Promise<{ distance?: number; error?: string }>;
  requestPresignedUpload: (desc?: string) => Promise<{
    success: boolean;
    data?: PresignedUploadResponse;
    message?: string;
  }>;
  uploadBinaryToS3: (
    url: string,
    blob: Blob,
  ) => Promise<{ success: boolean; error?: string }>;
  submitAttendance: (payload: {
    latitude: string;
    longitude: string;
    imageUrl: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    storeId?: string;
    storeName?: string;
    distance?: string | number;
  }) => Promise<{ success: boolean; message?: string }>;
  getTodayAttendance: () => Promise<AttendanceRecord[]>;
  showNotification: (
    message: string,
    severity?: "success" | "info" | "warning" | "error",
  ) => void;
}

const HrmsContext = createContext<HrmsContextType | undefined>(undefined);

export const HrmsProvider: FC<{
  children: ReactNode;
  notify: (msg: string, sev?: "success" | "info" | "warning" | "error") => void;
}> = ({ children, notify }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    apiService.getCurrentUser(),
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    apiService.isAuthenticated(),
  );
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [hasAccountId, setHasAccountId] = useState<boolean>(
    () => hasConfiguredAccountId,
  );

  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  const [storesError, setStoresError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // Check and verify session on initial mount
  useEffect(() => {
    let mounted = true;

    async function checkStatusAndAuth() {
      try {
        const health = await apiService.testHealth();
        if (mounted) {
          if (health.storeHealth !== null) {
            setHasAccountId(Boolean(health.storeHealth));
          }
          if (health.rootHealth !== null) {
            setBackendOnline(Boolean(health.rootHealth));
          }
        }
      } catch {
        // Ignore status fetch failures
      }

      try {
        const isValid = await apiService.verifySession();
        if (mounted) {
          setIsAuthenticated(isValid);
          setCurrentUser(apiService.getCurrentUser());
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          setIsAuthChecking(false);
        }
      }
    }

    checkStatusAndAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const refreshData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);

      try {
        const [storeRes, userRes, attRes] = await Promise.all([
          apiService.getStores(),
          apiService.getUsers(),
          apiService.getLiveAttendance(),
        ]);

        setStores(storeRes.data);
        setStoresError(storeRes.error || null);

        setUsers(userRes.data);
        setUsersError(userRes.error || null);

        // Enrich attendance records with user & store names
        const enrichedLogs: AttendanceRecord[] = attRes.data.map((log) => {
          const user = userRes.data.find((u) => u._id === log.userId);
          const store = user
            ? storeRes.data.find((s) => s._id === user.storeId)
            : undefined;

          return {
            ...log,
            userName:
              log.userName ||
              user?.name ||
              `Staff (${log.userId?.slice(-6) || "Unknown"})`,
            userEmail: log.userEmail || user?.email || "",
            storeId: log.storeId || user?.storeId || "",
            storeName: log.storeName || store?.name || "Assigned Branch",
          };
        });

        setAttendance(enrichedLogs);
        setAttendanceError(attRes.error || null);

        setLastUpdated(new Date());

        if (!silent) {
          if (attRes.error || storeRes.error || userRes.error) {
            notify(
              attRes.error || storeRes.error || userRes.error || "Live synchronization notice",
              "warning",
            );
          } else {
            notify("Live backend data synchronized successfully", "success");
          }
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to reach backend";
        setStoresError(msg);
        setUsersError(msg);
        setAttendanceError(msg);
        if (!silent) notify(msg, "error");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [notify],
  );

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshData(true);
    }
  }, [isAuthenticated, refreshData]);

  // Periodic polling every 20 seconds when tab is active for real-time live synchronization
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshData(true);
      }
    }, 20000);

    const handleFocus = () => {
      refreshData(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, refreshData]);

  const login = async (userOrEmail: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiService.login(userOrEmail, pass);
      if (res.success && res.user) {
        setIsAuthenticated(true);
        setCurrentUser(res.user);
        notify(`Welcome back, ${res.user.name || res.user.email}!`, "success");
        await refreshData(true);
        return { success: true };
      } else {
        notify(
          res.message || "Login failed. Please check credentials.",
          "error",
        );
        return { success: false, message: res.message };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.clearSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setStores([]);
    setUsers([]);
    setAttendance([]);
    notify("You have been signed out securely.", "info");
  };

  const createStore = async (storeInput: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  }) => {
    const res = await apiService.createStore(storeInput);
    if (res.success) {
      await refreshData(true);
      notify(
        res.message || "Workplace location created in live database!",
        "success",
      );
    } else {
      notify(res.message || "Failed to create workplace location", "error");
    }
    return res;
  };

  const createUser = async (userInput: {
    name: string;
    email: string;
    storeId: string;
  }) => {
    const res = await apiService.createUser(userInput);
    if (res.success) {
      await refreshData(true);
      notify(
        res.message ||
          "Staff member onboarded! Password dispatched to email via Resend.",
        "success",
      );
    } else {
      notify(res.message || "Failed to onboard staff member", "error");
    }
    return res;
  };

  const toggleUserValidation = async (uid: string) => {
    const res = await apiService.toggleUserValidation(uid);
    if (res.success) {
      await refreshData(true);
      notify(
        res.message || "Account status toggled on live database!",
        "success",
      );
    } else {
      notify(res.message || "Failed to toggle validation", "error");
    }
    return res;
  };

  const getAttendanceForUser = async (
    uid: string,
  ): Promise<AttendanceRecord[]> => {
    const res = await apiService.getLiveAttendance(uid);
    if (res.data) {
      const user = users.find((u) => u._id === uid);
      const store = user
        ? stores.find((s) => s._id === user.storeId)
        : undefined;
      return res.data.map((log) => ({
        ...log,
        userName: user?.name || log.userName || `Staff (${uid.slice(-6)})`,
        userEmail: user?.email || log.userEmail || "",
        storeName: store?.name || log.storeName || "Assigned Branch",
      }));
    }
    return [];
  };

  const getAdminAttendance = async (
    uid?: string,
  ): Promise<AttendanceRecord[]> => {
    const res = await apiService.getAdminAttendance(uid);
    return res.data;
  };

  const calculateDistance = async (lat: string, lng: string) => {
    return apiService.calculateDistance(lat, lng);
  };

  const requestPresignedUpload = async (desc?: string) => {
    return apiService.requestPresignedUpload(desc);
  };

  const uploadBinaryToS3 = async (url: string, blob: Blob) => {
    return apiService.uploadBinaryToS3(url, blob);
  };

  const submitAttendance = async (payload: {
    latitude: string;
    longitude: string;
    imageUrl: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    storeId?: string;
    storeName?: string;
    distance?: string | number;
  }) => {
    const res = await apiService.submitAttendance(payload);
    if (res.success) {
      await refreshData(true);
      notify(
        res.message || "Attendance verified and saved successfully!",
        "success",
      );
    } else {
      notify(res.message || "Failed to record attendance", "error");
    }
    return res;
  };

  const getTodayAttendance = async () => {
    const res = await apiService.getTodayAttendance();
    return res.data;
  };

  return (
    <HrmsContext.Provider
      value={{
        stores,
        users,
        attendance,
        isLoading,
        lastUpdated,
        currentUser,
        isAuthenticated,
        isAuthChecking,
        hasAccountId,
        backendOnline,
        storesError,
        usersError,
        attendanceError,
        login,
        logout,
        refreshData,
        createStore,
        createUser,
        toggleUserValidation,
        getAttendanceForUser,
        getAdminAttendance,
        calculateDistance,
        requestPresignedUpload,
        uploadBinaryToS3,
        submitAttendance,
        getTodayAttendance,
        showNotification: notify,
      }}
    >
      {children}
    </HrmsContext.Provider>
  );
};

export const useHrms = () => {
  const context = useContext(HrmsContext);
  if (!context) {
    throw new Error("useHrms must be used within HrmsProvider");
  }
  return context;
};
