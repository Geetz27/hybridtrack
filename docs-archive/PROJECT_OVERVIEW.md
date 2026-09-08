# HybridTrack — Project Overview

> A hybrid training tracker for runners and gym-goers, built with React + Firebase.  
> Log runs, gym sessions, and recovery — all synced to the cloud.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Key Pages / Tabs](#2-key-pages--tabs)
3. [Components](#3-components)
4. [Firebase Usage](#4-firebase-usage)
5. [Current Features](#5-current-features)
6. [Risks & Technical Debt](#6-risks--technical-debt)
7. [Future Roadmap](#7-future-roadmap)

---

## 1. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Firebase Backend                          │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │ Firebase Auth       │  │ Cloud Firestore              │   │
│  │ (Google Sign-In)    │  │ collection: users/{uid}/     │   │
│  │                     │  │   workouts/{docId}           │   │
│  └─────────────────────┘  └──────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              Vite Dev Server (port 5173)                     │
│              React 19 + Tailwind CSS 3                       │
│              Single-Page Application (SPA)                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    App.jsx (2694 lines)                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │ Dashboard │  │QuickInput│  │ History  │  │WeeklyPlan  │   │
│  │ (Tab 1)   │  │ (Tab 2)  │  │ (Tab 3)  │  │ (Tab 4)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘   │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Progression      │  │ Performance      │                  │
│  │ Tracker          │  │ Ticker           │                  │
│  └──────────────────┘  └──────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **Single-file monolith**: All 2694 lines of application code live in `src/App.jsx`. No code splitting, no lazy loading.
- **State management**: React `useState` only — no Redux, Zustand, or Context API beyond what's inherent in the component tree.
- **Real-time sync**: Firestore `onSnapshot` listener provides live updates whenever data changes.
- **Tab-based navigation**: Manual `activeTab` state toggles between views — no router library.
- **Weekly plan is local-only**: The training plan lives in React state and is persisted only via manual JSON export/import. It is NOT saved to Firestore.

---

## 2. Key Pages / Tabs

### Tab 1: Dashboard (`activeTab === 'dashboard'`)

The main landing page after login. Displays:

- **DashboardHero**: Weekly performance summary (run distance, gym sessions, consistency %)
- **StrengthProgressCard**: Best exercise progress over 90 days with mini SVG trend chart
- **RunningProgressCard**: 5K PB, 30-day average pace, longest run with trend chart
- **Today's Plan Card**: Shows the current day's workout from the weekly plan
- **Next Session Suggestion**: AI-like recommendation based on last workout type
- **Alerts Section**: Overtraining warnings from the coach engine (e.g., "3 sesi terakhir RPE tinggi")

### Tab 2: Input (`activeTab === 'add'`)

Data entry form with three modes:

- **Lari (Run)**: Distance, duration, heart rate, cadence, RPE slider, plan execution status. Auto-calculates pace.
- **Gym**: Exercise cards with set/weight/reps inputs, template picker from history, "Load Last Session" button, total volume calculator.
- **Recovery**: Sleep hours, body weight, DOMS slider, fatigue slider.

Auto-fills from the weekly plan when the selected date matches a planned session.

### Tab 3: History (`activeTab === 'history'`)

Workout log grouped by date with:

- Expandable gym sessions showing all exercises and sets
- Edit (pencil icon) and Delete (trash icon) buttons
- HR zone badges for runs
- Export PDF button that opens `ExportModal`

### Tab 4: Plan (`activeTab === 'plan'`)

Weekly training plan viewer/editor:

- 7-day strip showing day name, session type, and "HARI INI" indicator
- Click a day to view session details (exercises with sets, run targets, notes)
- Edit mode: Add/remove exercises, edit sets, change run targets
- Import JSON: Paste a plan from clipboard
- Export JSON: Download the plan as a `.json` file

### Additional Views (embedded in Dashboard)

- **ProgressionTracker**: All-time stats, personal records (PRs), exercise performance history, weekly bar charts for run distance and gym volume
- **PerformanceTicker ("Run Pulse")**: Dark-themed SVG chart showing pace/distance trends with smooth cubic bezier curves

---

## 3. Components

All components are defined as functions in `src/App.jsx`:

| Component | Type | Purpose |
|-----------|------|---------|
| `App` | Root | Auth state, Firestore CRUD, tab routing, toast, edit modal |
| `WeeklyPlanTab` | Page | Weekly plan viewer/editor with import/export |
| `Dashboard` | Page | Main dashboard aggregating all stats |
| `DashboardHero` | Section | Hero banner with weekly metrics |
| `HeroMetric` | UI | Individual metric tile in hero |
| `StrengthProgressCard` | Card | Best exercise progress with trend |
| `ProgressMetric` | UI | Metric display for strength card |
| `RunningProgressCard` | Card | Running markers display |
| `RunMetric` | UI | Metric display for running card |
| `MiniTrend` | Chart | Inline SVG sparkline chart |
| `QuickInput` | Page | Data entry form (Run/Gym/Recovery) |
| `History` | Page | Workout history grouped by date |
| `ExportModal` | Modal | PDF export with date range picker |
| `ProgressionTracker` | Section | All-time stats, PRs, exercise performance |
| `AllTimeStats` | Section | Compact all-time stats tiles |
| `BarChart` | Chart | Pure CSS vertical bar chart |
| `PerformanceTicker` | Section | Dark "Run Pulse" SVG chart |
| `EditModal` | Modal | Bottom sheet for editing workouts |
| `ExerciseField` | Form | Exercise selector with template dropdown |
| `NavButton` | UI | Bottom/top navigation button |
| `InputField` | Form | Reusable text/number/date input |
| `SelectField` | Form | Reusable dropdown select |
| `SliderField` | Form | Reusable RPE/soreness/fatigue slider |

### Helper Functions

| Function | Purpose |
|----------|---------|
| `analyzeAlerts` | Coach engine — detects overtraining patterns |
| `getDashboardSummary` | Aggregates current week stats |
| `getExerciseProgress` | 90-day strength progression analysis |
| `getRunningProgress` | Running metrics computation |
| `getWeeklyRunData` | Weekly run aggregation for charts |
| `getWeeklyGymData` | Weekly gym volume aggregation for charts |
| `gymVolume` | Calculates total volume for a gym workout |
| `gymDisplayInfo` | Generates display string for gym workouts |
| `gymBestWeights` | Extracts best weight per exercise |
| `getHRZone` | Classifies heart rate into zones Z1–Z5 |
| `formatPace` | Formats pace as `m:ss /km` |
| `formatDashboardTime` | Formats minutes as `m:ss` |
| `getCurrentWeekRange` | Calculates current week date range |
| `parseLocalDate` | Parses date string to Date object |
| `getGymPRs` | Calculates personal records (referenced, defined elsewhere) |
| `getExercisePerformance` | Exercise history data (referenced, defined elsewhere) |

---

## 4. Firebase Usage

### Authentication

- **Provider**: Google Sign-In (`signInWithPopup`)
- **State**: `onAuthStateChanged` listener sets `user` state
- **UI**: Login page with Google button when not authenticated; logout button in header

### Firestore Database

- **Collection path**: `users/{uid}/workouts/{docId}`
- **Document ID**: Generated from `Date.now().toString()`
- **Real-time listener**: `onSnapshot` on the workouts subcollection
- **Write operations**:
  - `setDoc` — Create new workout (with `createdAt` timestamp)
  - `setDoc` with `{ merge: true }` — Update existing workout
  - `deleteDoc` — Delete a workout

### Data Schema (Workout Document)

```javascript
// Run workout
{
  type: "Lari",
  category: "Easy Run" | "Tempo" | "Interval" | "Long Run" | "Recovery",
  date: "2026-06-23",
  distance: 5.0,        // km
  duration: 30,          // minutes
  pace: 6.0,             // min/km (computed)
  hr: 150,               // optional
  cadence: 170,          // optional
  rpe: 5,                // 1-10
  planStatus: "Sesuai Plan" | "Terlalu Berat" | "Terlalu Ringan" | "Missed Plan",
  notes: "..."
}

// Gym workout (v3 — current format)
{
  type: "Gym",
  category: "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full Body",
  date: "2026-06-23",
  exercises: [
    {
      exercise: "Bench Press",
      sets: [
        { weight: 50, reps: 10 },
        { weight: 55, reps: 8 }
      ]
    }
  ],
  rpe: 7,
  notes: "..."
}

// Recovery workout
{
  type: "Recovery",
  date: "2026-06-23",
  sleep: 7.5,            // hours
  soreness: 5,           // 1-10
  fatigue: 5,            // 1-10
  weight: 65.0,          // optional, kg
  notes: "..."
}
```

### What is NOT in Firebase

- **Weekly training plan**: Stored only in React state. Must be manually imported/exported as JSON.
- **User profile/settings**: No user preferences, goals, or profile data stored.
- **Exercise library**: No master list of exercises — they're inferred from workout history.

---

## 5. Current Features

### ✅ Implemented

| Feature | Details |
|---------|---------|
| Google Authentication | Sign in/sign out with Google account |
| Real-time Cloud Sync | Workouts auto-sync via Firestore listener |
| Run Logging | Distance, duration, pace, HR, cadence, RPE |
| Gym Logging | Multiple exercises, sets/weight/reps, RPE, volume calculation |
| Recovery Logging | Sleep, DOMS, fatigue, body weight |
| Weekly Training Plan | 7-day plan viewer with edit mode |
| Plan Import/Export | JSON import from clipboard, JSON file download |
| Plan Auto-fill | Input form auto-fills from plan when date matches |
| Dashboard | Weekly summary, strength/running progress, today's plan |
| Coach Alerts | Overtraining detection (high RPE, hard easy runs) |
| Next Session Suggestion | Context-aware recommendation based on last workout |
| Workout History | Grouped by date, expandable gym sessions |
| Edit Workouts | Full edit modal for all workout types |
| Delete Workouts | One-click delete with Firestore sync |
| Personal Records | Best weight×reps per exercise |
| Exercise Performance | Historical view of any exercise's progression |
| Weekly Bar Charts | Run distance and gym volume over 7 weeks |
| Run Pulse Chart | Dark-themed SVG chart with smooth curves |
| PDF Export | Printable workout report with date range |
| Exercise Templates | Quick-fill from previous sessions |
| HR Zone Classification | Z1–Z5 based on heart rate |
| Toast Notifications | "Data tersimpan di Cloud!" confirmation |
| Loading Screen | Animated loading while auth state resolves |
| Responsive Design | Mobile-first with Tailwind, bottom nav on mobile |

### ❌ Not Implemented / Gaps

| Gap | Impact |
|-----|--------|
| Weekly plan not persisted | Plan edits lost on page refresh |
| No error boundaries | Any crash breaks the entire app |
| No loading states for CRUD | No feedback during save/delete |
| No data validation | Invalid data can be written to Firestore |
| No offline support | App requires internet connection |
| No unit tests | No test coverage at all |
| No TypeScript | No type safety for complex data shapes |
| No routing library | URL doesn't reflect current view |
| No dark mode | Light theme only |
| No PWA support | Cannot install as app |
| No API integrations | No Strava/Garmin/Apple Watch import |

---

## 6. Risks & Technical Debt

### 🔴 Critical Risks

| # | Risk | Severity | Details |
|---|------|----------|---------|
| 1 | **Missing function: `formatDateID()`** | 🔴 High | Referenced at line 1994 but never defined. Will throw `ReferenceError` at runtime when `ProgressionTracker` renders. |
| 2 | **Single 2694-line file** | 🔴 High | Impossible to maintain, test, or debug efficiently. Any change risks breaking unrelated features. |
| 3 | **Weekly plan not persisted** | 🔴 High | Users lose their training plan on page refresh. Manual export/import is fragile. |
| 4 | **Hardcoded Firebase keys** | 🟡 Medium | API keys exposed in source. While somewhat acceptable for Firebase, env vars are best practice. |

### 🟡 Moderate Issues

| # | Issue | Details |
|---|-------|---------|
| 5 | **No TypeScript** | Complex data shapes (3 workout format versions) would benefit from interfaces. |
| 6 | **Dynamic Tailwind classes** | `bg-${c}-500/20` patterns (line 1341) won't be tree-shaken — classes may not exist in production build. |
| 7 | **`useEffect` missing dependency** | Line 1148 suppresses ESLint warning — `applyPlanForDate` not in dependency array. |
| 8 | **Inconsistent data schema** | Supports v1 (flat), v2 (sets array), v3 (exercises array) — `gymVolume()` handles all three, adding complexity. |
| 9 | **No loading states** | Firestore writes have no UI feedback beyond console.error on failure. |
| 10 | **Deeply nested JSX** | Many components have 5+ levels of nesting, reducing readability. |

### 🔸 Minor Issues

| # | Issue | Details |
|---|-------|---------|
| 11 | **Unused CSS** | `App.css` contains legacy Vite template styles — not used by the app. |
| 12 | **`dist-check/` in repo** | Pre-built dist output checked into source control — should be in `.gitignore`. |
| 13 | **No tests** | Zero test files or configuration. |
| 14 | **Custom `pb-safe` class** | Not defined in Tailwind config — may not apply. |
| 15 | **External Google logo URL** | Uses `svgrepo.com` for Google icon — will break without internet. |
| 16 | **No input sanitization** | User input is written directly to Firestore without validation. |

---

## 7. Future Roadmap

### Phase 1: Stabilize (Immediate)

- [ ] **Fix `formatDateID()` bug** — Define the missing function or replace with inline formatting
- [ ] **Persist weekly plan to Firestore** — Save under `users/{uid}/plan` so edits survive refresh
- [ ] **Add error boundaries** — Wrap each tab in an `ErrorBoundary` component
- [ ] **Add loading states** — Show spinners during Firestore write operations

### Phase 2: Refactor (Short-term)

- [ ] **Split App.jsx into modules** — Extract into separate files:
  - `src/pages/Dashboard.jsx`
  - `src/pages/QuickInput.jsx`
  - `src/pages/History.jsx`
  - `src/pages/WeeklyPlanTab.jsx`
  - `src/pages/ProgressionTracker.jsx`
  - `src/components/PerformanceTicker.jsx`
  - `src/components/EditModal.jsx`
  - `src/components/ui/` (InputField, SelectField, SliderField, NavButton)
  - `src/utils/` (helpers, Firebase config)
- [ ] **Move Firebase config to `.env`** — Use `VITE_FIREBASE_*` environment variables
- [ ] **Remove unused `App.css`** — Clean up legacy styles

### Phase 3: Enhance (Medium-term)

- [ ] **Add TypeScript** — Define interfaces for all data shapes
- [ ] **Add React Router** — URL-based navigation (`/dashboard`, `/history`, `/plan`, `/input`)
- [ ] **Add data validation** — Validate workout shapes before Firestore writes
- [ ] **Add unit tests** — Vitest + React Testing Library
- [ ] **Add dark mode** — Tailwind dark mode with theme toggle
- [ ] **Add PWA support** — Service worker, manifest, offline capability

### Phase 4: Expand (Long-term)

- [ ] **Add workout templates** — Pre-built Push/Pull/Legs programs
- [ ] **Add Strava/Garmin integration** — Import activities via API
- [ ] **Add social features** — Share workouts, compare with friends
- [ ] **Add advanced analytics** — Training load, fatigue management, periodization
- [ ] **Add coach/athlete mode** — Coaches can assign plans and review athlete data
- [ ] **Add data export** — CSV/Excel export alongside current PDF
- [ ] **Add body measurements tracking** — Weight, body fat, measurements over time

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*
