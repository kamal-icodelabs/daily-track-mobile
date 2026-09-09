# Daily Track Mobile

A mobile-first, role-based daily task & project tracker built with Next.js, designed for teams where developers and QA testers work simultaneously.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first)
- **Animation:** Framer Motion
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
A mood-based theme system with ambient background glow:

| Theme | Mode | Vibe |
|-------|------|------|
| **Light** (default) | Light | Crisp, clean, focused |
| **Stealth Dark** (default for dark OS) | Dark | Near-black, high-contrast, cyan accent |
| **Vibrant** | Dark | Bold purple, energetic, high saturation |
| **Pastel** | Light | Soft pink/lavender, gentle |
| **Hill** | Light | Calm teal, soothing |

- Single source of truth in `lib/themes.ts` (`ThemeVariables` typed object)
- Injected as `<style>` blocks via `ThemeProvider`, set via `data-theme` attribute on `<html>`
- Persists to `localStorage`, auto-selects dark theme when OS `prefers-color-scheme: dark`
- All components use CSS custom properties — no hardcoded colors

### Animated Bottom Navigation
A floating frosted-glass pill dock with:

- **Morphing blob indicator** — spring-animated `layoutId` shared layout morphing between tabs
- **SVG draw-in icons** — custom path-only icons with staggered `pathLength` draw animation on each tab switch
- **Icon pop** — subtle scale bounce on activation
- **Frosted glass** — `backdrop-blur-xl`, rounded pill, soft shadow, theme-aware

### Dashboard
- Stat cards (total, active, completed tasks, hours logged today)
- Task status breakdown chart (Recharts)
- Recent activity feed
- Calendar preview component

### Projects Page
- Accordion project cards (expand/collapse with animation)
- Per-project member list with add/remove
- Per-ticket reassignment with QA gate
- Move-back request queue with approve
- "Add ticket" per project

### Tracking (PM View)
- Team summary cards with gradient tints
- Employee accordions with task counts, hours bar, status badges
- Avatar as one-tap profile link (not inside accordion)
- Employee detail page (`/tracking/[employeeId]`): profile, projects, scheduled assignments (Yesterday/Today/Tomorrow), all tasks with per-task hours

### Today View
- **PM/Admin:** Employee-centric accordions with name search, project filter, sort by hours/name/task count
- **Employee:** Task-centric view with status actions

### Log Page
- Work log history with privacy-gated hours
- All 11 `TaskActivityType` icons (including `submitted`, `in_testing`, `failed`, `move_requested`, `move_approved`)

### Calendar
- Merges seed meetings with role-scoped task deadlines

### Profile
- User info with role badge ("QA Engineer" for testers)
- Quick links (Calendar, Log, My Tasks for non-PM, Admin for admin)
- Theme dropdown picker
- Integrations panel

### Admin Panel
- User/role management with `assignRole`
- QA toggle (`setTester`) for employees
- User stats

## Seed Accounts

| Email | Role | Notes |
|-------|------|-------|
| `admin@dayly.com` | Admin | Full access |
| `sara@dayly.com` | Manager | PM views |
| `priya@dayly.com` | Employee | Developer |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── admin/page.tsx          # User/role management
├── auth/page.tsx           # Login/signup
├── calendar/page.tsx       # Calendar view
├── dashboard/page.tsx      # Main dashboard
├── log/page.tsx            # Work log history
├── profile/page.tsx        # User profile + theme picker
├── projects/page.tsx       # Project management (accordion)
├── today/page.tsx          # Task view (PM/employee)
├── tracking/
│   ├── page.tsx            # PM employee/task board
│   └── [employeeId]/page.tsx  # Employee detail
├── globals.css             # Theme vars + animations
└── layout.tsx              # Root layout + providers

components/
├── auth/                   # LoginForm, SignupForm, AuthTabs
├── calendar/               # CalendarPreview, EventCard
├── dashboard/              # ChartCard, StatCard
├── integrations/           # IntegrationsPanel
├── layout/                 # AppShell, BottomNav, Header, MobileShell, NavIcons, PickerDropdown
├── tasks/                  # AddTaskSheet, DeleteNoteSheet, LogHoursSheet, NoteSheet, TaskCard
└── theme/                  # ThemeProvider, ThemeSwitcher

lib/
├── auth.tsx                # Auth context (login, role management, tester toggle)
├── data/
│   ├── analytics.ts        # Computed analytics
│   ├── mock.ts             # Seed data (users, tasks, projects, workLogs)
│   ├── store.tsx           # Data store (add/assign/move/reassign tasks)
│   └── types.ts            # All TypeScript types (User, Task, Project, etc.)
├── integrations/           # Stub adapters (Slack, GitHub, Figma)
├── permissions.tsx         # Role-based permission hooks
├── themes.ts               # Theme definitions (ThemeId, ThemeVariables, THEMES)
└── mockData.ts             # Legacy mock data
```

## Key Design Decisions

- **100svh layout** (not 100vh) for correct mobile viewport height
- **Mobile-first** with 430px max-width phone frame
- **CSS custom properties** cascade through the entire app — themes change everything instantly
- **No hardcoded colors** — all components reference `var(--accent)`, `var(--text-muted)`, etc.
- **React Context only** — no external state management for simplicity
