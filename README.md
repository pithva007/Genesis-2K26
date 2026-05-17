# 🏆 Genesis 2K26 — Sports Fest Registration Portal

A premium, production-ready, and highly performant sports fest registration web application engineered for **Genesis 2K26**. This portal enables students to register teams, join existing teams via secure team codes, and allows administrators to oversee all tournament registrations with automated sync to Google Sheets and dual-layer rate limiting.

---

## ✨ Features

- 🏅 **Dynamic Multi-Sport Configuration:** Supports 14 distinct sports including Cricket, Football, Basketball, Volleyball, Kabaddi, Table Tennis, Carrom, Chess, Badminton, Throwball, Weight Lifting, Athletics, Mixed Cricket, and Valay Dand.
- 🔑 **Secure Team Creation & Join System:** Generates unique, shareable 6-character team codes (e.g. `GN-XXXX`) for captains to distribute to teammates, facilitating easy joins while preventing over-registration.
- 📊 **Real-time Google Sheets Sync:** Connects to a Google Spreadsheet via the Google Sheets API v4 (JWT Service Account Auth). It dynamically creates sport-specific tabs, writes standardized header rows, and upserts rows on creation or team modifications.
- 🛡️ **Dual-Layer Rate Limiting:** Implements sliding-window rate limiting using **Upstash Redis** globally, with a robust local **in-memory Map** fallback if Redis is unconfigured or offline.
- 💼 **Protected Admin Dashboard:** A password-secured management console (`/admin`) for coordinators to monitor team capacities, view registrations across all sports, modify team statuses, and export data.
- 🎨 **Glassmorphic Responsive UI:** Fully mobile-first frontend styled with dark-mode glassmorphism using Tailwind CSS, Framer Motion, and Lucide React.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** MongoDB & Mongoose (Optimized indexing on sports, statuses, and team codes)
- **Caching & Rate Limiting:** Upstash Redis (via `@upstash/ratelimit`)
- **Third-Party API:** Google APIs (`googleapis` for Google Sheets v4 integration)
- **Styling & UI:** Tailwind CSS, Framer Motion, Radix UI (Shadcn UI), and Lucide React
- **Forms & Validation:** React Hook Form, Zod, and `@hookform/resolvers`

---

## 📂 Project Structure

```text
genesis-registration-logic/
├── app/                        # Next.js App Router Pages & API Routes
│   ├── admin/                  # Admin dashboard UI
│   ├── api/                    # API Endpoints
│   │   ├── admin/              # Admin-specific routes (credentials & management)
│   │   ├── health/             # System health status check
│   │   ├── teams/              # Create, Join, and Get team details
│   │   └── test-sheets/        # Utility route to test Google Sheets sync
│   ├── sports/                 # Dynamic dynamic slug sports page container
│   ├── globals.css             # Tailwind CSS global styles
│   ├── layout.tsx              # Root HTML wrapper and Providers
│   └── page.tsx                # Sleek, animated main portal landing page
├── components/                 # Reusable UI & Logical Components
│   ├── ui/                     # Shared base UI (dialog, dropdown, buttons, etc.)
│   ├── JoinTeamForm.tsx        # Dynamic code validation & joining form
│   ├── SportCard.tsx           # Home page cards with Framer Motion triggers
│   ├── SportForm.tsx           # Core registration wizard with validation
│   ├── SportPageClient.tsx     # Client-side routing orchestrator for sports
│   ├── TeamCodeDisplay.tsx     # Animated team code generator screen
│   └── TeamDashboard.tsx       # Live team details display board for captains
├── config/                     # Core configs and options list
│   └── sports.config.ts        # Comprehensive list of sports, max limits, and styles
├── lib/                        # Backend and helper utilities
│   ├── admin.ts                # Password authentication utilities
│   ├── googleSheets.ts         # High-resilience Google Sheets Sync Engine
│   ├── mongodb.ts              # Persistent caching Mongoose Connector
│   ├── rateLimit.ts            # Dual-layer Redis/Local memory rate limiter
│   ├── teamCode.ts             # Cryptographic-grade team code generator
│   └── validation.ts           # Shared Zod validation schemas
├── next.config.mjs             # Next.js bundler configuration
├── package.json                # Project dependencies and runner scripts
└── tsconfig.json               # TypeScript compiler config
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root of your project and configure the following variables:

```bash
# Database Setup
MONGODB_URI=your_mongodb_connection_string

# Admin Settings
ADMIN_PASSWORD=your_secure_admin_password

# Google Cloud Service Account Integration
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0...YOUR_KEY...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_google_spreadsheet_id

# Rate Limiting (Optional but Recommended for Production)
UPSTASH_REDIS_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_TOKEN=your_upstash_redis_token
```

---

## 🚀 Getting Started

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the live system.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 📊 Google Sheets Sync Setup Guide

To configure the live synchronization to Google Sheets, follow these steps:

1. **Create Google Cloud Project:**
   Go to the [Google Cloud Console](https://console.cloud.google.com/), create a new project, and enable the **Google Sheets API**.
   
2. **Create Service Account:**
   - In Cloud Console, go to **APIs & Services > Credentials**.
   - Click **Create Credentials** and select **Service Account**.
   - Create the account and assign it a name (e.g. `genesis-sheets`).
   
3. **Generate Private Key JSON:**
   - Go to your newly created Service Account, click on the **Keys** tab, and select **Add Key > Create New Key > JSON**.
   - Download the file.
   - Extract the `client_email` and `private_key` fields and place them in your `.env.local` variables (`GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`). Keep the key's internal `\n` representation in the env variable.

4. **Create & Share Google Sheet:**
   - Create a new Google Sheet in your Google Drive.
   - Copy the Spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`).
   - Add this ID to `GOOGLE_SHEET_ID` in `.env.local`.
   - **CRITICAL:** Click the **Share** button on your Google Sheet and invite your service account's `client_email` as an **Editor**.

---

## 🛡️ API Endpoints

- `GET /api/health` — Service health assessment.
- `POST /api/teams/create` — Validates team availability, persists details in MongoDB, and queues Google Sheets synchronization.
- `POST /api/teams/join` — Verifies code, checks for vacant spots in the team, inserts the teammate, and updates both databases.
- `GET /api/teams/[code]` — Retrieves live roster, captain, category, and spot vacancy for a specific team.
- `GET /api/admin/teams` — Retrieves lists of all teams (requires `x-admin-password` header auth).
- `DELETE /api/admin/teams/[code]` — Terminates a team registration and coordinates databases.

---

## 🔒 Security & Optimization

- **Rate Limiting:** Protects endpoints from registration floods or denial-of-service attempts by throttling users to **30 requests per minute** per IP.
- **Index Optimization:** Database structures in [models/Team.ts](file:///Users/khushpithva/Documents/Genesis-2K26-genesis-registration-logic/models/Team.ts) are optimized with compounded and unique indexes on `teamCode`, `sport`, and `status` to ensure sub-millisecond retrieval speeds under high concurrency.
- **Automatic Queue Retries:** The Google Sheets connector utilizes an exponential backoff queued task runner to ensure that sheets sync successfully even during API downtime or rate-limit saturation by Google.
