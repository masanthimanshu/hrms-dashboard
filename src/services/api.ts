import axios from "axios";

export interface Store {
  _id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  storeId: string;
  isValid: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  storeId?: string;
  storeName?: string;
  latitude: string;
  longitude: string;
  distance: string | number;
  imageUrl: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BackendHealthState {
  rootHealth: boolean | null;
  storeHealth: boolean | null;
  authHealth: boolean | null;
  adminHealth?: boolean | null;
  jwtHealth?: boolean | null;
  lastChecked: string | null;
  errorMessage?: string;
}

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}

export const BASE_URL = (
  import.meta.env.VITE_APP_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  ""
).replace(/\/$/, "");

export const CDN_URL = (
  import.meta.env.VITE_APP_CDN_URL ||
  import.meta.env.VITE_CDN_URL ||
  ""
).replace(/\/$/, "");

export const ACCOUNT_ID = (
  import.meta.env.VITE_APP_ACCOUNT_ID ||
  import.meta.env.VITE_ACCOUNT_ID ||
  ""
).trim();

export const hasConfiguredAccountId = Boolean(ACCOUNT_ID);

const KEYS = {
  AUTH: "hrms_auth_token",
  REFRESH: "hrms_refresh_token",
  USER: "hrms_auth_user",
};

// Event bus for notifications
type Severity = "success" | "info" | "warning" | "error";
type NotificationListener = (message: string, severity: Severity) => void;
const listeners: NotificationListener[] = [];

export const notify = (message: string, severity: Severity = "success") => {
  listeners.forEach((listener) => listener(message, severity));
};

export const subscribeNotification = (listener: NotificationListener) => {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

export function formatAttendanceImageUrl(imageUrl?: string): string {
  if (!imageUrl || imageUrl.startsWith("data:") || imageUrl.startsWith("blob:"))
    return imageUrl || "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    if (imageUrl.includes(".amazonaws.com/")) {
      const path = imageUrl.split(".amazonaws.com/")[1];
      if (path && CDN_URL) return `${CDN_URL}/${path.replace(/^\/+/, "")}`;
    }
    return imageUrl;
  }
  return CDN_URL ? `${CDN_URL}/${imageUrl.replace(/^\/+/, "")}` : imageUrl;
}

export function enrichAttendance(
  logs: AttendanceRecord[],
  users: User[],
  stores: Store[],
): AttendanceRecord[] {
  return logs.map((log) => {
    const u = users.find((usr) => usr._id === log.userId);
    const s = u ? stores.find((st) => st._id === u.storeId) : undefined;
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
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const api = axios.create({
  baseURL: BASE_URL || "/app",
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(KEYS.AUTH);
  const refresh = localStorage.getItem(KEYS.REFRESH);
  if (token)
    config.headers.set(
      "authorization",
      token.replace(/^Bearer\s+/i, "").trim(),
    );
  if (refresh)
    config.headers.set("refresh", refresh.replace(/^Bearer\s+/i, "").trim());
  if (ACCOUNT_ID) config.headers.set("account", ACCOUNT_ID);
  return config;
});

function extractArray<T>(data: any, key?: string): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (key && Array.isArray(data?.[key])) return data[key];
  if (key && Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
}

function getErrorMessage(err: unknown, fallback = "Operation failed"): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (Array.isArray(data) && data[0]?.message) return data[0].message;
    if (typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.message === "string") return obj.message;
      if (typeof obj.error === "string") return obj.error;
    }
  }
  return err instanceof Error ? err.message : fallback;
}

class HrmsApiService {
  getCurrentUser(): AuthUser | null {
    const saved = localStorage.getItem(KEYS.USER);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(KEYS.AUTH));
  }

  setSession(auth: string, refresh: string, user: AuthUser) {
    localStorage.setItem(KEYS.AUTH, auth);
    if (refresh) localStorage.setItem(KEYS.REFRESH, refresh);
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(KEYS.AUTH);
    localStorage.removeItem(KEYS.REFRESH);
    localStorage.removeItem(KEYS.USER);
  }

  async login(
    userOrEmail: string,
    pass: string,
  ): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    try {
      const res = await api.post("/account/admin/login", {
        user: userOrEmail,
        pass,
      });

      if (res.data?.authToken) {
        const token = res.data.authToken;
        const user: AuthUser = res.data.user || {
          name: "Scoobies Admin",
          email: userOrEmail,
          role: "ADMIN",
        };
        this.setSession(token, res.data.refreshToken || "", user);
        return { success: true, user, message: "Logged in successfully" };
      }
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Invalid credentials"),
      };
    }
    return { success: false, message: "Invalid credentials" };
  }

  async testHealth(): Promise<BackendHealthState> {
    try {
      const res = await api.get("/health");
      return {
        rootHealth: true,
        storeHealth: res.data?.storeHealth ?? hasConfiguredAccountId,
        authHealth: res.data?.authHealth ?? true,
        adminHealth: res.data?.adminHealth ?? true,
        jwtHealth: res.data?.jwtHealth ?? true,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return {
        rootHealth: false,
        storeHealth: false,
        authHealth: false,
        lastChecked: new Date().toISOString(),
        errorMessage: getErrorMessage(err, "Connection failed"),
      };
    }
  }

  async getStores(): Promise<{ data: Store[]; error?: string }> {
    try {
      const res = await api.get("/account/store/get");
      return { data: extractArray<Store>(res.data, "stores") };
    } catch (err) {
      return {
        data: [],
        error: getErrorMessage(err, "Failed to fetch stores"),
      };
    }
  }

  async createStore(data: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  }) {
    try {
      const res = await api.post("/account/store/create", {
        name: data.name.trim(),
        address: data.address.trim(),
        latitude: String(data.latitude).trim(),
        longitude: String(data.longitude).trim(),
      });
      return {
        success: true,
        store: res.data.store || res.data,
        message: "Workplace location created",
      };
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Failed to create store"),
      };
    }
  }

  async getUsers(): Promise<{ data: User[]; error?: string }> {
    try {
      const res = await api.get("/account/auth/users");
      return { data: extractArray<User>(res.data, "users") };
    } catch (err) {
      return { data: [], error: getErrorMessage(err, "Failed to fetch users") };
    }
  }

  async createUser(data: { name: string; email: string; storeId: string }) {
    try {
      const res = await api.post("/account/auth/create", {
        name: data.name.trim(),
        email: data.email.trim(),
        storeId: data.storeId,
      });
      return {
        success: true,
        user: res.data.user || res.data,
        message: "Staff member onboarded",
      };
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Failed to onboard staff"),
      };
    }
  }

  async toggleUserValidation(uid: string) {
    try {
      const res = await api.post(`/account/auth/validate/${uid}`);
      return { success: true, message: res.data?.message || "Status updated" };
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Failed to update status"),
      };
    }
  }

  async getAdminAttendance(
    uid?: string,
  ): Promise<{ data: AttendanceRecord[]; error?: string }> {
    try {
      const res = await api.get(
        uid ? `/account/admin/attendance/${uid}` : "/account/admin/attendance",
      );
      return { data: extractArray<AttendanceRecord>(res.data, "attendance") };
    } catch (err) {
      return {
        data: [],
        error: getErrorMessage(err, "Failed to fetch attendance"),
      };
    }
  }

  getLiveAttendance(uid?: string) {
    return this.getAdminAttendance(uid);
  }
}

export const apiService = new HrmsApiService();
