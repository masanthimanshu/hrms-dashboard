# HRMS Backend

[![Node.js Version](https://img.shields.io/badge/Node.js-v24+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3%20Presigned-FF9900?style=flat-square&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![Email](https://img.shields.io/badge/Email-Resend-black?style=flat-square&logo=resend&logoColor=white)](https://resend.com/)
[![Validation](https://img.shields.io/badge/Validation-Zod%204.x-3068b7?style=flat-square&logo=zod&logoColor=white)](https://zod.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](compose.yaml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

A modern, cloud-native REST API backend for Human Resource Management Systems (HRMS). Built with Node.js and Express 5, this service provides store location administration, employee lifecycle onboarding with automated credential dispatch via email, geofenced attendance tracking with real-time GPS distance calculation, direct-to-S3 presigned image uploads, and dual-token JWT authentication.

---

## Table of Contents

- [What the Project Does](#what-the-project-does)
- [Why the Project Is Useful](#why-the-project-is-useful)
- [Architecture & Key Workflows](#architecture--key-workflows)
  - [System Architecture](#system-architecture)
  - [Repository Structure](#repository-structure)
  - [Data Model](#data-model)
- [How Users Can Get Started](#how-users-can-get-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
  - [Running with Docker](#running-with-docker)
  - [Cloud Deployment (AWS EKS & Terraform)](#cloud-deployment-aws-eks--terraform)
- [API Overview & Quickstart Usage](#api-overview--quickstart-usage)
  - [Security & Authentication Guards](#security--authentication-guards)
  - [Endpoint Summary](#endpoint-summary)
  - [Quickstart Workflow Examples](#quickstart-workflow-examples)
- [Where Users Can Get Help](#where-users-can-get-help)
- [Who Maintains and Contributes](#who-maintains-and-contributes)
- [License](#license)

---

## What the Project Does

The **HRMS Backend** serves as the core operational service powering workforce and branch management:

- **Store & Branch Management**: Register and maintain physical workplace stores with precise GPS coordinates (latitude/longitude) and street addresses.
- **Automated Employee Onboarding**: Provision user profiles assigned to specific stores. The system generates secure, cryptographically random temporary credentials and dispatches a welcome email with custom HTML branding via Resend.
- **Account Verification Lifecycle**: Administrative toggle (`isValid`) to verify and authorize employee accounts before allowing system access.
- **Geofenced Attendance Verification**: Record clock-ins with live GPS coordinates and verification selfies. Checks the distance in meters between the employee and their assigned store using the Haversine formula (`geolib`).
- **Live Distance Calculation**: On-demand distance endpoint enabling client apps to calculate proximity to the designated store before check-in.
- **Presigned Direct-to-S3 Media Uploads**: Generates short-lived AWS S3 presigned URLs, allowing client apps to upload verification photos directly to S3 without sending heavy binary data through the API server.
- **Dual-Token Authentication**: Secure authentication flow with 2-day access tokens and 10-day refresh tokens with automated session refresh.
- **Administrative Portal & Oversight**: Admin authentication and organization-wide attendance log auditing across all users or filtered by individual employee ID.

---

## Why the Project Is Useful

- **Eliminates Attendance Fraud**: Real-time GPS coordinate validation against assigned store coordinates ensures employees are physically present on-site when clocking in.
- **Zero-Bottleneck Media Pipeline**: Direct-to-S3 presigned image uploads offload heavy media processing from Node.js, keeping API memory footprints minimal and check-in latency low during peak shift hours.
- **Frictionless Onboarding**: Automates credential generation and email delivery, eliminating manual password resets during initial team setup.
- **Layered Security Architecture**: Strict header separation protects administrative provisioning endpoints (`account` header) while client sessions use dual JWT tokens (`authorization` and `refresh` headers).
- **Built-in Rate Limiting**: Global request limiting (50 requests per 5-minute window) protects backend resources against abuse.
- **Cloud-Native & Production-Ready**: Preconfigured with Docker, Docker Compose, Terraform IaC (`deploy/`), Helm charts (`chart/`), and an automated AWS EKS deployment pipeline (`deploy.sh`).

---

## Architecture & Key Workflows

### System Architecture

```mermaid
flowchart TD
    Client["Client Apps (Web / Mobile)"]

    subgraph Security["Security & Middleware"]
        AccountGuard["Account ID Guard (/account/*)"]
        JWTGuard["Dual JWT Guard (/secure/*)"]
    end

    subgraph HRMS["HRMS Backend (Express 5)"]
        AuthModule["Auth & Admin Controller"]
        StoreModule["Store Management"]
        AttendanceModule["Attendance & Geofencing"]
        UploadModule["S3 Presigner"]
    end

    subgraph External["External Cloud Services"]
        MongoDB[("MongoDB Database")]
        S3[("AWS S3 Bucket")]
        Resend["Resend Email Service"]
    end

    Client -->|X-Account-ID| AccountGuard --> AuthModule & StoreModule
    Client -->|Bearer & Refresh Tokens| JWTGuard --> AttendanceModule & UploadModule
    AuthModule -->|User Records| MongoDB
    AuthModule -->|Welcome Email| Resend
    StoreModule -->|Store Coordinates| MongoDB
    AttendanceModule -->|Distance Math via Geolib| MongoDB
    UploadModule -->|Presigned PUT URL| Client
    Client -->|Direct Binary Upload| S3
```

### Repository Structure

```
hrms-backend/
├── app.js                   # Application entry point, rate limiting, and route mounting
├── package.json             # Dependencies, scripts, and package metadata
├── compose.yaml             # Docker Compose service definition
├── Dockerfile               # Node 24 container build configuration
├── .env.example             # Template for required environment variables
├── eslint.config.js         # ESLint configuration
├── email.html               # Responsive HTML email template for welcome credentials
├── deploy.sh                # End-to-end AWS EKS deployment script
├── aws/
│   └── s3_client.js         # AWS S3 client & presigned URL generators
├── chart/                   # Helm chart for Kubernetes deployment
│   ├── Chart.yaml           # Helm chart metadata
│   ├── values.yaml          # Default deployment values
│   └── templates/           # Kubernetes manifests (Deployment, LoadBalancer Service)
├── database/
│   ├── .eraserdiagram       # Architecture entity relationship diagram
│   ├── user_model.js        # Mongoose schema for user accounts
│   ├── store_model.js       # Mongoose schema for stores / workplace locations
│   └── attendance_model.js   # Mongoose schema for attendance check-ins
├── deploy/                  # Terraform IaC configurations
│   ├── main.tf              # Provider configuration and backend
│   ├── modules.tf           # VPC, ECR, and EKS module orchestration
│   └── modules/             # VPC, ECR, and EKS submodules
├── docs/
│   └── API.md               # Exhaustive API endpoint reference and payloads
├── routes/
│   ├── export.js            # Centralized router export barrel
│   ├── admin/               # Admin login and full attendance query endpoints
│   ├── auth/                # User login, registration, and activation endpoints
│   ├── store/               # Store creation and retrieval endpoints
│   ├── user/                # User-specific utility routes (e.g. proximity checks)
│   ├── upload/              # Direct-to-S3 presigned upload routes
│   ├── attendance/          # User attendance check-in and history routes
│   └── jwt/                 # Token refresh and renewal routes
└── utils/
    ├── middleware.js        # Express middleware for JWT and Account authentication
    └── tokens.js            # JWT signing, verification, and decoding helpers
```

### Data Model

```mermaid
erDiagram
    STORE {
        ObjectId _id PK
        string name "unique"
        string address "unique"
        string latitude
        string longitude
        datetime createdAt
        datetime updatedAt
    }

    USER {
        ObjectId _id PK
        ObjectId storeId FK
        string name
        string email "unique"
        string password "bcrypt hash"
        boolean isValid "default: false"
        datetime createdAt
        datetime updatedAt
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId userId FK
        string latitude
        string longitude
        string distance "meters from store"
        string imageUrl "S3 object key"
        datetime createdAt
        datetime updatedAt
    }

    STORE ||--o{ USER : "employs"
    USER ||--o{ ATTENDANCE : "submits"
```

---

## How Users Can Get Started

### Prerequisites

- **Node.js**: `v24.x` or later (LTS recommended)
- **MongoDB**: Local MongoDB instance (v6.0+) or MongoDB Atlas cluster
- **AWS Account**: S3 bucket with IAM credentials for `PutObject` and `GetObject`
- **Resend Account**: API key from [Resend](https://resend.com/) for onboarding emails

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/masanthimanshu/hrms-backend.git
   cd hrms-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the project root by copying the template:

```bash
cp .env.example .env
```

Populate the required environment variables:

| Variable               | Description                                                  | Example                                    |
| :--------------------- | :----------------------------------------------------------- | :----------------------------------------- |
| `PORT`                 | Local port the HTTP server listens on                        | `5500`                                     |
| `DB_URL`               | MongoDB connection URI                                       | `mongodb://user:pass@localhost:27017/hrms` |
| `ACCOUNT_ID`           | Administrative secret key for `/account/*` header validation | `my-secure-account-key`                    |
| `AUTH_TOKEN_SECRET`    | Secret key for signing 2-day JWT access tokens               | `your-auth-secret`                         |
| `REFRESH_TOKEN_SECRET` | Secret key for signing 10-day JWT refresh tokens             | `your-refresh-secret`                      |
| `AWS_KEY`              | AWS IAM Access Key ID                                        | `AKIAIOSFODNN7EXAMPLE`                     |
| `AWS_SECRET`           | AWS IAM Secret Access Key                                    | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `BUCKET_NAME`          | AWS S3 Bucket Name for media storage                         | `hrms-attendance-bucket`                   |
| `RESEND_API_KEY`       | Resend API authorization key                                 | `re_123456789...`                          |

### Running the Application

- **Development mode** (with hot reload via nodemon):

  ```bash
  npm run dev
  ```

- **Production mode**:
  ```bash
  npm start
  ```

Upon startup, the console outputs:

```text
App Started
Database Connected
```

### Running with Docker

Run the entire application in a container using [compose.yaml](compose.yaml):

```bash
# Build and start in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop the container
docker compose down
```

### Cloud Deployment (AWS EKS & Terraform)

The project includes an end-to-end Infrastructure as Code and deployment workflow in [deploy/](deploy/) and [deploy.sh](deploy.sh):

```bash
# Ensure aws, kubectl, helm, docker, and terraform CLI tools are installed
chmod +x deploy.sh
./deploy.sh
```

The script automatically connects to AWS EKS, retrieves Terraform outputs (ECR, VPC, IAM roles), updates CoreDNS for Fargate, deploys the AWS Load Balancer Controller, builds and pushes the Docker container, and deploys the Helm chart located in [chart/](chart/).

---

## API Overview & Quickstart Usage

### Security & Authentication Guards

The API uses two primary authorization mechanisms:

1. **Account Key Guard (`/account/*`)**: Requires the `account` header matching `ACCOUNT_ID` in `.env`.
   ```http
   account: <ACCOUNT_ID>
   ```
2. **Dual JWT Guard (`/secure/*`)**: Requires both `authorization` and `refresh` headers.
   ```http
   authorization: <AUTH_TOKEN>
   refresh: <REFRESH_TOKEN>
   ```

### Endpoint Summary

For full request/response schemas, JSON payloads, and parameter definitions, see the [Complete API Reference](docs/API.md).

| Category       | Method | Path                             | Required Headers           | Description                                          |
| :------------- | :----- | :------------------------------- | :------------------------- | :--------------------------------------------------- |
| **System**     | `GET`  | `/health`                        | None                       | Root service health check                            |
| **System**     | `GET`  | `/secure/verify`                 | `authorization`, `refresh` | Validates active session token pair                  |
| **JWT**        | `GET`  | `/jwt/health`                    | None                       | JWT module health check                              |
| **JWT**        | `GET`  | `/jwt/refresh`                   | `authorization`, `refresh` | Exchanges refresh token for new token pair           |
| **Store**      | `GET`  | `/account/store/health`          | `account`                  | Store module health check                            |
| **Store**      | `GET`  | `/account/store/get`             | `account`                  | Lists all registered stores                          |
| **Store**      | `POST` | `/account/store/create`          | `account`                  | Registers a new store location                       |
| **Auth**       | `GET`  | `/account/auth/health`           | `account`                  | Auth module health check                             |
| **Auth**       | `GET`  | `/account/auth/users`            | `account`                  | Lists all employee accounts (omits passwords)        |
| **Auth**       | `POST` | `/account/auth/create`           | `account`                  | Onboards employee and emails temporary credentials   |
| **Auth**       | `POST` | `/account/auth/login`            | `account`                  | Authenticates employee; returns JWT token pair       |
| **Auth**       | `POST` | `/account/auth/validate/:uid`    | `account`                  | Toggles employee verification status (`isValid`)     |
| **Admin**      | `GET`  | `/account/admin/health`          | `account`                  | Admin module health check                            |
| **Admin**      | `POST` | `/account/admin/login`           | `account`                  | Authenticates portal administrator                   |
| **Admin**      | `GET`  | `/account/admin/attendance`      | `account`, `authorization` | Retrieves company-wide attendance records            |
| **Admin**      | `GET`  | `/account/admin/attendance/:uid` | `account`, `authorization` | Retrieves attendance records for a specific employee |
| **User**       | `GET`  | `/secure/user/health`            | `authorization`, `refresh` | User module health check                             |
| **User**       | `POST` | `/secure/user/distance`          | `authorization`, `refresh` | Calculates distance in meters from assigned store    |
| **Upload**     | `GET`  | `/secure/upload/health`          | `authorization`, `refresh` | Upload module health check                           |
| **Upload**     | `POST` | `/secure/upload/image`           | `authorization`, `refresh` | Generates S3 presigned PUT URL for photo upload      |
| **Attendance** | `GET`  | `/secure/attendance/health`      | `authorization`, `refresh` | Attendance module health check                       |
| **Attendance** | `GET`  | `/secure/attendance/today`       | `authorization`, `refresh` | Returns current user's check-ins for today           |
| **Attendance** | `GET`  | `/secure/attendance/all`         | `authorization`, `refresh` | Returns full attendance history for current user     |
| **Attendance** | `POST` | `/secure/attendance/add`         | `authorization`, `refresh` | Verifies distance and logs attendance                |

### Quickstart Workflow Examples

#### 1. Create a Store Location

```bash
curl -X POST http://localhost:5500/account/store/create \
  -H "Content-Type: application/json" \
  -H "account: your-admin-account-id" \
  -d '{
    "name": "Downtown Flagship",
    "address": "123 Market St, San Francisco, CA",
    "latitude": "37.7749",
    "longitude": "-122.4194"
  }'
```

#### 2. Onboard an Employee & Activate Account

Register a new employee linked to the created store (a welcome email with generated credentials is automatically dispatched):

```bash
curl -X POST http://localhost:5500/account/auth/create \
  -H "Content-Type: application/json" \
  -H "account: your-admin-account-id" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "storeId": "<STORE_OBJECT_ID>"
  }'
```

Activate the user account so they can log in:

```bash
curl -X POST http://localhost:5500/account/auth/validate/<USER_OBJECT_ID> \
  -H "account: your-admin-account-id"
```

#### 3. Employee Login

```bash
curl -X POST http://localhost:5500/account/auth/login \
  -H "Content-Type: application/json" \
  -H "account: your-admin-account-id" \
  -d '{
    "email": "jane.doe@example.com",
    "password": "<PASSWORD_FROM_WELCOME_EMAIL>"
  }'
```

_Response returns `authToken` and `refreshToken`._

#### 4. Upload Verification Selfie to AWS S3

Request a presigned upload URL:

```bash
curl -X POST http://localhost:5500/secure/upload/image \
  -H "Content-Type: application/json" \
  -H "authorization: <AUTH_TOKEN>" \
  -H "refresh: <REFRESH_TOKEN>" \
  -d '{"text": "Morning Check-In"}'
```

Upload the image binary directly from client to AWS S3:

```bash
curl -X PUT "<UPLOAD_URL>" \
  -H "Content-Type: image/webp" \
  --data-binary "@selfie.webp"
```

#### 5. Record Geofenced Attendance

```bash
curl -X POST http://localhost:5500/secure/attendance/add \
  -H "Content-Type: application/json" \
  -H "authorization: <AUTH_TOKEN>" \
  -H "refresh: <REFRESH_TOKEN>" \
  -d '{
    "latitude": "37.7750",
    "longitude": "-122.4195",
    "imageUrl": "images/4a7e9b0e-6f91-4c17-a9a3-5c26b91c1072.webp"
  }'
```

The server automatically computes distance from the employee's assigned store using `geolib` and stores the attendance entry.

---

## Where Users Can Get Help

- **Issues & Bug Reports**: Submit tickets via [GitHub Issues](https://github.com/masanthimanshu/hrms-backend/issues).
- **Discussions & Feedback**: Join discussions via [GitHub Discussions](https://github.com/masanthimanshu/hrms-backend/discussions).
- **Documentation & References**:
  - [API Reference](docs/API.md): Detailed endpoint specifications and JSON contracts.
  - [Route Handlers](routes/): Express controllers and routes.
  - [Data Models](database/): MongoDB schemas for users, stores, and attendance logs.
  - [Auth & Middleware](utils/): Dual-token JWT and administrative guard implementations.
  - [AWS S3 Integration](aws/): Direct upload presigning logic.
  - [Infrastructure as Code](deploy/): Terraform modules for AWS VPC, ECR, and EKS.
  - [Kubernetes Helm Chart](chart/): Helm templates and values.

---

## Who Maintains and Contributes

### Maintainer

Maintained by **[Himanshu Masant](https://github.com/masanthimanshu)**.

### Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style, conventional commit standards, linting rules, and the pull request submission process.

---

## License

This project is licensed under the terms of the [ISC License](LICENSE).
