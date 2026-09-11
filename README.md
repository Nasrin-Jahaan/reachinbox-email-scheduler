# ReachInbox Full-Stack Email Scheduler

> Production-grade email scheduler service and SaaS dashboard inspired by ReachInbox.ai. Built for Outbox Labs Software Development Engineer Internship Assignment.

---

## 1. Project Overview

**ReachInbox Email Scheduler** is a distributed, production-ready email scheduling engine and modern SaaS dashboard. It accepts email campaign requests, queues them persistently in Redis via BullMQ delayed jobs, enforces distributed rate limits and provider throttling per sender, updates business data in PostgreSQL, indexes search data in Elasticsearch, notifies teams on Slack, and sends HTML emails via Nodemailer and Ethereal Email SMTP.

---

## 2. System Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 React + Vite SaaS Dashboard                 │
  │     (Scheduled/Sent Tables, Compose Modal, Slack Auth)      │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ HTTP / JWT Cookies
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    Express.js Backend API                   │
  │  (Auth, Email, Sender, Search & Slack OAuth Controllers)    │
  └────────┬──────────────┬──────────────┬──────────────┬───────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌─────────────┐┌──────────────┐┌───────────┐┌──────────────┐
    │ PostgreSQL  ││ Redis/BullMQ ││Elastic-   ││ Ethereal /   │
    │  (Prisma)   ││ (Queue & Rate││  search   ││  Slack API   │
    └─────────────┘└──────┬───────┘└───────────┘└──────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │    BullMQ Worker Process  │
            │ (Throttling, Rescheduling,│
            │   Idempotent Sending)     │
            └───────────────────────────┘
```

---

## 3. Features Mapping

### Backend Features
- **Persistent Delayed Queue**: BullMQ + Redis persistent queues surviving backend/server restarts.
- **Idempotency Safeguards**: Deterministic job IDs (`email-${email.id}`) and database status checks (`SCHEDULED` -> `PROCESSING` -> `SENT`/`FAILED`).
- **Configurable Worker Concurrency**: Configurable via `WORKER_CONCURRENCY=5`.
- **Distributed Provider Throttling**: Atomic Redis reservation for minimum delay between sends (`MIN_DELAY_BETWEEN_EMAILS_MS=2000`).
- **Distributed Hourly Rate Limiting**: Per-sender atomic counter tracking (`MAX_EMAILS_PER_HOUR_PER_SENDER=200`) with auto-rescheduling to the next hour window.
- **Real Slack Notifications**: Instant alert via Slack Web API when a sender hits their hourly limit, deduplicated per hour window via Redis.
- **Elasticsearch Search**: High-performance multi-field search across recipients, subjects, body, and status with tenant isolation.
- **Bull Board Dashboard**: Live queue monitoring UI at `http://localhost:5000/admin/queues`.

### Frontend Features
- **Modern SaaS Aesthetics**: Styled with Tailwind CSS, dark glassmorphism, smooth animations, and custom badges.
- **Google OAuth Login**: Authentic Google OAuth login + instant quick Dev Demo login mode.
- **Slack OAuth Integration**: One-click "Connect Slack" authorization flow.
- **Compose Modal with CSV/TXT Parser**: Drag-and-drop file upload with auto-detection counter and regex email validation.
- **Paginated Email Tables**: Responsive tables with status badges (`Scheduled`, `Processing`, `Sent`, `Failed`, `Rate Limited`).

---

## 4. Prerequisites

- **Node.js**: `v18.x` or `v20.x`
- **Docker & Docker Compose** (for PostgreSQL, Redis, and Elasticsearch)
- **Google OAuth Client ID & Secret** (optional for dev demo mode)
- **Slack App Credentials** (optional for testing Slack alerts)

---

## 5. Quick Installation & Setup

### 1. Start Docker Services
From the root directory:
```bash
docker compose up -d
```
This spins up:
- **PostgreSQL**: `localhost:5432` (database: `reachinbox`)
- **Redis**: `localhost:6379`
- **Elasticsearch**: `localhost:9200`

---

### 2. Backend Setup
Open a terminal in the root directory:
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
The API server starts on **`http://localhost:5000`**.  
The Bull Board Live Queue Dashboard will be available at **`http://localhost:5000/admin/queues`**.

---

### 3. Background Worker Setup
Open a new terminal tab:
```bash
cd backend
npm run worker
```
The worker connects to Redis and begins processing delayed jobs with concurrency = `WORKER_CONCURRENCY`.

---

### 4. Frontend Setup
Open a third terminal tab:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
The Vite frontend server starts on **`http://localhost:5173`**.

---

## 6. OAuth Setup Instructions

### Google Cloud OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and navigate to **APIs & Services > Credentials**.
3. Click **Create Credentials > OAuth client ID** (Application type: *Web application*).
4. Add Authorized redirect URI:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
5. Copy the Client ID and Client Secret into `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### Slack App OAuth Setup
1. Go to [Slack API Apps](https://api.slack.com/apps) and click **Create New App** (*From scratch*).
2. Under **OAuth & Permissions**, add Redirect URL:
   ```
   http://localhost:5000/api/slack/callback
   ```
3. Add the following **Bot Token Scopes**:
   - `chat:write`
   - `chat:write.public`
   - `channels:read`
   - `groups:read`
4. Copy credentials from **Basic Information** and **OAuth & Permissions** into `backend/.env`:
   ```env
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   ```

---

## 7. Ethereal Email Setup

- **Option 1 (Automated Fallback)**: Leave `ETHEREAL_USER` and `ETHEREAL_PASSWORD` empty in `.env`. On startup, Nodemailer will automatically provision an Ethereal test account and print test message preview URLs in the backend console logs.
- **Option 2 (Custom Account)**: Visit [ethereal.email](https://ethereal.email/), create an account, and set `ETHEREAL_USER` and `ETHEREAL_PASSWORD` in `backend/.env`.

---

## 8. Deep-Dive Architecture Explanations

### Distributed Hourly Rate Limiting Explanation
- **Redis Key Format**: `email-rate:{senderId}:{YYYY-MM-DD-HH}`
- **Atomic Counter Strategy**: An atomic Lua script executes `INCR` on the key and sets a 2-hour TTL if key is new.
- **Rescheduling Behavior**: If `count > MAX_EMAILS_PER_HOUR_PER_SENDER`, the job is not dropped. Instead, the DB status is updated to `RATE_LIMITED`, the next hour start timestamp is computed, and the job is rescheduled in BullMQ for `nextHourStart`.
- **Deduplicated Slack Alerts**: When limit is reached, a Slack notification is triggered. A Redis key `slack-rate-limit-notified:{senderId}:{hourWindow}` ensures only 1 alert is sent per hour per sender.

### Minimum Delay Throttling Explanation
- **Redis Key Format**: `email-last-sent-time:{senderId}`
- **Distributed Mechanism**: An atomic Lua script checks the last reserved timestamp for that sender across all worker processes: `reserved = max(now, last_time + MIN_DELAY_BETWEEN_EMAILS_MS)`. If `reserved > now`, the worker delays execution by `(reserved - now)` ms, preventing SMTP provider rate blocks.

### Server Restart & Persistence Explanation
- BullMQ delayed jobs are saved in Redis data structures. If the backend process crashes or restarts, Redis preserves all pending delayed jobs.
- Upon reconnecting, workers resume processing automatically.
- Workers double-check the PostgreSQL status before sending. If an email is already marked `SENT`, the job is skipped, preventing duplicate sends.

---

## 9. 5-Minute Demo Script

1. **Start Docker Services**: Run `docker compose up -d`.
2. **Launch App**: Start backend (`npm run dev`), worker (`npm run worker`), and frontend (`npm run dev`).
3. **Open Frontend**: Open `http://localhost:5173` in browser.
4. **Log In**: Click **Instant Dev Demo Login** (or Continue with Google).
5. **Connect Slack**: Click **Connect Slack** in the header to authorize your workspace.
6. **Verify Sender**: Click **Senders** in header to inspect or create sender email identities.
7. **Compose Email**: Click **Compose New Email**.
8. **Upload CSV**: Upload a `.csv` or `.txt` file containing recipient email addresses. Notice the email address detection badge.
9. **Schedule Campaign**: Set start time, delay per email (e.g., `2` seconds), and click **Schedule Emails**.
10. **View Scheduled Tab**: Observe emails listed in the `Scheduled Emails` tab with yellow `Scheduled` badges.
11. **Check Live Queue**: Open `http://localhost:5000/admin/queues` to inspect BullMQ waiting and delayed jobs in real time.
12. **Test Server Restart**: Kill the backend and worker processes in terminal (`Ctrl+C`). Wait 10 seconds, then restart them (`npm run dev` & `npm run worker`). Notice that queued jobs resume and execute automatically.
13. **Verify Sent Emails & Rate Limiting**: Check the `Sent Emails` tab for green `Sent` badges. If hourly limit is exceeded during testing, verify that status changes to `Rate Limited`, job is delayed to next hour window, and a Slack notification appears in your Slack channel!

---

## 10. MANUAL CREDENTIALS I MUST ADD

### REQUIRED USER CREDENTIALS (for Live Production OAuth)

| Credential | Purpose | Required For | Default Fallback Available? |
| :--- | :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | Real Google Sign-In | Real Google OAuth | Yes (Dev Demo Login button) |
| `GOOGLE_CLIENT_SECRET` | Real Google Sign-In | Real Google OAuth | Yes (Dev Demo Login button) |
| `SLACK_CLIENT_ID` | Slack OAuth App ID | Real Slack Connection | Yes (Gracefully skips if omitted) |
| `SLACK_CLIENT_SECRET` | Slack OAuth App Secret | Real Slack Connection | Yes (Gracefully skips if omitted) |
| `SLACK_SIGNING_SECRET` | Slack Webhook Signing | Real Slack Connection | Yes (Gracefully skips if omitted) |
| `JWT_SECRET` | JWT Signing Secret | Cookie Auth | Pre-populated in `.env.example` |

### LOCAL DEFAULTS THAT CAN BE LEFT AS THEY ARE

| Setting | Default Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/reachinbox` | Matches Docker PostgreSQL |
| `REDIS_HOST` | `localhost` | Matches Docker Redis |
| `REDIS_PORT` | `6379` | Matches Docker Redis |
| `ELASTICSEARCH_NODE` | `http://localhost:9200` | Matches Docker Elasticsearch |
| `WORKER_CONCURRENCY` | `5` | Configurable worker threads |
| `MIN_DELAY_BETWEEN_EMAILS_MS` | `2000` | 2 seconds provider delay |
| `MAX_EMAILS_PER_HOUR_PER_SENDER` | `200` | Hourly rate limit |
| `ETHEREAL_USER` / `PASSWORD` | *(empty)* | Auto-creates Ethereal test account |
