/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Store,
  User,
  AttendanceRecord,
  BackendHealthState,
  AuthUser,
  PresignedUploadResponse,
  DistanceResponse,
} from '../types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'hrms_auth_token',
  REFRESH_TOKEN: 'hrms_refresh_token',
  AUTH_USER: 'hrms_auth_user',
};

export const DEFAULT_BASE_URL = 'https://hrms.scoobies.ai/app';
export const CDN_BASE_URL = 'https://d61m0wk4ihaqr.cloudfront.net';
export const S3_BASE_URL = CDN_BASE_URL;

// Haversine formula to compute great-circle distance in meters between two GPS coordinates
export function computeHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
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
  if (!imageUrl) return '';
  if (
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('blob:')
  ) {
    return imageUrl;
  }
  // If imageUrl is already a full S3 URL, route through CloudFront CDN
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    if (imageUrl.includes('hrms-attendance-bucket.s3.ap-south-1.amazonaws.com')) {
      return imageUrl.replace('https://hrms-attendance-bucket.s3.ap-south-1.amazonaws.com', CDN_BASE_URL);
    }
    return imageUrl;
  }
  // Remove leading slash if any
  const cleanKey = imageUrl.replace(/^\/+/, '');
  return `${CDN_BASE_URL}/${cleanKey}`;
}

class HrmsApiService {
  private authToken: string = '';
  private refreshToken: string = '';
  private currentUser: AuthUser | null = null;

  constructor() {
    this.loadFromStorage();
  }

  public loadFromStorage() {
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (savedAuth) this.authToken = savedAuth;

    const savedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (savedRefresh) this.refreshToken = savedRefresh;

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
    this.authToken = auth;
    this.refreshToken = refresh;
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, auth);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  }

  public clearSession() {
    this.authToken = '';
    this.refreshToken = '';
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }

  // 1. AUTHENTICATION: LOGIN
  // Supports both Admin Login (/account/admin/login) and Employee Login (/account/auth/login)
  public async login(
    userOrEmail: string,
    pass: string
  ): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    try {
      const res = await fetch('/api/hrms/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userOrEmail,
          email: userOrEmail,
          pass,
          password: pass,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.authToken) {
        const user: AuthUser = data.user || {
          name: 'Scoobies Admin',
          email: userOrEmail,
          role: 'ADMIN',
        };
        this.setSession(data.authToken, data.refreshToken || '', user);
        return { success: true, user, message: 'Logged in successfully' };
      }

      return {
        success: false,
        message: data.message || data.error || 'Invalid credentials.',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network failure during login',
      };
    }
  }

  // 2. AUTHENTICATION: VERIFY SESSION
  public async verifySession(): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      const res = await fetch('/api/hrms/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.currentUser = { ...this.currentUser, ...data.user };
          localStorage.setItem(
            STORAGE_KEYS.AUTH_USER,
            JSON.stringify(this.currentUser)
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

  // 3. AUTHENTICATION: REFRESH
  public async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const res = await fetch('/api/hrms/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
          Refresh: this.refreshToken,
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

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

  // Diagnostic health check
  public async testHealth(): Promise<BackendHealthState> {
    try {
      const res = await fetch('/api/hrms/status');
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

      const json = await res.json();
      return {
        rootHealth: json.backendOnline ?? false,
        storeHealth: json.storeHealth ?? false,
        authHealth: json.authHealth ?? false,
        adminHealth: json.adminHealth ?? false,
        jwtHealth: json.jwtHealth ?? false,
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
        errorMessage: err instanceof Error ? err.message : 'Connection failed',
      };
    }
  }

  // Helper for authenticated headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }
    if (this.refreshToken) {
      headers.Refresh = this.refreshToken;
    }
    return headers;
  }

  // LIVE STORES API (GET /account/store/get)
  public async getStores(): Promise<{ data: Store[]; error?: string; status?: number }> {
    try {
      const res = await fetch('/api/hrms/stores', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          data: [],
          status: res.status,
          error: json.message || `Failed to fetch live stores (HTTP ${res.status})`,
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
            : 'Unable to connect to live backend',
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
      const res = await fetch('/api/hrms/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(storeInput),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const newStore: Store =
          data.store || data.data || {
            _id: data._id || 'store_' + Date.now(),
            ...storeInput,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        return {
          success: true,
          store: newStore,
          message: 'Workplace location created in live database!',
        };
      } else {
        return {
          success: false,
          message: data.message || `Failed to create store (HTTP ${res.status})`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to reach API',
      };
    }
  }

  // LIVE EMPLOYEES API (GET /account/auth/users)
  public async getUsers(): Promise<{ data: User[]; error?: string; status?: number }> {
    try {
      const res = await fetch('/api/hrms/users', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          data: [],
          status: res.status,
          error: json.message || `Failed to fetch live staff (HTTP ${res.status})`,
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
            : 'Unable to connect to live backend',
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
      const res = await fetch('/api/hrms/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(userInput),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const newUser: User =
          data.user || data.data || {
            _id: data._id || 'user_' + Date.now(),
            name: userInput.name,
            email: userInput.email,
            storeId: userInput.storeId,
            isValid: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        return {
          success: true,
          user: newUser,
          message:
            'Employee onboarded! A secure random password was dispatched to their email via Resend.',
        };
      } else {
        return {
          success: false,
          message: data.message || `Failed to onboard employee (HTTP ${res.status})`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Connection error',
      };
    }
  }

  // LIVE TOGGLE ACCOUNT ACTIVATION (POST /account/auth/validate/:uid)
  public async toggleUserValidation(
    uid: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/hrms/users/validate/${uid}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          success: true,
          message: data.message || 'Account status updated on live database.',
        };
      } else {
        return {
          success: false,
          message: data.message || `Validation toggle failed (HTTP ${res.status})`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  // ADMIN ATTENDANCE (GET /admin/attendance & /account/admin/attendance)
  public async getAdminAttendance(
    uid?: string
  ): Promise<{ data: AttendanceRecord[]; error?: string }> {
    try {
      // First try /api/hrms/admin/attendance
      const url = uid
        ? `/api/hrms/admin/attendance?uid=${uid}`
        : '/api/hrms/admin/attendance';

      const res = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const logs: AttendanceRecord[] = Array.isArray(json)
          ? json
          : json.data || json.attendance || [];
        return { data: logs };
      }

      // Fallback try direct /admin/attendance endpoint
      const altUrl = uid ? `/admin/attendance?uid=${uid}` : '/admin/attendance';
      const altRes = await fetch(altUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (altRes.ok) {
        const json = await altRes.json();
        const logs: AttendanceRecord[] = Array.isArray(json)
          ? json
          : json.data || json.attendance || [];
        return { data: logs };
      }

      const errJson = await res.json().catch(() => ({}));
      return {
        data: [],
        error: errJson.message || `Failed to fetch attendance logs (HTTP ${res.status})`,
      };
    } catch (err) {
      return {
        data: [],
        error: err instanceof Error ? err.message : 'Network error retrieving attendance',
      };
    }
  }

  // Alias for backward compatibility
  public async getLiveAttendance(
    uid?: string
  ): Promise<{ data: AttendanceRecord[]; error?: string }> {
    return this.getAdminAttendance(uid);
  }

  // USER DISTANCE SERVICE (POST /secure/user/distance)
  public async calculateDistance(
    latitude: string,
    longitude: string
  ): Promise<{ distance?: number; error?: string }> {
    try {
      const res = await fetch('/api/hrms/secure/distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.distance === 'number') {
        return { distance: data.distance };
      }
      return { error: data.message || 'Could not calculate distance' };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Distance check failed' };
    }
  }

  // PRESIGNED S3 UPLOAD (POST /secure/upload/image)
  public async requestPresignedUpload(
    textDescription: string = 'Shift Verification Photo'
  ): Promise<{ success: boolean; data?: PresignedUploadResponse; message?: string }> {
    try {
      const res = await fetch('/api/hrms/secure/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        message: json.message || 'Failed to generate S3 presigned URL',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Presigned upload failed',
      };
    }
  }

  // DIRECT S3 BINARY UPLOAD (PUT uploadUrl with Content-Type: image/webp)
  public async uploadBinaryToS3(
    uploadUrl: string,
    imageBlob: Blob
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/webp',
        },
        body: imageBlob,
      });

      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: `S3 upload failed with status ${res.status}` };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Direct S3 upload network failure',
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
      const res = await fetch('/api/hrms/secure/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          message: json.status || 'Attendance recorded successfully!',
        };
      }
      return {
        success: false,
        message: json.error || json.message || 'Failed to submit attendance',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Attendance submission error',
      };
    }
  }

  // ATTENDANCE TODAY (GET /secure/attendance/today)
  public async getTodayAttendance(): Promise<{ data: AttendanceRecord[]; error?: string }> {
    try {
      const res = await fetch('/api/hrms/secure/attendance/today', {
        method: 'GET',
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
