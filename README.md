# Daily Track Mobile

A mobile-first, role-based daily task & project tracker built with Next.js, designed for teams where developers and QA testers work simultaneously.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first)
- **Animation:** Framer Motion + `react-modal-sheet` (swipeable bottom sheets on `motion`)
- **Icons:** Lucide React (app) + custom animated SVG nav icons
- **State:** React Context only (no Redux/Zustand)
- **Charts:** Recharts

## Features

### Role-Based Access Control
Three roles with different capabilities:

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access to all views, user/role management, tester assignment |
| **Project Manager** | Multi-project oversight, employee tracking, ticket reassignment |
| **Employee** | Own task management, time logging, QA submission |

### QA (Tester) Workflow
A full QA-gated pipeline for ticket lifecycle:

```
todo → in_progress → ready_for_testing → in_testing → done
                          ↑                    ↓
                          └── failed (rework) ─┘
```

- **No direct move-back:** After `in_progress`, developers send a move-back request (note required). QA/PM approves to return to `todo`.
- **Assign-to-QA gate:** Testers can only be assigned when status is `ready_for_testing` or `in_testing`.
- **Move-back request queue:** Visible on Projects page per ticket.

### 5 Theme System
A professional theme system using the exact design language of Cursor's official themes (Dark, Light, Midnight) plus two beloved editor classics:

| Theme | Source | Mode |
|-------|--------|------|
| **Light** (default) | Cursor Light | Light · graphite on near-white, steel-blue accent |
| **Stealth** (default for dark OS) | Cursor Dark | Dark · near-black graphite, ice-blue accent |
| **Midnight** | Cursor Midnight (Nord) | Dark · soft Nordic, cyan/teal accents |
| **Tokyo Night** | Tokyo Night | Dark · deep indigo, blue/cyan |
| **One Light** | Atom One Light | Light · warm paper, gentle blue |

All follow Cursor's design principles: neutral graphite surfaces, ink-color-with-alpha for borders/text-muted/accent-soft, and professional steel/ice-blue accents.

- Single source of truth in `lib/themes.ts` (`ThemeVariables` typed object)
- Injected as `<style>` blocks via `ThemeProvider`, set via `data-theme` attribute on `<html>`
- Persists to `localStorage`, auto-selects Stealth when OS `prefers-color-scheme: dark`
- All components use CSS custom properties — no hardcoded colors

### Animated Bottom Navigation
A floating frosted-glass pill dock with:

- **Morphing blob indicator** — spring-animated `layoutId` shared layout morphing between tabs
- **SVG draw-in icons** — custom path-only icons with staggered `pathLength` draw animation on each tab switch
- **Icon pop** — subtle scale bounce on activation
- **Frosted glass** — `backdrop-blur-xl`, rounded pill, soft shadow, theme-aware
- **Calendar tab gated** — hidden until Google Calendar is connected; appears in dock after connect (profile connect button then hides)

### Custom Themed Dropdowns
Every native `<select>` replaced by `PickerDropdown` (`components/layout/PickerDropdown.tsx`):
- Bottom-sheet on mobile (`react-modal-sheet` drag-to-dismiss) + popover on desktop — same sheet as tracking detail
- Theme-aware: `var(--accent)`/`var(--surface)`/`var(--border)`, checkmark + color dot for projects
- Used in Calendar (reminder), Add Task (assignee/project), Create Project (coordinator), Slack channels, Jenkins (build status), Project detail (add member/reassign), Today filters

### Dashboard
- Greeting card (`bg-[var(--accent-soft)]`) with role badge `bg-[var(--accent)] text-[var(--bg)]` — adaptive `var(--bg)` ensures contrast on cyan/pink light accents (vs prior `white`)
- Stat cards (total, active, completed tasks, hours logged today)
- Task status breakdown chart (Recharts)
- Recent activity feed
- Calendar preview component

### Projects Page
- **Create Project (Admin/PM only)** via `CreateProjectSheet` (swipeable, `AnimatePresence` close `spring` 0.42s) — 4 sections: detail/client/docs/flow, delivery/weeks (approved/weekly hours + per-week goals), team (FE/BE/coordinator senior with full GitHub access), timeline milestones
- Accordion **slim** — collapsed hours bar (`pt-4`) + expanded shows only **Stats** (spent/approved/bugs, by `kind`/`module`, `Failed`) + `Detail` pill; full docs/flow/weekly/timeline/team/tickets live on detail page
- **Detail page** `app/projects/[projectId]/page.tsx` — hero, docs, delivery, team, timeline + add, stats, tickets + reassign/add, member add via themed dropdown
- Single `Detail` pill in header (`h-8 bg-[var(--accent)] text-[var(--bg)]`) — no duplicate side/bottom buttons
- Per-project member add/remove via themed dropdown, per-ticket reassignment with QA gate, move-back queue

### Tracking (PM View)
- **2 stat cards** — Total Employees (with QA engineer count) and Active Employees (with idle count), plus dedicated **Unassigned tasks** and **Idle employees** chips
- Clicking an employee **opens a swipe-to-close bottom sheet** (`react-modal-sheet`) with profile header, role badge, stat pills (Active / Done / Today / Total), daily-hours bar, and full task list
- Avatar remains a one-tap profile link to `/tracking/[employeeId]`
- **Filters now a single bottom-sheet modal** (same `Sheet` as detail) — `Filters` button with active-count badge opens `Project` + `Sort by` lists (check + color dot), `Clear` + `Show N employees` — replaces inline `PickerDropdown` pair
- Employee detail page (`/tracking/[employeeId]`): profile, projects, scheduled assignments (Yesterday/Today/Tomorrow), all tasks with per-task hours
- Sheets fully theme-aware and constrained to 430px frame

### Today View
- **PM/Admin:** Employee-centric accordions with name search, `Project` + `Sort` via themed `PickerDropdown` (bottom-sheet), sorted by hours/name/task count
- **Employee:** Task-centric view with status actions

### Log Page
- Work log history with privacy-gated hours
- All 11 `TaskActivityType` icons (including `submitted`, `in_testing`, `failed`, `move_requested`, `move_approved`)

### Calendar
- Simulated **Google Calendar** connection (one-tap connect/disconnect, obfuscated tokens, auto-refresh)
- Real-time event feed (Today / This Week) merging meetings with role-scoped task deadlines
- "Join" opens the meeting link; **in-app reminders** fire X minutes before each event (custom `PickerDropdown` for 5/10/15/30/60 min)
- 11 AM standup prompt card (non-blocking, links to Today)
- **Nav gating:** calendar bottom icon hidden until connected; profile `Connect` card hides after connect (hint "open it from the bottom navigation")

### Integrations — Simulated End-to-End
The build-notification + calendar spec runs **fully simulated** — every flow (Google OAuth, Slack Web API, Jenkins webhook) is backed by `localStorage`, so the whole feature set works with **zero credentials**. The service layer is isolated so each adapter can be swapped for the real API later.

- **Google Calendar (per user):** simulated OAuth consent + token issuance ("encrypted at rest" via obfuscation), one-hour token lifetime with automatic refresh, `calendar.events.list`-style feed.
- **Slack workspace:** simulated `conversations.create`, `chat.postMessage`, and Block Kit messages to `#general` / `#deployment` / custom channels. Managers + admins create channels on Profile via themed project dropdown.
- **Jenkins builds:** webhook contract (`jobName`, `status`, `buildNumber`, `logUrl`) recorded and announced to `#deployment`; failed builds also fire an alert to `#general`. A **"Run build" simulator** on Profile lets managers/admins demo the flow (status now via themed dropdown). A real `POST /api/webhooks/jenkins` route exists, guarded by `X-Jenkins-Secret` === `JENKINS_WEBHOOK_SECRET` (env only, never hardcoded).
- **Work Apps (Profile):** `WorkAppsSection` for **Slack, WhatsApp, Jira, Notion, GitHub, Figma, Linear, Asana** — per-user `localStorage` (`workAppsService.ts`), simulated OAuth (obfuscated token, `connectedAt`), `Connected/Not connected` badge, `8` app grid, toast on toggle. No credentials needed.
- **6 PM scheduler:** a 30-second tick (client-side) evaluates time prompts once per day per user:
  - 11 AM → "Align today's tasks" standup prompt (Calendar + Today pages)
  - 6 PM → personal **Quick Briefing** bottom sheet (completed / in-progress / pending / hours + build status)
  - 6 PM → team **wrap-up posted to `#general`** (completed, in progress, builds passed/failed, active projects)
- **Reminders:** push-style in-app toasts shortly before events, deduped per event per day.

### Profile
- User info with role badge ("QA Engineer" for testers)
- Quick links (Calendar, Log, My Tasks for non-PM, Admin for admin)
- Theme dropdown picker
- Integrations: **Work Apps** (8 apps) + Google Calendar connect/disconnect (hidden after connect), Slack channel manager (managers/admin), Jenkins build simulator + feed (managers/admin)

### Admin Panel
- User/role management with `assignRole`
- QA toggle (`setTester`) for employees
- User stats

## Seed Accounts

| Email | Role | Notes |
|-------|------|-------|
| `admin@icodelabs.com` | Admin | Full access |
| `pm@icodelabs.com` | Manager | PM views |
| `meera.iyer@icodelabs.com` | Employee | Frontend developer |

## Mock Data — Icodelabs (India)

The seed data models a realistic Indian service-based software company, defined in `lib/data/mock.ts`.

| Team | Count | Members |
|------|-------|---------|
| Admin / Owner | 1 | Rohit Kulkarni |
| Project Manager | 1 | Priya Deshmukh |
| Frontend & UI | 2 | Meera Iyer, Karthik Sundaram |
| Fullstack & Backend | 18 | Arjun Sharma → Kavya Krishnan |
| Design | 1 | Tanvi Shah |
| QA & Testing | 2 | Anjali Rao, Vikram Nair |

Total **25 users** (24 employees + admin). QA engineers carry the `isTester` flag with a **QA** badge across the app.

**8 service-based projects**, each with an Indian client (city shown in the origin):

| Project | Client | Status |
|---------|--------|--------|
| Subscription Billing Platform | CloudCart SaaS (Noida) | **Ongoing** |
| Hotel Booking Platform | StayEasy Hotels (Bengaluru) | Delivered |
| Loan Origination Suite | FinPe Payouts (Mumbai) | Delivered |
| D2C E-commerce Storefront | BazaarDirect (Gurugram) | Delivered |
| Clinic Management System | MediCore Health (Pune) | Delivered |
| Learning Management App | SkillSet Academy (Hyderabad) | Delivered |
| Fleet Tracking Portal | TransMove Logistics (Ahmedabad) | Delivered |
| Retail Inventory Suite | CityMart Retail (Kolkata) | Delivered |

11 seeded tasks (ticket prefix `IC-`) are concentrated on the ongoing billing platform, including one unassigned ticket visible in the Tracking "Unassigned tasks" alert.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

LAN: `next.config.ts` `allowedDevOrigins: ['10.98.249.33']` — run `npx next dev --hostname 0.0.0.0` and open `http://10.98.249.33:3000` (`http` not `https`; HSTS clear via `chrome://net-internals/#hsts` if needed).

## Project Structure

```
app/
├── admin/page.tsx          # User/role management
├── api/webhooks/jenkins/route.ts  # Env-guarded Jenkins webhook (simulated)
├── auth/page.tsx           # Login/signup
├── calendar/page.tsx       # Calendar view (Google Calendar feed + deadlines, reminder PickerDropdown)
├── dashboard/page.tsx      # Main dashboard (greeting badge text var(--bg))
├── log/page.tsx            # Work log history
├── profile/page.tsx        # User profile + theme picker + integrations (Work Apps, Calendar gated, Slack, Jenkins)
├── projects/
│   ├── page.tsx            # Project management (slim accordion, Detail pill → detail page)
│   └── [projectId]/page.tsx# Project detail & timeline (full docs/flow/weekly/team/milestones, themed dropdowns)
├── today/page.tsx          # Task view (PM filters via PickerDropdown)
├── tracking/
│   ├── page.tsx            # PM employee/task board (Filters bottom-sheet)
│   └── [employeeId]/page.tsx  # Employee detail
├── globals.css             # Theme vars + animations
└── layout.tsx              # Root layout + providers

components/
├── auth/                   # LoginForm, SignupForm, AuthTabs
├── calendar/               # CalendarPreview, EventCard
├── dashboard/              # ChartCard, StatCard
├── integrations/           # Toaster, BriefingModal, StandupPrompt, GoogleCalendarSection, ChannelsSection, JenkinsSection, WorkAppsSection
├── layout/                 # AppShell, BottomNav (calendar gated), Header, MobileShell, NavIcons, PickerDropdown (themed)
├── projects/               # CreateProjectSheet (AnimatePresence close)
├── tasks/                  # AddTaskSheet (PickerDropdown), DeleteNoteSheet, LogHoursSheet, NoteSheet, TaskCard
├── theme/                  # ThemeProvider, ThemeSwitcher
└── tracking/               # EmployeeDetailModal (swipeable bottom sheet)

lib/
├── auth.tsx                # Auth context (login, role management, tester toggle)
├── data/
│   ├── analytics.ts        # Computed analytics
│   ├── mock.ts             # Seed data (users, tasks, projects, workLogs)
│   ├── store.tsx           # Data store (createProject, timeline, add/assign/move)
│   └── types.ts            # All TypeScript types (User, Task, Project, TaskKind, etc.)
├── integrations/
│   ├── blockKit.ts         # Pure Block Kit builders (shared client + webhook route)
│   ├── briefing.ts         # 11AM/6PM prompt evaluation + summary builders
│   ├── calendarService.ts  # Simulated Google OAuth + events list/reminders
│   ├── IntegrationProvider.tsx # Context + 30s scheduler + toasts + calendar gating
│   ├── jenkinsService.ts   # Simulated Jenkins webhook/build registry
│   ├── simDb.ts            # localStorage persistence + date helpers
│   ├── slackService.ts     # Simulated Slack channels / chat.postMessage
│   ├── workAppsService.ts  # Simulated Work Apps (Slack/WhatsApp/Jira/Notion/GitHub/Figma/Linear/Asana)
│   └── types.ts            # Integration types
├── permissions.tsx         # Role-based permission hooks
├── themes.ts               # Theme definitions (ThemeId, ThemeVariables, THEMES)
└── mockData.ts             # Legacy mock data
```

## Key Design Decisions

- **100svh layout** (not 100vh) for correct mobile viewport height
- **Mobile-first** with 430px max-width phone frame
- **CSS custom properties** cascade through the entire app — themes change everything instantly
- **No hardcoded colors** — all components reference `var(--accent)`, `var(--text-muted)`, etc.
- **Custom dropdowns** — `PickerDropdown` replaces every native `<select>` (Sheet on mobile, popover on desktop), theme-matched
- **Bottom sheets are swipe-to-dismiss** via `react-modal-sheet` (drag down or flick to close, backdrop tap) and are restyled in `globals.css` to follow the active theme
- **Calendar nav gated** by `connection.connected` — bottom icon + profile button hide/show via `IntegrationProvider`
- **Projects:** accordion slim (only `Stats`) + `CreateProjectSheet` `AnimatePresence` `spring` close; full detail on dedicated page
- **Secrets never hardcoded** — all env vars (`JENKINS_WEBHOOK_SECRET`, etc.) read from `process.env`; simulated tokens are obfuscated, not plaintext
- **Simulated integrations are isolated** in `lib/integrations/*` with a pure Block Kit builder shared by both the client simulators and the `/api/webhooks/jenkins` route, so swapping in real APIs only touches the service layer
- **React Context only** — no external state management for simplicity
