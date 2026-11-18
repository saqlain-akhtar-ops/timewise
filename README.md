# TIMEWISE — Plan Smarter. Focus Better. Achieve More.

**TIMEWISE** is a production-ready Student Productivity and Self-Regulated Learning Web Application built for school, undergraduate, and postgraduate students. Developed as part of a university **SDG Action Lab** project aligned with **UN Sustainable Development Goal 4 (Quality Education — Target 4.4)**, TIMEWISE helps students plan academic responsibilities, organize weekly study schedules, prioritize assignments, execute Pomodoro focus sessions, and calibrate their time-estimation skills through historical analytics.

---

## 1. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS + Custom Design Tokens |
| **UI Components** | Accessible custom modal, dialog, and card primitives (shadcn/ui style) |
| **Icons** | Lucide React |
| **Data Visualization** | Recharts (Responsive Bar, Line, and Pie charts) |
| **Persistence** | Centralized, schema-versioned Browser `localStorage` layer (`TIMEWISE_STORAGE_V1`) |
| **AI Integration** | Next.js Server-Side Route (`/api/ai`) supporting Google Gemini / OpenAI + Deterministic Rule-Based Fallback |
| **Testing** | Vitest automated test suite |
| **Deployment Target** | Vercel |

---

## 2. Core Features & Architecture

1. **Dual Account & Workspace Architecture**:
   - **Individual Student Workspaces**: Registration, login, logout, profile management, and instant account switching. Each student receives a unique internal `userId` with strictly isolated tasks, subjects, planner events, focus sessions, preferences, and productivity analytics.
   - **Shared Demo Workspace**: Accessible with one click without registration. Preloaded with realistic sample subjects, tasks (completed, in-progress, overdue, upcoming), weekly schedule blocks, and historical focus sessions. All sample records are clearly badged (`Sample`) and can be restored anytime via **Reset Demo Data** without affecting personal student accounts.
2. **Smart Task Management (`/tasks`)**:
   - Create, edit, delete (with confirmation dialog), complete, and prioritize tasks (`high`, `medium`, `low`) across custom academic subjects.
   - Real-time search, subject/priority/status filters, deadline/priority sorting, overdue highlighting, and inline status/priority updates.
3. **Weekly Study Planner (`/planner`)**:
   - Monday–Sunday (or Sunday–Saturday) calendar with Previous/Next/Today navigation, Weekly and Daily views, and hourly slot scheduling.
   - Prevents invalid time ranges, detects and highlights overlapping sessions, and provides a dedicated **Planned Time vs. Estimated Task Duration vs. Actual Recorded Focus Time** comparison table.
4. **Focus Room — Pomodoro Timer (`/focus`)**:
   - Large circular SVG countdown timer with customizable Focus (default 25m), Short Break (5m), Long Break (15m), and cycle intervals.
   - Uses **timestamp-based remaining-time calculation** (`targetEndTimestamp - Date.now()`) so background tab throttling never distorts the timer.
   - Prevents duplicate session records and never records incomplete/reset/skipped sessions as completed. Automatically increments linked task `actualMinutes`.
5. **AI Study Assistant (`/assistant`)**:
   - Server-side `/api/ai` endpoint that uses `AI_PROVIDER` and `AI_API_KEY` when configured, and automatically falls back to the verified **Rule-Based Study Engine** when no API key is present.
   - Transparently badges whether recommendations came from External AI or the Rule-Based Fallback.
   - **Explicit Approval Workflow**: Never silently modifies student data. Students review and approve individual schedule blocks or broken-down subtasks before they are added to the workspace.
6. **Productivity Analytics (`/analytics`)**:
   - Date range filters (`Today`, `Last 7 Days`, `Last 30 Days`, `Custom Range`).
   - Exact **Task Completion Rate** and **Planning Accuracy** (`max(0, 100 - (|Actual - Estimated| / Estimated) * 100)`) calculated strictly for tasks with valid estimated and actual durations, clearly labelled as an estimation calibration metric.
7. **Profile, Settings & Portability (`/settings`)**:
   - Update student profile, timer defaults, light/dark slate theme, week-start preference, export full workspace as **JSON** or productivity records as **CSV**, and reset personal or demo workspaces independently.

---

## 3. Local Installation & Development

### Prerequisites
- **Node.js** v18.17+ or v20/v24 LTS
- **npm** v9+

### Setup Steps

```bash
# 1. Navigate to the project directory
cd timewise

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables for external AI
cp .env.example .env.local

# 4. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run build` | Runs production build and static/route verification |
| `npm start` | Starts the compiled production server |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm test` | Runs Vitest automated unit & integration test suite |

---

## 4. Environment Variables

Copy `.env.example` to `.env.local` (or add in Vercel Project Settings):

```env
# Optional: "gemini" or "openai"
AI_PROVIDER=gemini

# Optional: Server-side API Key (never exposed to client bundle)
AI_API_KEY=

# Optional: Model override (e.g., gemini-2.5-flash or gpt-4o-mini)
AI_MODEL=gemini-2.5-flash
```

> **Note:** TIMEWISE is 100% functional without an `AI_API_KEY`. When omitted, `/api/ai` uses the built-in Rule-Based Scheduling & Prioritization Engine and clearly labels the output source.

---

## 5. Deploying to Vercel

1. Push this repository to **GitHub**.
2. Log in to [Vercel](https://vercel.com) and click **Add New... → Project**.
3. Import your GitHub repository (`timewise`).
4. Framework Preset will automatically be detected as **Next.js**.
5. *(Optional)* Add `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` under **Environment Variables**.
6. Click **Deploy**. Direct navigation to all nested routes (`/dashboard`, `/tasks`, `/planner`, `/focus`, `/assistant`, `/analytics`, `/settings`) works out of the box.

---

## 6. Known Limitations & Security Notice

- **Prototype Identity & Persistence (`localStorage`)**: Per the Release 1.0 specification, all user accounts and workspaces are persisted in the browser's `localStorage`. Passwords are salted and hashed using SHA-256 digests (plaintext passwords are never stored), and each student workspace is isolated by `userId`. However, `localStorage` is a single-browser prototype persistence mechanism—not production cloud authentication or cross-device database synchronization.
- **Future Database Migration**: All storage operations are centralized in `lib/storage/index.ts` and `hooks/use-timewise.tsx`, allowing seamless replacement with Supabase or PostgreSQL in a future release.
