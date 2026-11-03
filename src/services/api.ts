import axios from "axios";
import type {
  Store,
  User,
  AttendanceRecord,
  BackendHealthState,
  AuthUser,
  PresignedUploadResponse,
} from "../types";
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

export const DEFAULT_BASE_URL = BASE_URL;
export const CDN_BASE_URL = CDN_URL;
export const S3_BASE_URL = CDN_BASE_URL;

const KEYS = {
  AUTH: "hrms_auth_token",
  REFRESH: "hrms_refresh_token",
  USER: "hrms_auth_user",
};

export function computeHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function formatAttendanceImageUrl(imageUrl?: string): string {
  if (!imageUrl || imageUrl.startsWith("data:") || imageUrl.startsWith("blob:"))
    return imageUrl || "";
  const cdn = CDN_URL || CDN_BASE_URL;
  if (!cdn) return imageUrl;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    if (imageUrl.includes(".amazonaws.com/")) {
      const path = imageUrl.split(".amazonaws.com/")[1];
      if (path) return `${cdn}/${path.replace(/^\/+/, "")}`;
    }
    return imageUrl;
  }
  return `${cdn}/${imageUrl.replace(/^\/+/, "")}`;
}

const api = axios.create({
  baseURL: BASE_URL || "/api/hrms",
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
  if (ACCOUNT_ID) config.headers.set("account", ACCOUNT_ID.trim());
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
    if (Array.isArray(data) && data[0]?.message)
      return data.map((d: any) => d.message).join("; ");
    if (data.message)
      return typeof data.message === "string"
        ? data.message
        : JSON.stringify(data.message);
    if (data.error)
      return typeof data.error === "string"
        ? data.error
        : JSON.stringify(data.error);
  }
  return err instanceof Error ? err.message : fallback;
}

class HrmsApiService {
  getCurrentUser(): AuthUser | null {
    try {
      const u = localStorage.getItem(KEYS.USER);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(KEYS.AUTH));
  }

  setSession(auth: string, refresh: string, user: AuthUser) {
    const cleanAuth = auth.replace(/^Bearer\s+/i, "").trim();
    const cleanRefresh = refresh.replace(/^Bearer\s+/i, "").trim();
    localStorage.setItem(KEYS.AUTH, cleanAuth);
    localStorage.setItem(KEYS.REFRESH, cleanRefresh);
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
    const trimmed = userOrEmail.trim();
    // 1. Try Admin Login
    try {
      const res = await api.post("/account/admin/login", {
        user: trimmed,
        pass,
      });
      const token = res.data.authToken || res.data.token;
      if (token) {
        const user: AuthUser = res.data.user || {
          name: res.data.name || "Scoobies Admin",
          email: trimmed,
          role: "ADMIN",
        };
        this.setSession(token, res.data.refreshToken || "", user);
        return { success: true, user, message: "Logged in successfully" };
      }
    } catch {
      // Fallback to employee login
    }

    // 2. Try Employee Login
    try {
      const res = await api.post("/account/auth/login", {
        email: trimmed,
        password: pass,
      });
      const token = res.data.authToken || res.data.token;
      if (token) {
        const user: AuthUser = res.data.user || {
          name: res.data.name || "Employee",
          email: trimmed,
          role: "STAFF",
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

  async verifySession(): Promise<boolean> {
    if (!this.isAuthenticated()) return false;
    try {
      const res = await api.get("/secure/verify");
      if (res.data?.user) {
        const user = { ...this.getCurrentUser(), ...res.data.user };
        localStorage.setItem(KEYS.USER, JSON.stringify(user));
      }
      return true;
    } catch {
      return this.refreshTokens();
    }
  }

  async refreshTokens(): Promise<boolean> {
    const refresh = localStorage.getItem(KEYS.REFRESH);
    if (!refresh) return false;
    try {
      const res = await api.get("/jwt/refresh");
      if (res.data?.authToken) {
        localStorage.setItem(KEYS.AUTH, res.data.authToken);
        if (res.data.refreshToken)
          localStorage.setItem(KEYS.REFRESH, res.data.refreshToken);
        return true;
      }
      this.clearSession();
      return false;
    } catch {
      this.clearSession();
      return false;
    }
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
      return {
        data: extractArray<Store>(res.data, "stores"),
      };
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
      return {
        data: extractArray<User>(res.data, "users"),
      };
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
      return {
        data: extractArray<AttendanceRecord>(res.data, "attendance"),
      };
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

  async calculateDistance(latitude: string, longitude: string) {
    try {
      const res = await api.post("/secure/user/distance", {
        latitude: String(latitude).trim(),
        longitude: String(longitude).trim(),
      });
      return { distance: res.data.distance };
    } catch (err) {
      return { error: getErrorMessage(err, "Distance check failed") };
    }
  }

  async requestPresignedUpload(text = "Shift Verification Photo"): Promise<{
    success: boolean;
    data?: PresignedUploadResponse;
    message?: string;
  }> {
    try {
      const res = await api.post("/secure/upload/image", { text });
      return {
        success: true,
        data: { uploadUrl: res.data.uploadUrl, key: res.data.key },
      };
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Upload request failed"),
      };
    }
  }

  async uploadBinaryToS3(uploadUrl: string, imageBlob: Blob) {
    try {
      await axios.put(uploadUrl, imageBlob, {
        headers: { "Content-Type": "image/webp" },
      });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: getErrorMessage(err, "S3 upload failed"),
      };
    }
  }

  async submitAttendance(payload: {
    latitude: string;
    longitude: string;
    imageUrl: string;
  }) {
    try {
      const res = await api.post("/secure/attendance/add", {
        latitude: String(payload.latitude).trim(),
        longitude: String(payload.longitude).trim(),
        imageUrl: payload.imageUrl,
      });
      return {
        success: true,
        message: res.data?.status || "Attendance recorded",
      };
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Failed to submit attendance"),
      };
    }
  }

  async getTodayAttendance(): Promise<{ data: AttendanceRecord[] }> {
    try {
      const res = await api.get("/secure/attendance/today");
      return {
        data: Array.isArray(res.data) ? res.data : res.data?.data || [],
      };
    } catch {
      return { data: [] };
    }
  }
}

export const apiService = new HrmsApiService();
