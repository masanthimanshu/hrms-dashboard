/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Store {
  _id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  storeId: string;
  storeName?: string;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
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
  distance: string | number; // Distance in meters computed by Haversine formula
  imageUrl: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
}

export interface DistanceResponse {
  distance: number;
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
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  storeId?: string;
  storeName?: string;
}

export interface AuthSession {
  authToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresAt: number;
}

export type ViewTab = 'overview' | 'employees' | 'stores' | 'attendance' | 'analytics';

