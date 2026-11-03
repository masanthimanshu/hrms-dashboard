# Scoobies HRMS Dashboard

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite)](https://vite.dev/)
[![Material UI](https://img.shields.io/badge/MUI-v9-007FFF.svg?logo=mui)](https://mui.com/)
[![Code Quality](https://img.shields.io/badge/Linter-oxlint-orange.svg)](https://oxc.rs/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, responsive administrative web application designed for enterprise workforce management, retail store operations, and geofence-verified attendance auditing. Built with **React 19**, **TypeScript**, **Material UI (MUI)**, and **Vite**.

---

## Table of Contents

- [What the Project Does](#what-the-project-does)
- [Why the Project is Useful](#why-the-project-is-useful)
  - [Key Features](#key-features)
  - [Architecture Highlights](#architecture-highlights)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running Locally](#running-locally)
  - [Building for Production](#building-for-production)
  - [Code Quality & Linting](#code-quality--linting)
- [Available Scripts](#available-scripts)
- [Where to Get Help](#where-to-get-help)
- [Maintainers & Contributing](#maintainers--contributing)

---

## What the Project Does

The **Scoobies HRMS Dashboard** is a centralized administrative command center for retail and enterprise organizations with distributed physical workplaces. It enables operations managers and HR administrators to:

- Manage multi-branch workplace locations and configure physical GPS geofences.
- Onboard and maintain employee directories with store assignment and account activation toggles.
- Audit real-time employee check-ins and verify presence using GPS distance telemetry and photographic evidence.
- Track compliance metrics, punctuality, and attendance trends across all branches.

---

## Why the Project is Useful

Distributed retail chains, field organizations, and multi-location businesses often struggle with buddy-punching, fraudulent attendance, and fragmented employee record-keeping. The Scoobies HRMS Dashboard bridges this gap by combining automated geofencing verification with visual audit workflows.

### Key Features

- **Executive Overview Dashboard**: High-level KPI cards displaying active workforce numbers, operational branches, daily attendance compliance percentages, and real-time punch-in activity streams.
- **Geofence Verification & Distance Tracking**: Measures exact employee distance (in meters) relative to the assigned store coordinates at the time of check-in, classifying punches as **Compliant** ($\le 100\text{ m}$), **Borderline** ($101\text{--}250\text{ m}$), or **Outlier** ($> 250\text{ m}$).
- **Visual Photo Verification**: Built-in modal viewer for inspecting CloudFront CDN-hosted employee verification photos taken during punch-in alongside geo-coordinates and timestamps.
- **Staff Directory & Access Control**: Full employee roster with quick search, store filtering, account validation toggles, and single-click CSV export.
- **Workplace Branch Management**: Store creation with manual coordinate entry or device geolocation auto-detection (`Use My Current Location`), address management, and assigned staff counts.
- **Workforce Analytics**: Visual compliance breakdowns, punctuality insights, and branch-level attendance distribution.
- **System Health Diagnostics**: Built-in diagnostics tab to test root backend API health, store endpoints, authentication services, and tenant token configuration.

### Architecture Highlights

- **Route-Level Code Splitting**: All major views (`Overview`, `Employees`, `Stores`, `Attendance`, `Analytics`, `Settings`, and `Login`) are dynamically loaded via `React.lazy` and `Suspense`, resulting in fast initial page load times.
- **Custom Vendor Chunking**: Optimized Vite Rollup chunking separating vendor modules (`vendor-react`, `vendor-mui`, `vendor-icons`, `vendor-axios`, `vendor-core`).
- **Decoupled Event Notification Bus**: Global toast alert subscriber system eliminating heavy React context re-renders for background and API notices.
- **Blazing Fast Tooling**: Uses [oxlint](https://oxc.rs/) for linting in milliseconds.

---

## Tech Stack

| Layer                       | Technology                                                         |
| --------------------------- | ------------------------------------------------------------------ |
| **Frontend Framework**      | [React 19](https://react.dev/)                                     |
| **Language**                | [TypeScript](https://www.typescriptlang.org/)                      |
| **Build Tool & Dev Server** | [Vite 8](https://vite.dev/)                                        |
| **UI Component Library**    | [Material UI (MUI v9)](https://mui.com/) & Emotion                 |
| **Icons**                   | [@mui/icons-material](https://mui.com/material-ui/material-icons/) |
| **Routing**                 | [React Router v7](https://reactrouter.com/)                        |
| **HTTP Client**             | [Axios](https://axios-http.com/)                                   |
| **Linter**                  | [oxlint](https://oxc.rs/)                                          |
| **Design Typography**       | Plus Jakarta Sans & JetBrains Mono                                 |

---

## Project Structure

```text
hrms-dashboard/
├── .env.example              # Template environment variables
├── index.html                # Application entry HTML template & font imports
├── package.json              # Project dependencies and script commands
├── tsconfig.json             # TypeScript project references
├── tsconfig.app.json         # Client TypeScript configuration
├── tsconfig.node.json        # Vite / Node TypeScript configuration
├── vite.config.ts            # Vite build configuration, manual chunks, and dev proxy
└── src/
    ├── main.tsx              # React application bootstrapping
    ├── App.tsx               # Root component with routing and notification listener
    ├── theme.ts              # Custom MUI theme (colors, typography, component overrides)
    ├── components/
    │   ├── Layout.tsx        # Responsive navigation sidebar and app bar shell
    │   └── VerificationPhotoModal.tsx # Geofence photo inspection dialog
    ├── pages/
    │   ├── LoginPage.tsx      # Administrative login & credential authentication
    │   ├── OverviewPage.tsx   # Executive metrics, KPI summaries, and recent activity
    │   ├── EmployeesPage.tsx  # Staff directory, employee onboarding drawer, and CSV export
    │   ├── StoresPage.tsx     # Workplace locations, GPS coordinates, and branch creation
    │   ├── AttendancePage.tsx # Audit log with geofence distance calculation and filters
    │   ├── AnalyticsPage.tsx  # Compliance distribution and attendance analytics
    │   └── SettingsPage.tsx   # Backend connectivity diagnostics and configuration
    └── services/
        └── api.ts             # Axios instance, API endpoints, auth session, and helpers
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ LTS recommended)
- **Package Manager**: `npm` (v9+), `pnpm`, or `yarn`

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/masanthimanshu/hrms-dashboard.git
   cd hrms-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Copy the example environment configuration file:

```bash
cp .env.example .env
```

Open `.env` and set the appropriate variables for your environment:

| Variable              | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `VITE_APP_BASE_URL`   | Base API URL for backend services                            |
| `VITE_APP_CDN_URL`    | CloudFront CDN URL for employee check-in verification photos |
| `VITE_APP_ACCOUNT_ID` | Optional organization / tenant account identifier header     |

> [!NOTE]
> In local development, `vite.config.ts` includes a proxy mapping `/app` to `https://hrms.scoobies.ai` to prevent Cross-Origin Resource Sharing (CORS) issues when working with the backend API.

### Running Locally

Start the Vite local development server:

```bash
npm run dev
```

The app will start at `http://localhost:5173/` and automatically launch in your default web browser.

### Building for Production

To create an optimized, type-checked production build:

```bash
npm run build
```

The compiled bundles and static assets will be output to the `dist/` folder. You can preview the production bundle locally with:

```bash
npx vite preview
```

### Code Quality & Linting

Run the high-speed `oxlint` linter to check for potential errors and enforce code cleanliness:

```bash
npm run lint
```

---

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the local development server with Hot Module Replacement (HMR).
- `npm run build`: Type-checks with `tsc -b` and builds production-ready bundles using Vite.
- `npm run lint`: Analyzes the codebase with `oxlint` and applies automatic fixes where supported.

---

## Where to Get Help

- **Issues & Bug Reports**: Open an issue on the [GitHub Issues](https://github.com/masanthimanshu/hrms-dashboard/issues) page.
- **Backend API Inquiries**: Consult the API service definitions in [src/services/api.ts](src/services/api.ts) or test backend status using the in-app **API & Configuration** page (`/settings`).

---

## Maintainers & Contributing

Maintained with ❤️ by **Himanshu** ([@masanthimanshu](https://github.com/masanthimanshu)).

### Contributing Guidelines

1. Fork the repository.
2. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "feat: add your descriptive feature"
   ```
4. Verify tests and linting pass:
   ```bash
   npm run lint
   npm run build
   ```
5. Push to your branch and submit a Pull Request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
