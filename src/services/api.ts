/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Store,
  User,
  AttendanceRecord,
  BackendHealthState,
  AuthUser,
  PresignedUploadResponse,
} from "../types";
import {
  BASE_URL,
  CDN_URL,
  ACCOUNT_ID,
  hasConfiguredAccountId,
} from "../config/env";

export const DEFAULT_BASE_URL = BASE_URL;
export const CDN_BASE_URL = CDN_URL;
export const S3_BASE_URL = CDN_BASE_URL;

const STORAGE_KEYS = {
  AUTH_TOKEN: "hrms_auth_token",
  REFRESH_TOKEN: "hrms_refresh_token",
  AUTH_USER: "hrms_auth_user",
};

// Haversine formula to compute great-circle distance in meters between two GPS coordinates
export function computeHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Convert image keys or raw S3 URLs to CloudFront CDN URLs
export function formatAttendanceImageUrl(imageUrl?: string): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
    return imageUrl;
  }
  const cdn = CDN_URL || CDN_BASE_URL;
  if (!cdn) {
    return imageUrl;
  }
  // If imageUrl is already a full S3 or HTTP URL, route through configured CDN URL
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    if (imageUrl.includes(".amazonaws.com/")) {
      const pathAfterBucket = imageUrl.split(".amazonaws.com/")[1];
      if (pathAfterBucket) {
        return `${cdn}/${pathAfterBucket.replace(/^\/+/, "")}`;
      }
    }
    return imageUrl;
  }
  // Remove leading slash if any
  const cleanKey = imageUrl.replace(/^\/+/, "");
  return `${cdn}/${cleanKey}`;
}

class HrmsApiService {
  private authToken: string = "";
  private refreshToken: string = "";
  private currentUser: AuthUser | null = null;

  constructor() {
    this.loadFromStorage();
  }

  public loadFromStorage() {
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (savedAuth) this.authToken = savedAuth.replace(/^Bearer\s+/i, "").trim();

    const savedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (savedRefresh) this.refreshToken = savedRefresh.replace(/^Bearer\s+/i, "").trim();

    const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        this.currentUser = null;
      }
    }
  }

  public getAuthToken(): string {
    return this.authToken;
  }

  public getRefreshToken(): string {
    return this.refreshToken;
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.authToken);
  }

  public setSession(auth: string, refresh: string, user: AuthUser) {
    const cleanAuth = auth.replace(/^Bearer\s+/i, "").trim();
    const cleanRefresh = refresh.replace(/^Bearer\s+/i, "").trim();
    this.authToken = cleanAuth;
    this.refreshToken = cleanRefresh;
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, cleanAuth);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, cleanRefresh);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  }

  public clearSession() {
    this.authToken = "";
    this.refreshToken = "";
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }

  // 1. AUTHENTICATION: LOGIN
  // - Admin Login: POST /account/admin/login strictly requires { "user", "pass" }
  // - Employee Login: POST /account/auth/login strictly requires { "email", "password" }
  // Strict Zod validation on backend rejects any extra keys with 'unrecognized_keys'
  public async login(
    userOrEmail: string,
    pass: string,
  ): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    const trimmedInput = userOrEmail.trim();

    try {
      // Step A: Attempt Admin Login (/account/admin/login)
      const adminUrl = this.getEndpoint(
        "/account/admin/login",
        "/api/hrms/login",
      );
      const adminRes = await fetch(adminUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          user: trimmedInput,
          pass,
        }),
      });

      const adminData = await adminRes.json().catch(() => ({}));

      if (adminRes.ok && (adminData.authToken || adminData.token)) {
        const token = adminData.authToken || adminData.token;
        const refreshToken = adminData.refreshToken || "";
        const user: AuthUser = adminData.user || {
          name: adminData.name || "Scoobies Admin",
          email: trimmedInput,
          role: "ADMIN",
        };
        this.setSession(token, refreshToken, user);
        return { success: true, user, message: "Logged in as Admin successfully!" };
      }

      // Step B: Attempt Employee Login (/account/auth/login)
      const employeeUrl = this.getEndpoint(
        "/account/auth/login",
        "/api/hrms/auth/login",
      );
      const empRes = await fetch(employeeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          email: trimmedInput,
          password: pass,
        }),
      });

      const empData = await empRes.json().catch(() => ({}));

      if (empRes.ok && (empData.authToken || empData.token)) {
        const token = empData.authToken || empData.token;
        const refreshToken = empData.refreshToken || "";
        const user: AuthUser = empData.user || {
          name: empData.name || "Employee",
          email: trimmedInput,
          role: "STAFF",
        };
        this.setSession(token, refreshToken, user);
        return { success: true, user, message: "Logged in successfully!" };
      }

      // Extract clear message from Zod validation or backend errors
      const errorMsg =
        this.extractErrorMessage(adminData) ||
        this.extractErrorMessage(empData) ||
        "Invalid email or password credentials.";

      return {
        success: false,
        message: errorMsg,
      };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : "Network failure during login",
      };
    }
  }

  // 2. AUTHENTICATION: VERIFY SESSION
  public async verifySession(): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      const url = this.getEndpoint("/secure/verify", "/api/hrms/verify");
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.currentUser = { ...this.currentUser, ...data.user };
          localStorage.setItem(
            STORAGE_KEYS.AUTH_USER,
            JSON.stringify(this.currentUser),
          );
        }
        return true;
      }

      // Try refresh if unauthorized
      if (res.status === 401 && this.refreshToken) {
        return await this.refreshTokens();
      }

      this.clearSession();
      return false;
    } catch {
      return Boolean(this.authToken);
    }
  }

  // 3. AUTHENTICATION: REFRESH (GET /jwt/refresh)
  public async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const url = this.getEndpoint("/jwt/refresh", "/api/hrms/refresh");
      let res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      // Fallback to POST if GET is unsupported by the proxy/server
      if (res.status === 404 || res.status === 405) {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.getAuthHeaders(),
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.authToken) {
          this.authToken = data.authToken;
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.authToken);
          if (data.refreshToken) {
            this.refreshToken = data.refreshToken;
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
          }
          return true;
        }
      }

      this.clearSession();
      return false;
    } catch {
      return false;
    }
  }

  // Diagnostic health check (GET /health - no custom headers required per spec)
  public async testHealth(): Promise<BackendHealthState> {
    try {
      const url = this.getEndpoint("/health", "/api/hrms/status");
      // Public health check doesn't require custom headers, preventing CORS preflight rejection
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        return {
          rootHealth: false,
          storeHealth: false,
          authHealth: false,
          adminHealth: false,
          jwtHealth: false,
          lastChecked: new Date().toISOString(),
          errorMessage: `HTTP ${res.status}`,
        };
      }

      const json = await res.json().catch(() => ({}));
      return {
        rootHealth: true,
        storeHealth: json.storeHealth ?? hasConfiguredAccountId,
        authHealth: json.authHealth ?? true,
        adminHealth: json.adminHealth ?? true,
        jwtHealth: json.jwtHealth ?? true,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return {
        rootHealth: false,
        storeHealth: false,
        authHealth: false,
        adminHealth: false,
        jwtHealth: false,
        lastChecked: new Date().toISOString(),
        errorMessage: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }

  // Helper to extract readable error message from backend or Zod responses
  private extractErrorMessage(data: any): string | null {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (Array.isArray(data) && data.length > 0) {
      return data
        .map((d: any) => d.message || d.error || (typeof d === "string" ? d : JSON.stringify(d)))
        .join("; ");
    }
    if (data.message) {
      if (typeof data.message === "string") return data.message;
      if (Array.isArray(data.message)) {
        return data.message
          .map((d: any) => d.message || d.error || (typeof d === "string" ? d : JSON.stringify(d)))
          .join("; ");
      }
    }
    if (data.error) {
      if (typeof data.error === "string") return data.error;
      if (Array.isArray(data.error)) {
        return data.error
          .map((d: any) => d.message || d.error || (typeof d === "string" ? d : JSON.stringify(d)))
          .join("; ");
      }
      if (typeof data.error === "object") {
        return JSON.stringify(data.error);
      }
    }
    if (data.status && typeof data.status === "string" && data.status !== "Success") {
      return data.status;
    }
    return null;
  }

  // Helper for endpoint resolution (direct backend or proxy fallback)
  private getEndpoint(path: string, proxyFallback: string): string {
    if (BASE_URL) {
      return `${BASE_URL}${path}`;
    }
    return proxyFallback;
  }

  // Helper for authenticated headers
  // The HRMS backend Tokens.decodeAuth() expects strictly the raw JWT string without "Bearer "
  // and without duplicate casing keys (which would cause fetch() to comma-join values into malformed JWTs).
  public getAuthHeaders(includeBearer = false): Record<string, string> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.authToken) {
      const cleanToken = this.authToken.replace(/^Bearer\s+/i, "").trim();
      const tokenVal = includeBearer ? `Bearer ${cleanToken}` : cleanToken;
      headers.authorization = tokenVal;
    }
    if (this.refreshToken) {
      headers.refresh = this.refreshToken.replace(/^Bearer\s+/i, "").trim();
    }
    if (ACCOUNT_ID) {
      headers.account = ACCOUNT_ID.trim();
    }
    return headers;
  }

  // Resilient fetch helper: tries raw token first (matching Tokens.decodeAuth spec),
  // and retries with Bearer prefix if 401 Unauthorized is returned.
  public async fetchWithAuth(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const rawHeaders = this.getAuthHeaders(false);
    let res = await fetch(url, {
      ...options,
      headers: {
        ...rawHeaders,
        ...(options.headers || {}),
      },
    });

    // If 401 Unauthorized, retry with Bearer token format
    if (res.status === 401 && this.authToken) {
      const bearerHeaders = this.getAuthHeaders(true);
      const retryRes = await fetch(url, {
        ...options,
        headers: {
          ...bearerHeaders,
          ...(options.headers || {}),
        },
      });
      if (retryRes.ok) {
        res = retryRes;
      }
    }

    return res;
  }

  // LIVE STORES API (GET /account/store/get)
  public async getStores(): Promise<{
    data: Store[];
    error?: string;
    status?: number;
  }> {
    try {
      const url = this.getEndpoint("/account/store/get", "/api/hrms/stores");
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          data: [],
          status: res.status,
          error:
            json.message || `Failed to fetch live stores (HTTP ${res.status})`,
        };
      }

      const stores: Store[] = Array.isArray(json)
        ? json
        : json.data || json.stores || [];
      return { data: stores };
    } catch (err) {
      return {
        data: [],
        error:
          err instanceof Error
            ? `Network error: ${err.message}`
            : "Unable to connect to live backend",
      };
    }
  }

  // LIVE CREATE STORE (POST /account/store/create)
  public async createStore(storeInput: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  }): Promise<{ success: boolean; store?: Store; message?: string }> {
    try {
      const url = this.getEndpoint("/account/store/create", "/api/hrms/stores");
      // Zod schema strictly requires ONLY name, address, latitude, longitude
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          name: storeInput.name.trim(),
          address: storeInput.address.trim(),
          latitude: String(storeInput.latitude).trim(),
          longitude: String(storeInput.longitude).trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const newStore: Store = data.store ||
          data.data || {
            _id: data._id || "store_" + Date.now(),
            name: storeInput.name.trim(),
            address: storeInput.address.trim(),
            latitude: String(storeInput.latitude).trim(),
            longitude: String(storeInput.longitude).trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        return {
          success: true,
          store: newStore,
          message: "Workplace location created in live database!",
        };
      } else {
        return {
          success: false,
          message:
            this.extractErrorMessage(data) ||
            `Failed to create store (HTTP ${res.status})`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to reach API",
      };
    }
  }

  // LIVE EMPLOYEES API (GET /account/auth/users)
  public async getUsers(): Promise<{
    data: User[];
    error?: string;
    status?: number;
  }> {
    try {
      const url = this.getEndpoint("/account/auth/users", "/api/hrms/users");
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          data: [],
          status: res.status,
          error:
            json.message || `Failed to fetch live staff (HTTP ${res.status})`,
        };
      }

      const users: User[] = Array.isArray(json)
        ? json
        : json.data || json.users || [];
      return { data: users };
    } catch (err) {
      return {
        data: [],
        error:
          err instanceof Error
            ? `Network error: ${err.message}`
            : "Unable to connect to live backend",
      };
    }
  }

  // LIVE CREATE EMPLOYEE (POST /account/auth/create)
  public async createUser(userInput: {
    name: string;
    email: string;
    storeId: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const url = this.getEndpoint("/account/auth/create", "/api/hrms/users");
      // Zod schema strictly requires ONLY { name, email, storeId }
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          name: userInput.name.trim(),
          email: userInput.email.trim(),
          storeId: userInput.storeId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const newUser: User = data.user ||
          data.data || {
            _id: data._id || "user_" + Date.now(),
            name: userInput.name.trim(),
            email: userInput.email.trim(),
            storeId: userInput.storeId,
            isValid: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        return {
          success: true,
          user: newUser,
          message:
            "Employee onboarded! A secure random password was dispatched to their email via Resend.",
        };
      } else {
        return {
          success: false,
          message:
            this.extractErrorMessage(data) ||
            `Failed to onboard employee (HTTP ${res.status})`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Connection error",
      };
    }
  }

  // LIVE TOGGLE ACCOUNT ACTIVATION (POST /account/auth/validate/:uid)
  public async toggleUserValidation(
    uid: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const url = this.getEndpoint(
        `/account/auth/validate/${uid}`,
        `/api/hrms/users/validate/${uid}`,
      );
      const res = await fetch(url, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          success: true,
          message: data.message || "Account status updated on live database.",
        };
      } else {
        return {
          success: false,
          message:
            data.message || `Validation toggle failed (HTTP ${res.status})`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Network error",
      };
    }
  }

  // ADMIN ATTENDANCE (GET /account/admin/attendance & /account/admin/attendance/:uid)
  public async getAdminAttendance(
    uid?: string,
  ): Promise<{ data: AttendanceRecord[]; error?: string; status?: number }> {
    try {
      // Per API spec: GET /account/admin/attendance/:uid for single user, or /account/admin/attendance for all
      const path = uid
        ? `/account/admin/attendance/${uid}`
        : "/account/admin/attendance";
      const proxyFallback = uid
        ? `/api/hrms/admin/attendance/${uid}`
        : "/api/hrms/admin/attendance";
      const url = this.getEndpoint(path, proxyFallback);

      let res = await this.fetchWithAuth(url, { method: "GET" });

      // If /account/admin/attendance failed with 404 or 500, fallback to /secure/attendance/all
      if (!res.ok && (res.status === 404 || res.status === 500)) {
        const securePath = uid
          ? `/secure/attendance/user/${uid}`
          : "/secure/attendance/all";
        const fallbackUrl = this.getEndpoint(
          securePath,
          `/api/hrms${securePath}`,
        );
        const altRes = await this.fetchWithAuth(fallbackUrl, { method: "GET" });
        if (altRes.ok) {
          res = altRes;
        } else if (res.status === 404 && altRes.status !== 404) {
          res = altRes;
        }
      }

      // If still not ok and status is 404/500, try /secure/attendance/today
      if (!res.ok && (res.status === 404 || res.status === 500)) {
        const todayUrl = this.getEndpoint(
          "/secure/attendance/today",
          "/api/hrms/secure/attendance/today",
        );
        const todayRes = await this.fetchWithAuth(todayUrl, { method: "GET" });
        if (todayRes.ok) {
          res = todayRes;
        }
      }

      const text = await res.text().catch(() => "");
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (res.ok) {
        let logs: AttendanceRecord[] = [];
        if (Array.isArray(json)) {
          logs = json;
        } else if (json && typeof json === "object") {
          logs = json.data || json.attendance || json.records || [];
        }
        return { data: logs, status: res.status };
      }

      // Format error from JSON or response text
      const extracted = json ? this.extractErrorMessage(json) : null;
      const cleanText = text
        ? text.replace(/<[^>]*>/g, "").trim().slice(0, 200)
        : "";
      const errorMsg =
        extracted ||
        (cleanText && !cleanText.startsWith("<!DOCTYPE") ? cleanText : null) ||
        `Failed to fetch attendance logs (HTTP ${res.status})`;

      console.error("[HRMS Attendance API Error]", {
        url,
        status: res.status,
        response: json || text,
      });

      return {
        data: [],
        status: res.status,
        error: errorMsg,
      };
    } catch (err) {
      return {
        data: [],
        error:
          err instanceof Error
            ? err.message
            : "Network error retrieving attendance",
      };
    }
  }

  // Alias for backward compatibility
  public async getLiveAttendance(
    uid?: string,
  ): Promise<{ data: AttendanceRecord[]; error?: string }> {
    return this.getAdminAttendance(uid);
  }

  // USER DISTANCE SERVICE (POST /secure/user/distance)
  public async calculateDistance(
    latitude: string,
    longitude: string,
  ): Promise<{ distance?: number; error?: string }> {
    try {
      const url = this.getEndpoint(
        "/secure/user/distance",
        "/api/hrms/secure/distance",
      );
      // Zod schema strictly requires ONLY { latitude, longitude }
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          latitude: String(latitude).trim(),
          longitude: String(longitude).trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.distance === "number") {
        return { distance: data.distance };
      }
      return {
        error:
          this.extractErrorMessage(data) ||
          "Could not calculate distance",
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Distance check failed",
      };
    }
  }

  // PRESIGNED S3 UPLOAD (POST /secure/upload/image)
  public async requestPresignedUpload(
    textDescription: string = "Shift Verification Photo",
  ): Promise<{
    success: boolean;
    data?: PresignedUploadResponse;
    message?: string;
  }> {
    try {
      const url = this.getEndpoint(
        "/secure/upload/image",
        "/api/hrms/secure/upload",
      );
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ text: textDescription }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.uploadUrl && json.key) {
        return {
          success: true,
          data: {
            uploadUrl: json.uploadUrl,
            key: json.key,
          },
        };
      }

      return {
        success: false,
        message: json.message || "Failed to generate S3 presigned URL",
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Presigned upload failed",
      };
    }
  }

  // DIRECT S3 BINARY UPLOAD (PUT uploadUrl with Content-Type: image/webp)
  public async uploadBinaryToS3(
    uploadUrl: string,
    imageBlob: Blob,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "image/webp",
        },
        body: imageBlob,
      });

      if (res.ok) {
        return { success: true };
      }
      return {
        success: false,
        error: `S3 upload failed with status ${res.status}`,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Direct S3 upload network failure",
      };
    }
  }

  // ATTENDANCE CHECK-IN (POST /secure/attendance/add)
  public async submitAttendance(payload: {
    latitude: string;
    longitude: string;
    imageUrl: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    storeId?: string;
    storeName?: string;
    distance?: string | number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const url = this.getEndpoint(
        "/secure/attendance/add",
        "/api/hrms/secure/attendance",
      );
      // Zod schema strictly requires ONLY { latitude, longitude, imageUrl }
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          latitude: String(payload.latitude).trim(),
          longitude: String(payload.longitude).trim(),
          imageUrl: payload.imageUrl,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          message: json.status || "Attendance recorded successfully!",
        };
      }
      return {
        success: false,
        message:
          this.extractErrorMessage(json) ||
          "Failed to submit attendance",
      };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : "Attendance submission error",
      };
    }
  }

  // ATTENDANCE TODAY (GET /secure/attendance/today)
  public async getTodayAttendance(): Promise<{
    data: AttendanceRecord[];
    error?: string;
  }> {
    try {
      const url = this.getEndpoint(
        "/secure/attendance/today",
        "/api/hrms/secure/attendance/today",
      );
      const res = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const logs: AttendanceRecord[] = Array.isArray(json)
          ? json
          : json.data || [];
        return { data: logs };
      }
      return { data: [] };
    } catch {
      return { data: [] };
    }
  }
}

export const apiService = new HrmsApiService();
