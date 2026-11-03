# HRMS Backend

[![Node.js Version](https://img.shields.io/badge/Node.js-v24+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3%20Presigned-FF9900?style=flat-square&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![Email](https://img.shields.io/badge/Email-Resend-black?style=flat-square&logo=resend&logoColor=white)](https://resend.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](https://opensource.org/licenses/ISC)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](compose.yaml)

A lightweight, modular, and cloud-ready REST API backend for Human Resource Management Systems (HRMS). Built with Node.js and Express 5, this service provides store location administration, employee lifecycle onboarding with automated credential dispatch, geofenced attendance tracking with GPS distance calculation, direct-to-S3 presigned image uploads, and dual-token JWT authentication.

---

## Table of Contents

- [What the Project Does](#what-the-project-does)
- [Why the Project Is Useful](#why-the-project-is-useful)
- [Architecture & Data Model](#architecture--data-model)
  - [Project Structure](#project-structure)
  - [Entity Relationship Diagram](#entity-relationship-diagram)
- [How Users Can Get Started](#how-users-can-get-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Service](#running-the-service)
  - [Running with Docker](#running-with-docker)
- [API Overview & Usage Examples](#api-overview--usage-examples)
  - [Authentication & Header Requirements](#authentication--header-requirements)
  - [Route Endpoints](#route-endpoints)
  - [End-to-End Workflow Example](#end-to-end-workflow-example)
- [Where Users Can Get Help](#where-users-can-get-help)
- [Who Maintains and Contributes](#who-maintains-and-contributes)
- [License](#license)

---

## What the Project Does

The **HRMS Backend** serves as the core API service powering organizational workforce management. It manages:

- **Store & Workplace Locations**: Create and manage physical branch and office locations mapped with precise GPS coordinates (latitude and longitude).
- **Employee Onboarding & Account Lifecycle**: Register employees linked to specific stores. Passwords are automatically generated securely using cryptographic random bytes and emailed to new hires via Resend with customizable HTML email templates.
- **Account Validation & Activation**: Administrative toggle endpoint (`/account/auth/validate/:uid`) to activate or suspend employee accounts.
- **Geofenced Attendance Verification**: Record clock-in events accompanied by verification photos and client GPS coordinates. The service automatically calculates the distance (in meters) between the user and their assigned store using the Haversine formula via `geolib`.
- **Direct S3 Asset Uploads**: Issue short-lived presigned AWS S3 `PUT` URLs so mobile/web clients can upload verification images directly to Amazon S3 without saturating backend bandwidth.
- **Dual-Token Authentication**: Secure session management featuring 2-day access tokens, 10-day refresh tokens, and dedicated refresh endpoints.

---

## Why the Project Is Useful

- **Eliminates Attendance Fraud**: By calculating real-time geographic distance between check-in coordinates and assigned store locations, organizations can enforce strict geofencing policies.
- **Zero-Bottleneck Media Pipeline**: Generating presigned AWS S3 URLs delegates heavy image upload workloads directly to AWS object storage, keeping application memory and bandwidth consumption minimal during peak shift check-in times.
- **Automated Credential Delivery**: Generates cryptographically secure temporary passwords and dispatches branded onboarding emails out-of-the-box using the Resend API and [email_template.html](email_template.html).
- **Robust Multi-Layered Security**: Segregates sensitive administration endpoints behind an `account` header guard while protecting employee operations with dual-token JWT verification.
- **Strict Payload Validation**: Every write request is guarded by strict [Zod](https://zod.dev/) schemas to ensure request integrity and eliminate unhandled runtime exceptions.
- **Docker-Ready Deployment**: Includes container definitions ([Dockerfile](Dockerfile)) and Docker Compose ([compose.yaml](compose.yaml)) for one-command local orchestration or cloud deployments.

---

## Architecture & Data Model

### Project Structure

```plaintext
hrms-backend/
├── app.js                   # Application entry point, middleware & route mounting
├── package.json             # Project dependencies and lifecycle scripts
├── Dockerfile               # Node 24 container definition
├── compose.yaml             # Docker Compose orchestration config
├── .env.example             # Template for required environment variables
├── email_template.html      # Responsive onboarding email template
├── aws/
│   └── s3_client.js         # AWS S3 client and presigned URL helpers
├── database/
│   ├── attendance_model.js  # Mongoose model for attendance records
│   ├── store_model.js       # Mongoose model for physical stores
│   └── user_model.js        # Mongoose model for users and store associations
├── routes/
│   ├── export.js            # Centralized export aggregator for route modules
│   ├── attendance/          # Attendance check-in and history endpoints
│   ├── auth/                # User login, registration, validation & listing
│   ├── jwt/                 # JWT token renewal endpoints
│   ├── store/               # Store registration and retrieval
│   └── upload/              # Presigned S3 image upload URL generation
└── utils/
    ├── middleware.js        # JWT and administrative account validation middleware
    └── tokens.js            # JWT signing, decoding, and verification utility
```

### Entity Relationship Diagram

```mermaid
erDiagram
    STORE ||--o{ USER : "employs"
    USER ||--o{ ATTENDANCE : "logs"

    STORE {
        ObjectId _id PK
        string name
        string address
        string latitude
        string longitude
        datetime createdAt
        datetime updatedAt
    }

    USER {
        ObjectId _id PK
        ObjectId storeId FK
        string name
        string email
        string password
        boolean isValid
        datetime createdAt
        datetime updatedAt
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId userId FK
        string latitude
        string longitude
        string distance
        string imageUrl
        datetime createdAt
        datetime updatedAt
    }
```

---

## How Users Can Get Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** >= 24.0.0
- **npm** >= 10.0.0
- **MongoDB** instance (local server or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **AWS Account** with an active S3 bucket and IAM credentials
- **Resend Account** with an active API key for sending onboarding emails
- _(Optional)_ **Docker** & **Docker Compose**

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/masanthimanshu/hrms-backend.git
   cd hrms-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Configuration

Copy the example environment configuration file:

```bash
cp .env.example .env
```

Open `.env` and fill in the required environment variables:

| Variable               | Description                                                            | Example                                    |
| :--------------------- | :--------------------------------------------------------------------- | :----------------------------------------- |
| `PORT`                 | Port number on which the Express server listens                        | `5500`                                     |
| `DB_URL`               | MongoDB connection URI (without database query parameters)             | `mongodb://localhost:27017/hrms`           |
| `ACCOUNT_ID`           | Administrative account secret checked by account middleware            | `adm_secret_key_99`                        |
| `AUTH_TOKEN_SECRET`    | Secret key used to sign and verify short-lived JWT access tokens       | `your-auth-secret`                         |
| `REFRESH_TOKEN_SECRET` | Secret key used to sign and verify long-lived JWT refresh tokens       | `your-refresh-secret`                      |
| `AWS_KEY`              | AWS IAM Access Key ID with `s3:PutObject` & `s3:GetObject` permissions | `AKIAIOSFODNN7EXAMPLE`                     |
| `AWS_SECRET`           | AWS IAM Secret Access Key                                              | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `BUCKET_NAME`          | AWS S3 Bucket designated for verification assets                       | `hrms-attendance-bucket`                   |
| `RESEND_API_KEY`       | API Key from Resend for sending onboarding credential emails           | `re_1234567890abcdef`                      |

### Running the Service

#### Development Mode (with hot-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

#### Run Code Linter

```bash
npx eslint .
```

### Running with Docker

You can run the entire backend using Docker and Docker Compose:

```bash
# Build and start container in detached mode
docker compose up -d --build

# View real-time container logs
docker compose logs -f

# Stop and remove containers
docker compose down
```

The server will be reachable at `http://localhost:5500`.

---

## API Overview & Usage Examples

### Authentication & Header Requirements

The API classifies routes under three distinct security contexts:

1. **Public Routes** (`/health`, `/jwt/refresh`): Require standard HTTP headers.
2. **Account Protected Routes** (`/account/*`): Require the administrative header:
   - `account: <ACCOUNT_ID>`
3. **Secure Employee Routes** (`/secure/*`): Require dual JWT headers:
   - `authorization: <AUTH_TOKEN>`
   - `refresh: <REFRESH_TOKEN>`

### Route Endpoints

| Method | Endpoint                      | Protection      | Description                                                  |
| :----- | :---------------------------- | :-------------- | :----------------------------------------------------------- |
| `GET`  | `/health`                     | Public          | Root service health check                                    |
| `GET`  | `/jwt/health`                 | Public          | JWT service health check                                     |
| `GET`  | `/jwt/refresh`                | Public / Tokens | Exchanges a valid `refresh` token for a new token pair       |
| `GET`  | `/account/store/health`       | Account Guard   | Store service health check                                   |
| `POST` | `/account/store/create`       | Account Guard   | Registers a new physical store location                      |
| `GET`  | `/account/store/get`          | Account Guard   | Lists all registered store locations                         |
| `GET`  | `/account/auth/health`        | Account Guard   | Auth service health check                                    |
| `GET`  | `/account/auth/users`         | Account Guard   | Lists all employees (excluding password hashes)              |
| `POST` | `/account/auth/create`        | Account Guard   | Registers an employee, generates password & sends email      |
| `POST` | `/account/auth/validate/:uid` | Account Guard   | Toggles employee active state (`isValid`)                    |
| `POST` | `/account/auth/login`         | Account Guard   | Authenticates employee credentials and returns JWT pair      |
| `GET`  | `/secure/verify`              | Secure (JWT)    | Validates active session tokens                              |
| `GET`  | `/secure/upload/health`       | Secure (JWT)    | Upload service health check                                  |
| `POST` | `/secure/upload/image`        | Secure (JWT)    | Generates a 5-minute AWS S3 presigned upload URL             |
| `GET`  | `/secure/attendance/health`   | Secure (JWT)    | Attendance service health check                              |
| `POST` | `/secure/attendance/add`      | Secure (JWT)    | Submits check-in, computes distance to store, records log    |
| `GET`  | `/secure/attendance/today`    | Secure (JWT)    | Retrieves today's attendance logs for the authenticated user |
| `GET`  | `/secure/attendance/all`      | Secure (JWT)    | Retrieves complete attendance history for authenticated user |

---

### End-to-End Workflow Example

#### 1. Register a Store

```bash
curl -X POST http://localhost:5500/account/store/create \
  -H "Content-Type: application/json" \
  -H "account: your-admin-account-id" \
  -d '{
    "name": "Downtown HQ",
    "address": "456 Market Street, New York, NY",
    "latitude": "40.7128",
    "longitude": "-74.0060"
  }'
```

#### 2. Register an Employee

```bash
curl -X POST http://localhost:5500/account/auth/create \
  -H "Content-Type: application/json" \
  -H "account: your-admin-account-id" \
  -d '{
    "name": "Alex Johnson",
    "email": "alex.johnson@example.com",
    "storeId": "653b8f1c9d2e1a0012345678"
  }'
```

_A secure random password is generated and sent directly to the employee's email address._

#### 3. Activate the Employee Account

Newly created employees start with `isValid: false`. Activate the user via their User ID:

```bash
curl -X POST http://localhost:5500/account/auth/validate/653b8f1c9d2e1a0012345679 \
  -H "account: your-admin-account-id"
```

#### 4. Employee Login

```bash
curl -X POST http://localhost:5500/account/auth/login \
  -H "Content-Type: application/json" \
  -H "account: your-admin-account-id" \
  -d '{
    "email": "alex.johnson@example.com",
    "password": "<PASSWORD_RECEIVED_VIA_EMAIL>"
  }'
```

Sample JSON response:

```json
{
  "status": "Success",
  "authToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 5. Generate Presigned URL & Upload Verification Photo

Request the presigned upload URL:

```bash
curl -X POST http://localhost:5500/secure/upload/image \
  -H "Content-Type: application/json" \
  -H "authorization: <AUTH_TOKEN>" \
  -H "refresh: <REFRESH_TOKEN>" \
  -d '{
    "text": "Morning Shift Check-in"
  }'
```

Response contains the S3 signed URL and key:

```json
{
  "uploadUrl": "https://hrms-attendance-bucket.s3.ap-south-1.amazonaws.com/images/4a7e9...webp?X-Amz-...",
  "key": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp"
}
```

Upload the image directly to S3 via HTTP PUT:

```bash
curl -X PUT "<UPLOAD_URL>" \
  -H "Content-Type: image/webp" \
  --data-binary "@selfie.webp"
```

#### 6. Record Attendance Check-In

```bash
curl -X POST http://localhost:5500/secure/attendance/add \
  -H "Content-Type: application/json" \
  -H "authorization: <AUTH_TOKEN>" \
  -H "refresh: <REFRESH_TOKEN>" \
  -d '{
    "latitude": "40.7130",
    "longitude": "-74.0062",
    "imageUrl": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp"
  }'
```

_The server computes the distance in meters between the employee's check-in coordinates and their assigned store coordinates, persisting the record in MongoDB._

---

## Where Users Can Get Help

- **Issue Tracker**: Submit bug reports and feature requests via [GitHub Issues](https://github.com/masanthimanshu/hrms-backend/issues).
- **Discussions & Support**: Open a question or topic on [GitHub Discussions](https://github.com/masanthimanshu/hrms-backend/discussions).
- **Code Reference**: Check implementation details directly in [routes/](routes/) and [utils/](utils/).

---

## Who Maintains and Contributes

### Maintainer

Developed and maintained by **[Himanshu Masant](https://github.com/masanthimanshu)**.

### Contributing

Contributions are welcomed. To contribute:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/your-feature-name`.
3. Verify your changes adhere to code style guidelines: `npx eslint .`.
4. Commit your changes: `git commit -m 'feat: add support for custom geofence radius'`.
5. Push your branch: `git push origin feature/your-feature-name`.
6. Submit a Pull Request describing your changes.

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC). See the [package.json](package.json) file for details.
