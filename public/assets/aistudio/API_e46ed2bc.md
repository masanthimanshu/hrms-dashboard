# HRMS Backend API Reference

This document provides complete, exhaustive endpoint specifications for the HRMS Backend REST API, covering required headers, route parameters, request bodies, and response schemas.

---

## Authentication Schemes

The API uses two header-based access control mechanisms:

1. **Account Key Guard (`/account/*`)**
   - Header: `account: <ACCOUNT_ID>`
   - Authenticates administrative operations and onboarding actions. Must match the server's `ACCOUNT_ID` environment variable.

2. **Dual JWT Guard (`/secure/*`)**
   - Header: `authorization: <AUTH_TOKEN>`
   - Header: `refresh: <REFRESH_TOKEN>`
   - Both tokens are verified on every secure request. Issued upon employee login (`/account/auth/login`) or admin login (`/account/admin/login`).

3. **Admin Attendance Guard (`/account/admin/attendance/*`)**
   - Requires both the `account: <ACCOUNT_ID>` header and an administrative JWT `authorization: <ADMIN_AUTH_TOKEN>` header.

---

## Table of Contents

- [System & Health](#system--health)
- [JWT Service](#jwt-service)
- [Store Management](#store-management)
- [Authentication & User Management](#authentication--user-management)
- [Administrative Operations](#administrative-operations)
- [User Location Services](#user-location-services)
- [Media Upload Pipeline](#media-upload-pipeline)
- [Attendance Tracking](#attendance-tracking)

---

## System & Health

### `GET /health`

Public health check verifying the server status.

- **Headers**: None
- **Response `200 OK`**:
  ```json
  {
    "message": "Server running"
  }
  ```

### `GET /secure/verify`

Validates that both the access token and refresh token are active and valid.

- **Headers**:
  - `authorization`: `<AUTH_TOKEN>`
  - `refresh`: `<REFRESH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "message": "User is valid"
  }
  ```
- **Error Response `401 Unauthorized`**:
  ```json
  {
    "message": "Token not provided"
  }
  ```
  _(or `{"message": "Invalid token"}`)_

---

## JWT Service

### `GET /jwt/health`

Health check for the JWT token service.

- **Headers**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "JWT Service is running"
  }
  ```

### `GET /jwt/refresh`

Refreshes an authenticated session by exchanging a valid refresh token for a newly generated pair of tokens (Auth token: 2 days, Refresh token: 10 days).

- **Headers**:
  - `authorization`: `<AUTH_TOKEN>`
  - `refresh`: `<REFRESH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "status": "Success",
    "authToken": "<NEW_JWT_AUTH_TOKEN>",
    "refreshToken": "<NEW_JWT_REFRESH_TOKEN>"
  }
  ```
- **Error Response `401 Unauthorized`**:
  ```json
  {
    "message": "Invalid refresh token"
  }
  ```

---

## Store Management

> All `/account/store/*` routes require the `account: <ACCOUNT_ID>` header.

### `GET /account/store/health`

Store module service health check.

- **Headers**: `account: <ACCOUNT_ID>`
- **Response `200 OK`**:
  ```json
  {
    "status": "Store Service is running"
  }
  ```

### `GET /account/store/get`

Retrieves a list of all registered physical stores.

- **Headers**: `account: <ACCOUNT_ID>`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "_id": "671df9c8b0e8b8398b1a3e21",
        "name": "Downtown Store",
        "address": "123 Market St, San Francisco, CA",
        "latitude": "37.7749",
        "longitude": "-122.4194",
        "createdAt": "2026-10-27T08:00:00.000Z",
        "updatedAt": "2026-10-27T08:00:00.000Z"
      }
    ]
  }
  ```

### `POST /account/store/create`

Registers a new store branch with geographical coordinates.

- **Headers**:
  - `account`: `<ACCOUNT_ID>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "name": "Downtown Store",
    "address": "123 Market St, San Francisco, CA",
    "latitude": "37.7749",
    "longitude": "-122.4194"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": "Store created successfully"
  }
  ```
- **Error Response `400 Bad Request`**:
  ```json
  {
    "error": "Missing required fields"
  }
  ```

---

## Authentication & User Management

> All `/account/auth/*` routes require the `account: <ACCOUNT_ID>` header.

### `GET /account/auth/health`

Authentication service health check.

- **Headers**: `account: <ACCOUNT_ID>`
- **Response `200 OK`**:
  ```json
  {
    "status": "Auth Service is running"
  }
  ```

### `GET /account/auth/users`

Lists all registered users (passwords are omitted).

- **Headers**: `account: <ACCOUNT_ID>`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "_id": "671dfa1eb0e8b8398b1a3e25",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "storeId": "671df9c8b0e8b8398b1a3e21",
        "isValid": true,
        "createdAt": "2026-10-27T08:05:00.000Z",
        "updatedAt": "2026-10-27T08:10:00.000Z"
      }
    ]
  }
  ```

### `POST /account/auth/create`

Onboards an employee, generates an 8-byte secure random password, hashes it using `bcrypt`, saves the user in MongoDB, and dispatches a branded welcome email with credentials via Resend.

- **Headers**:
  - `account`: `<ACCOUNT_ID>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "storeId": "671df9c8b0e8b8398b1a3e21"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": "User created successfully"
  }
  ```

### `POST /account/auth/validate/:uid`

Toggles an employee's activation status (`isValid: true | false`). Inactive accounts cannot log in.

- **URL Parameters**:
  - `uid` _(string, required)_: User ObjectId.
- **Headers**: `account: <ACCOUNT_ID>`
- **Response `200 OK`**:
  ```json
  {
    "status": "User validation changed"
  }
  ```
- **Error Response `404 Not Found`**:
  ```json
  {
    "error": "User not found"
  }
  ```

### `POST /account/auth/login`

Authenticates an employee using email and password. Requires the account to be validated (`isValid: true`).

- **Headers**:
  - `account`: `<ACCOUNT_ID>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "email": "jane.doe@example.com",
    "password": "<PASSWORD>"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": "Success",
    "authToken": "<JWT_AUTH_TOKEN>",
    "refreshToken": "<JWT_REFRESH_TOKEN>"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{"error": "Invalid password"}` or `{"error": "Invalid user"}`

---

## Administrative Operations

> All `/account/admin/*` routes require the `account: <ACCOUNT_ID>` header.

### `GET /account/admin/health`

Admin module health check.

- **Headers**: `account: <ACCOUNT_ID>`
- **Response `200 OK`**:
  ```json
  {
    "status": "Admin Service is running"
  }
  ```

### `POST /account/admin/login`

Authenticates admin portal credentials and returns administrative JWT tokens.

- **Headers**:
  - `account`: `<ACCOUNT_ID>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "user": "hrms@scoobies.co.in",
    "pass": "#admin@1234#"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": "Success",
    "authToken": "<ADMIN_AUTH_TOKEN>",
    "refreshToken": "<ADMIN_REFRESH_TOKEN>"
  }
  ```

### `GET /account/admin/attendance`

Retrieves all attendance check-ins across the entire organization.

- **Headers**:
  - `account`: `<ACCOUNT_ID>`
  - `authorization`: `<ADMIN_AUTH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "_id": "671dfb34b0e8b8398b1a3e30",
        "userId": "671dfa1eb0e8b8398b1a3e25",
        "latitude": "37.7750",
        "longitude": "-122.4195",
        "distance": "12",
        "imageUrl": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp",
        "createdAt": "2026-10-29T08:15:00.000Z",
        "updatedAt": "2026-10-29T08:15:00.000Z"
      }
    ]
  }
  ```

### `GET /account/admin/attendance/:uid`

Retrieves attendance check-ins for a specific user ID.

- **URL Parameters**:
  - `uid` _(string, required)_: Target user ObjectId.
- **Headers**:
  - `account`: `<ACCOUNT_ID>`
  - `authorization`: `<ADMIN_AUTH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "_id": "671dfb34b0e8b8398b1a3e30",
        "userId": "671dfa1eb0e8b8398b1a3e25",
        "latitude": "37.7750",
        "longitude": "-122.4195",
        "distance": "12",
        "imageUrl": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp",
        "createdAt": "2026-10-29T08:15:00.000Z",
        "updatedAt": "2026-10-29T08:15:00.000Z"
      }
    ]
  }
  ```

---

## User Location Services

> All `/secure/user/*` routes require `authorization` and `refresh` headers.

### `GET /secure/user/health`

User location service health check.

- **Headers**: `authorization: <AUTH_TOKEN>`, `refresh: <REFRESH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "status": "User Service is running"
  }
  ```

### `POST /secure/user/distance`

Calculates distance in meters between provided coordinates and the user's assigned store using `geolib`.

- **Headers**:
  - `authorization`: `<AUTH_TOKEN>`
  - `refresh`: `<REFRESH_TOKEN>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "latitude": "37.7750",
    "longitude": "-122.4195"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "distance": 12
  }
  ```

---

## Media Upload Pipeline

> All `/secure/upload/*` routes require `authorization` and `refresh` headers.

### `GET /secure/upload/health`

Upload service health check.

- **Headers**: `authorization: <AUTH_TOKEN>`, `refresh: <REFRESH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "status": "Upload Service is running"
  }
  ```

### `POST /secure/upload/image`

Generates an AWS S3 presigned PUT URL (valid for 300 seconds) for direct-to-S3 WebP image uploads.

- **Headers**:
  - `authorization`: `<AUTH_TOKEN>`
  - `refresh`: `<REFRESH_TOKEN>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "text": "Morning Shift Selfie"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "uploadUrl": "https://hrms-attendance-bucket.s3.ap-south-1.amazonaws.com/images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp?X-Amz-...",
    "key": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp"
  }
  ```

---

## Attendance Tracking

> All `/secure/attendance/*` routes require `authorization` and `refresh` headers.

### `GET /secure/attendance/health`

Attendance service health check.

- **Headers**: `authorization: <AUTH_TOKEN>`, `refresh: <REFRESH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "status": "Attendance Service is running"
  }
  ```

### `GET /secure/attendance/today`

Returns check-in records created by the authenticated user for the current calendar day.

- **Headers**: `authorization: <AUTH_TOKEN>`, `refresh: <REFRESH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "_id": "671dfb34b0e8b8398b1a3e30",
        "userId": "671dfa1eb0e8b8398b1a3e25",
        "latitude": "37.7750",
        "longitude": "-122.4195",
        "distance": "12",
        "imageUrl": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp",
        "createdAt": "2026-10-29T08:15:00.000Z",
        "updatedAt": "2026-10-29T08:15:00.000Z"
      }
    ]
  }
  ```

### `GET /secure/attendance/all`

Returns full historical check-in logs for the authenticated user.

- **Headers**: `authorization: <AUTH_TOKEN>`, `refresh: <REFRESH_TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "data": [...]
  }
  ```

### `POST /secure/attendance/add`

Records an attendance entry by verifying user coordinates against the assigned store, calculating Haversine distance, and storing the selfie S3 image key.

- **Headers**:
  - `authorization`: `<AUTH_TOKEN>`
  - `refresh`: `<REFRESH_TOKEN>`
  - `Content-Type`: `application/json`
- **Request Body**:
  ```json
  {
    "latitude": "37.7750",
    "longitude": "-122.4195",
    "imageUrl": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": "Attendance added successfully"
  }
  ```
- **Error Response `404 Not Found`**:
  ```json
  {
    "error": "Store not found"
  }
  ```
  _(or `{"error": "User not found"}`)_
