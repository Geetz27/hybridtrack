# HybridTrack — Refactor Plan

> Large components, tight coupling, repeated logic, and step-by-step extraction phases.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Large Component Breakdown](#2-large-component-breakdown)
3. [Tight Coupling Map](#3-tight-coupling-map)
4. [Repeated Logic Inventory](#4-repeated-logic-inventory)
5. [Recommended File Structure](#5-recommended-file-structure)
6. [Phase 1: Low-Risk Extraction](#6-phase-1-low-risk-extraction)
7. [Phase 2: Page Extraction](#7-phase-2-page-extraction)
8. [Phase 3: Component Extraction](#8-phase-3-component-extraction)
9. [Phase 4: Utility Consolidation](#9-phase-4-utility-consolidation)
10. [Phase 5: State & Data Layer](#10-phase-5-state--data-layer)
11. [Dependency Graph](#11-dependency-graph)
12. [Rollback Strategy](#12-rollback-strategy)

---

## 1. Current Architecture Analysis

### Current State

```
src/
├── App.jsx          ← 2694 lines, ALL application code
├── App.css          ← 184 lines, DEAD (unused)
├── index.css        ← 5 lines, Tailwind directives
├── main.jsx         ← 10 lines, React entry point
└── assets/          ← EMPTY directory
```

### What's Inside App.jsx

| Category | Count | Lines (approx.) |
|----------|-------|----------------|
| Firebase config + Auth | 1 block | ~30 lines |
| App root component | 1 | ~400 lines |
| Page-level components | 6 | ~1500 lines |
| UI components | 7 | ~300 lines |
| Helper functions | 16 | ~200 lines |
| Modal components | 2 | ~250 lines |

### Problem Summary

- **No separation of concerns** — Firebase, auth, routing, pages, components, and helpers all in one file
- **No module boundaries** — Any component can access any state, any function
- **No lazy loading** — All code loaded upfront, even if user never visits a tab
- **No testability** — Cannot test any component in isolation without importing the entire file

---

## 2. Large Component Breakdown

### Component Size Estimates

| Component | Est. Lines | Complexity | Extraction Priority |
|-----------|-----------|------------|---------------------|
| `App` (root) | ~400 | 🔴 High | 1st — must be split first |
| `QuickInput` | ~450 | 🔴 High | 2nd — largest page |
| `Dashboard` | ~350 | 🔴 High | 3rd — many sub-components |
| `History` | ~200 | 🟡 Medium | 4th |
| `EditModal` | ~220 | 🟡 Medium | 5th |
| `WeeklyPlanTab` | ~200 | 🟡 Medium | 6th |
| `ProgressionTracker` | ~180 | 🟡 Medium | 7th |
| `PerformanceTicker` | ~180 | 🟡 Medium | 8th |
| `ExerciseField` | ~100 | 🟢 Low | 9th |
| `ExportModal` | ~80 | 🟢 Low | 10th |
| `DashboardHero` | ~60 | 🟢 Low | 11th |
| `StrengthProgressCard` | ~50 | 🟢 Low | 12th |
| `RunningProgressCard` | ~50 | 🟢 Low | 13th |
| UI components (7) | ~200 | 🟢 Low | 14th |

### What Makes Each Component Large

#### `App` (root) — ~400 lines
- Firebase initialization and config
- Auth state management (`onAuthStateChanged`)
- Firestore CRUD operations (`handleAddData`, `handleDelete`, `handleEdit`)
- Tab routing logic (`activeTab` state)
- Toast notification system
- Weekly plan state management
- Coach alert engine integration
- Conditional rendering of all 4 tabs + modals

#### `QuickInput` — ~450 lines
- Three workout modes (Run/Gym/Recovery) with separate form sections
- Plan auto-fill logic
- Exercise card management (add/remove exercises, add/remove sets)
- Template picker integration
- Total volume calculation
- RPE sliders
- HR zone display
- Pace auto-calculation

#### `Dashboard` — ~350 lines
- DashboardHero with 3 HeroMetric tiles
- StrengthProgressCard with MiniTrend chart
- RunningProgressCard with RunMetric tiles
- Today's Plan card
- Next Session Suggestion
- Coach Alerts section
- Conditional rendering of ProgressionTracker and PerformanceTicker

---

## 3. Tight Coupling Map

### Current Dependency Graph

```
App (root)
├── Firebase config (hardcoded)
├── Auth state (useState)
├── Workouts state (useState)
├── Weekly plan state (useState)
├── Tab state (useState)
│
├── handleAddData() ──────────────► Firestore (setDoc)
├── handleDelete() ───────────────► Firestore (deleteDoc)
├── handleEdit() ─────────────────► Firestore (setDoc + merge)
├── analyzeAlerts() ──────────────► workouts state
├── getDashboardSummary() ────────► workouts state
│
├── Dashboard ────────────────────► workouts, weeklyPlan, user
│   ├── DashboardHero
│   ├── StrengthProgressCard ─────► getExerciseProgress()
│   ├── RunningProgressCard ──────► getRunningProgress()
│   ├── ProgressionTracker ───────► workouts (full array)
│   └── PerformanceTicker ────────► workouts (full array)
│
├── QuickInput ───────────────────► workouts, weeklyPlan, handleAddData
│   └── ExerciseField ────────────► workouts (for templates)
│
├── History ──────────────────────► workouts, handleDelete, handleEdit
│   └── ExportModal
│
├── WeeklyPlanTab ────────────────► weeklyPlan, setWeeklyPlan
│
└── EditModal ────────────────────► workout object, onSave callback
```

### Tight Coupling Issues

| # | Issue | Components Affected | Severity |
|---|-------|-------------------|----------|
| TC1 | **All components depend on `workouts` state from App** | Dashboard, QuickInput, History, ProgressionTracker, PerformanceTicker, ExerciseField | 🔴 High |
| TC2 | **Firebase CRUD functions defined in App, passed as props** | QuickInput, History, EditModal | 🔴 High |
| TC3 | **`weeklyPlan` state managed in App, passed to 3 components** | Dashboard, QuickInput, WeeklyPlanTab | 🟡 Medium |
| TC4 | **Helper functions defined at module level, used by all** | All components | 🟡 Medium |
| TC5 | **No Context API — all data flows through App props** | All components | 🟡 Medium |

---

## 4. Repeated Logic Inventory

### Logic That Appears in Multiple Places

| # | Logic Pattern | Locations | Lines | Action |
|---|--------------|-----------|-------|--------|
| R1 | **Pace formatting** | `formatPace()` (2081) + `formatPaceTicker()` (2518) | 2 | Consolidate into 1 function |
| R2 | **Date formatting** | `formatDateShort()` (2525) + missing `formatDateID()` (1994) | 2 | Consolidate into 1 utility |
| R3 | **Input styling classes** | `InputField` (2475), `SelectField` (2487), `EditModal` (2311) | 3 | Define shared constant |
| R4 | **Exercise template dropdown** | `ExerciseField` lines 2167–2181 + 2209–2223 | 2 | Extract sub-component |
| R5 | **Color mapping arrays** | `QuickInput` (~1341) + `ExerciseField` (~2142) | 2 | Define in constants file |
| R6 | **HR zone badge rendering** | `getHRZone()` (2089) + inline in `EditModal` (2355) | 2 | Create `HRZoneBadge` component |
| R7 | **Workout type filtering** | `w.type === 'Lari'`, `w.type === 'Gym'`, `w.type === 'Recovery'` | ~15 places | Define filter constants |
| R8 | **Date sorting** | `new Date(a.date) - new Date(b.date)` | ~5 places | Create `sortByDate()` helper |
| R9 | **Gym volume calculation** | `gymVolume()` (2103) + inline in QuickInput | 2 | Use single function everywhere |
| R10 | **ChevronDown icon** | `ExerciseField` lines 2179, 2221, 2239 | 3 | Acceptable duplication |

---

## 5. Recommended File Structure

### Target Architecture

```
src/
├── main.jsx                          # React entry point (unchanged)
├── index.css                         # Tailwind directives (unchanged)
├── App.jsx                           # Reduced to ~50 lines (orchestrator only)
│
├── firebase/
│   ├── config.js                     # Firebase init + credentials
│   ├── auth.js                       # loginWithGoogle, handleLogout, onAuthChange
│   └── db.js                         # getWorkouts, addWorkout, updateWorkout, deleteWorkout
│
├── utils/
│   ├── format.js                     # formatPace, formatDate, formatDateID, formatDashboardTime
│   ├── analytics.js                  # getDashboardSummary, getExerciseProgress, getRunningProgress
│   ├── gym.js                        # gymVolume, gymDisplayInfo, gymBestWeights, getGymPRs
│   ├── run.js                        # getHRZone, getWeeklyRunData, getRunningProgress
│   ├── coach.js                      # analyzeAlerts, getNextSessionSuggestion
│   └── constants.js                  # DAY_KEYS, SESSION_COLORS, HR_ZONES, EXERCISE_COLORS, DEFAULT_PLAN
│
├── hooks/
│   ├── useWorkouts.js                # Firestore onSnapshot + CRUD operations
│   ├── useAuth.js                    # Auth state management
│   └── useWeeklyPlan.js              # Weekly plan state + Firestore sync
│
├── context/
│   └── AppContext.jsx                # Shared state provider (workouts, user, weeklyPlan)
│
├── components/
│   ├── NavButton.jsx                 # Navigation button
│   ├── MiniTrend.jsx                 # SVG sparkline chart
│   ├── BarChart.jsx                  # CSS bar chart
│   ├── HRZoneBadge.jsx               # Heart rate zone badge
│   ├── ExerciseField.jsx             # Exercise selector with templates
│   ├── EditModal.jsx                 # Workout edit bottom sheet
│   ├── ExportModal.jsx               # PDF export modal
│   ├── CoachAlert.jsx                # Single alert card
│   ├── NextSessionCard.jsx           # Next session suggestion card
│   ├── TodayPlanCard.jsx             # Today's workout from plan
│   └── ui/
│       ├── InputField.jsx            # Reusable text/number/date input
│       ├── SelectField.jsx           # Reusable dropdown
│       ├── SliderField.jsx           # Reusable RPE/soreness/fatigue slider
│       ├── Toast.jsx                 # Toast notification
│       └── LoadingScreen.jsx         # Loading spinner
│
└── pages/
    ├── Dashboard.jsx                 # Dashboard + DashboardHero + cards
    ├── QuickInput.jsx                # Data entry form (Run/Gym/Recovery)
    ├── History.jsx                   # Workout history grouped by date
    ├── WeeklyPlanTab.jsx             # Weekly plan viewer/editor
    ├── ProgressionTracker.jsx        # All-time stats + PRs + exercise performance
    └── PerformanceTicker.jsx         # Dark "Run Pulse" SVG chart
```

### File Count Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| `firebase/` | 3 | Firebase config, auth, database operations |
| `utils/` | 6 | Pure helper functions (no React) |
| `hooks/` | 3 | Custom React hooks for state management |
| `context/` | 1 | React Context provider |
| `components/` | 15 | Reusable UI components |
| `components/ui/` | 5 | Primitive UI components |
| `pages/` | 6 | Page-level components |
| **Total** | **~39** | Down from 1 monolithic file |

---

## 6. Phase 1: Low-Risk Extraction

> **Goal:** Extract pure utility functions that have NO React dependencies.  
> **Risk:** Very low — these are pure functions that can be tested independently.  
> **Time:** ~1 hour

### Step 1.1 — Create `src/utils/constants.js`

Extract all magic numbers and string constants:

```javascript
// HR Zones
export const HR_ZONES = [
  { max: 114, zone: 'Z1', label: 'Very Light', color: '...' },
  { max: 134, zone: 'Z2', label: 'Easy', color: '...' },
  { max: 154, zone: 'Z3', label: 'Moderate', color: '...' },
  { max: 174, zone: 'Z4', label: 'Hard', color: '...' },
  { max: Infinity, zone: 'Z5', label: 'Max', color: '...' },
];

// Exercise card colors
export const EXERCISE_COLORS = ['fuchsia', 'pink', 'sky', 'amber', 'emerald'];

// Run categories
export const RUN_CATEGORIES = ['Easy Run', 'Tempo', 'Interval', 'Long Run', 'Recovery'];

// Gym categories
export const GYM_CATEGORIES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];

// Plan execution statuses
export const PLAN_STATUSES = ['Sesuai Plan', 'Terlalu Berat', 'Terlalu Ringan', 'Missed Plan'];

// Day keys
export const DAY_KEYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

// Session colors for plan
export const SESSION_COLORS = { Lari: '#14B8A6', Gym: '#8B5CF6', Recovery: '#14B8A6', Rest: '#CBD5E1' };

// Max limits
export const MAX_SETS_PER_EXERCISE = 4;
export const MAX_EXERCISES_PER_SESSION = 5;
```

### Step 1.2 — Create `src/utils/format.js`

Extract all formatting functions:

```javascript
export function formatPace(durationMin, distanceKm) { ... }
export function formatPaceShort(paceDecimal) { ... }  // consolidated from formatPaceTicker
export function formatDateID(dateStr) { ... }          // THE MISSING FUNCTION
export function formatDateShort(dateStr) { ... }
export function formatDashboardTime(minutes) { ... }
export function parseLocalDate(dateStr) { ... }
```

### Step 1.3 — Create `src/utils/gym.js`

Extract all gym-related helpers:

```javascript
export function gymVolume(workout) { ... }
export function gymDisplayInfo(workout) { ... }
export function gymBestWeights(workout) { ... }
export function getGymPRs(workouts) { ... }
```

### Step 1.4 — Create `src/utils/run.js`

Extract all running-related helpers:

```javascript
export function getHRZone(hr) { ... }
export function getWeeklyRunData(workouts) { ... }
```

### Step 1.5 — Create `src/utils/analytics.js`

Extract dashboard analytics:

```javascript
export function getDashboardSummary(workouts) { ... }
export function getExerciseProgress(workouts, exerciseName) { ... }
export function getRunningProgress(workouts) { ... }
export function getWeeklyGymData(workouts) { ... }
```

### Step 1.6 — Create `src/utils/coach.js`

Extract coach engine:

```javascript
export function analyzeAlerts(workouts) { ... }
export function getNextSessionSuggestion(workouts, weeklyPlan) { ... }
```

### Verification

After Phase 1, verify:
- [ ] All imports in App.jsx point to new utility files
- [ ] No functions were modified (pure extraction)
- [ ] App still works exactly as before

---

## 7. Phase 2: Page Extraction

> **Goal:** Extract each page-level component into its own file.  
> **Risk:** Medium — pages depend on props from App. Must ensure all props are passed correctly.  
> **Time:** ~2–3 hours

### Step 2.1 — Extract `PerformanceTicker` (easiest — self-contained)

```javascript
// src/pages/PerformanceTicker.jsx
export default function PerformanceTicker({ workouts }) { ... }
```

- **Dependencies:** `workouts` prop, `formatPaceShort` from utils
- **No state management needed** — purely presentational

### Step 2.2 — Extract `ProgressionTracker`

```javascript
// src/pages/ProgressionTracker.jsx
export default function ProgressionTracker({ workouts }) { ... }
```

- **Dependencies:** `workouts` prop, `formatDateID` from utils
- **Note:** This is where the `formatDateID()` crash bug lives — fix it during extraction

### Step 2.3 — Extract `WeeklyPlanTab`

```javascript
// src/pages/WeeklyPlanTab.jsx
export default function WeeklyPlanTab({ weeklyPlan, setWeeklyPlan }) { ... }
```

- **Dependencies:** `weeklyPlan` state + setter
- **Self-contained** — no Firestore dependency

### Step 2.4 — Extract `History`

```javascript
// src/pages/History.jsx
export default function History({ workouts, onDelete, onEdit }) { ... }
```

- **Dependencies:** `workouts` prop, `handleDelete` + `handleEdit` callbacks
- **Contains `ExportModal`** — either import it or keep inline

### Step 2.5 — Extract `QuickInput` (hardest — largest page)

```javascript
// src/pages/QuickInput.jsx
export default function QuickInput({ workouts, weeklyPlan, onSave }) { ... }
```

- **Dependencies:** `workouts`, `weeklyPlan`, `handleAddData` callback
- **Contains `ExerciseField`** — import from components
- **Contains plan auto-fill logic** — may need to extract into a hook

### Step 2.6 — Extract `Dashboard`

```javascript
// src/pages/Dashboard.jsx
export default function Dashboard({ workouts, weeklyPlan, user }) { ... }
```

- **Dependencies:** `workouts`, `weeklyPlan`, `user`
- **Contains sub-components:** `DashboardHero`, `StrengthProgressCard`, `RunningProgressCard`
- **Contains conditional rendering** of `ProgressionTracker` and `PerformanceTicker`

### Verification

After Phase 2, verify:
- [ ] Each page renders correctly in isolation
- [ ] All props are passed correctly from App
- [ ] Tab navigation still works
- [ ] No regressions in any page

---

## 8. Phase 3: Component Extraction

> **Goal:** Extract reusable UI components and modal components.  
> **Risk:** Low — these are self-contained presentational components.  
> **Time:** ~1–2 hours

### Step 3.1 — Extract UI primitives to `src/components/ui/`

```javascript
// src/components/ui/InputField.jsx
export default function InputField({ label, type, value, onChange, ... }) { ... }

// src/components/ui/SelectField.jsx
export default function SelectField({ label, value, onChange, options, ... }) { ... }

// src/components/ui/SliderField.jsx
export default function SliderField({ label, value, onChange, ... }) { ... }

// src/components/ui/Toast.jsx
export default function Toast({ message, visible }) { ... }

// src/components/ui/LoadingScreen.jsx
export default function LoadingScreen() { ... }
```

### Step 3.2 — Extract shared components to `src/components/`

```javascript
// src/components/NavButton.jsx
export default function NavButton({ icon, label, active, onClick }) { ... }

// src/components/MiniTrend.jsx
export default function MiniTrend({ data, color }) { ... }

// src/components/BarChart.jsx
export default function BarChart({ data, maxValue, color }) { ... }

// src/components/HRZoneBadge.jsx
export default function HRZoneBadge({ hr }) { ... }

// src/components/CoachAlert.jsx
export default function CoachAlert({ alert }) { ... }

// src/components/NextSessionCard.jsx
export default function NextSessionCard({ suggestion }) { ... }

// src/components/TodayPlanCard.jsx
export default function TodayPlanCard({ dayPlan }) { ... }
```

### Step 3.3 — Extract modal components

```javascript
// src/components/EditModal.jsx
export default function EditModal({ workout, onClose, onSave }) { ... }

// src/components/ExportModal.jsx
export default function ExportModal({ workouts, onClose }) { ... }

// src/components/ExerciseField.jsx
export default function ExerciseField({ value, onChange, workouts, ... }) { ... }
```

### Step 3.4 — Extract Dashboard sub-components

```javascript
// src/components/DashboardHero.jsx
export default function DashboardHero({ summary }) { ... }

// src/components/HeroMetric.jsx
export default function HeroMetric({ label, value, unit, icon }) { ... }

// src/components/StrengthProgressCard.jsx
export default function StrengthProgressCard({ progress }) { ... }

// src/components/RunningProgressCard.jsx
export default function RunningProgressCard({ progress }) { ... }

// src/components/ProgressMetric.jsx
export default function ProgressMetric({ label, value, trend }) { ... }

// src/components/RunMetric.jsx
export default function RunMetric({ label, value, unit }) { ... }
```

### Verification

After Phase 3, verify:
- [ ] All components render correctly with their props
- [ ] No circular dependencies between components
- [ ] UI primitives are reusable (no page-specific logic)

---

## 9. Phase 4: Utility Consolidation

> **Goal:** Eliminate all duplicate logic identified in the repeated logic inventory.  
> **Risk:** Medium — changing function signatures may affect callers.  
> **Time:** ~1–2 hours

### Step 4.1 — Consolidate pace formatting

```javascript
// BEFORE: Two separate functions
function formatPace(durationMin, distanceKm) { return `${min}:${sec} /km`; }
function formatPaceTicker(p) { return `${min}:${sec}`; }

// AFTER: Single function with options
export function formatPace(durationMin, distanceKm, options = {}) {
  const paceDecimal = durationMin / distanceKm;
  const min = Math.floor(paceDecimal);
  const sec = Math.round((paceDecimal - min) * 60);
  const pace = `${min}:${sec.toString().padStart(2, '0')}`;
  return options.noSuffix ? pace : `${pace} /km`;
}
```

### Step 4.2 — Consolidate date formatting

```javascript
// BEFORE: formatDateShort() exists, formatDateID() is missing
// AFTER: Single function
export function formatDateID(dateStr, options = {}) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    day: '2-digit',
    month: options.short ? '2-digit' : 'short',
    year: 'numeric',
  });
}
```

### Step 4.3 — Consolidate input styling

```javascript
// src/utils/constants.js
export const INPUT_CLASSES = 'w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3.5 text-[#0F172A] text-sm focus:outline-none transition-colors placeholder:text-[#94A3B8]';
export const INPUT_FOCUS = 'focus:border-[#14B8A6]';
export const LABEL_CLASSES = 'block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider';
```

### Step 4.4 — Consolidate exercise template dropdown

Extract the template dropdown from `ExerciseField` into a reusable sub-component:

```javascript
// src/components/ExerciseTemplateDropdown.jsx
export default function ExerciseTemplateDropdown({ templates, category, onSelect, activeColor }) {
  if (templates.length === 0) return null;
  return (
    <div className="mb-2">
      <label className={LABEL_CLASSES}>Template {category || 'Gym'}</label>
      <div className="relative mb-2">
        <select
          defaultValue=""
          onChange={e => { if (e.target.value) onSelect(e.target.value); }}
          className={`w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-3 text-[#0F172A] text-sm font-medium focus:outline-none transition-colors appearance-none ${activeColor || 'focus:border-[#CBD5E1]'}`}
        >
          <option value="">Pilih dari latihan {category || 'Gym'} sebelumnya...</option>
          {templates.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
      </div>
    </div>
  );
}
```

### Step 4.5 — Consolidate color mapping

```javascript
// src/utils/constants.js
export const EXERCISE_COLORS = ['fuchsia', 'pink', 'sky', 'amber', 'emerald'];

// Usage in any component:
import { EXERCISE_COLORS } from '../utils/constants';
const color = EXERCISE_COLORS[index % EXERCISE_COLORS.length];
```

### Verification

After Phase 4, verify:
- [ ] All duplicate functions are consolidated
- [ ] No broken imports or references
- [ ] All callers use the new consolidated functions

---

## 10. Phase 5: State & Data Layer

> **Goal:** Extract Firebase logic into custom hooks and Context API.  
> **Risk:** High — changing state management affects the entire app.  
> **Time:** ~3–4 hours

### Step 5.1 — Create `src/firebase/config.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

### Step 5.2 — Create `src/firebase/auth.js`

```javascript
import { auth, googleProvider } from './config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export function loginWithGoogle() { return signInWithPopup(auth, googleProvider); }
export function logout() { return signOut(auth); }
export function onAuthChange(callback) { return onAuthStateChanged(auth, callback); }
```

### Step 5.3 — Create `src/firebase/db.js`

```javascript
import { db } from './config';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const WORKOUTS_PATH = (uid) => `users/${uid}/workouts`;

export function subscribeWorkouts(uid, callback) {
  const ref = collection(db, WORKOUTS_PATH(uid));
  return onSnapshot(ref, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}

export async function addWorkout(uid, workout) {
  const docId = Date.now().toString(); // Keep existing pattern for now
  const ref = doc(db, WORKOUTS_PATH(uid), docId);
  await setDoc(ref, { ...workout, createdAt: serverTimestamp() });
}

export async function updateWorkout(uid, workoutId, data) {
  const ref = doc(db, WORKOUTS_PATH(uid), workoutId);
  await setDoc(ref, data, { merge: true });
}

export async function deleteWorkout(uid, workoutId) {
  const ref = doc(db, WORKOUTS_PATH(uid), workoutId);
  await deleteDoc(ref);
}
```

### Step 5.4 — Create `src/hooks/useAuth.js`

```javascript
import { useState, useEffect } from 'react';
import { onAuthChange, loginWithGoogle, logout } from '../firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, isLoading, login: loginWithGoogle, logout };
}
```

### Step 5.5 — Create `src/hooks/useWorkouts.js`

```javascript
import { useState, useEffect } from 'react';
import { subscribeWorkouts, addWorkout, updateWorkout, deleteWorkout } from '../firebase/db';

export function useWorkouts(uid) {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeWorkouts(uid, setWorkouts);
    return unsubscribe;
  }, [uid]);

  const handleAdd = async (data) => {
    if (!uid) return;
    await addWorkout(uid, { ...data, createdAt: Date.now().toString() });
  };

  const handleEdit = async (workoutId, data) => {
    if (!uid) return;
    await updateWorkout(uid, workoutId, data);
  };

  const handleDelete = async (workoutId) => {
    if (!uid) return;
    await deleteWorkout(uid, workoutId);
  };

  return { workouts, addWorkout: handleAdd, editWorkout: handleEdit, deleteWorkout: handleDelete };
}
```

### Step 5.6 — Create `src/hooks/useWeeklyPlan.js`

```javascript
import { useState } from 'react';
import { DEFAULT_WEEKLY_PLAN } from '../utils/constants';

export function useWeeklyPlan() {
  const [weeklyPlan, setWeeklyPlan] = useState(DEFAULT_WEEKLY_PLAN);

  // Future: Add Firestore sync here
  // useEffect(() => { ... }, [uid]);

  return { weeklyPlan, setWeeklyPlan };
}
```

### Step 5.7 — Create `src/context/AppContext.jsx`

```javascript
import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWorkouts } from '../hooks/useWorkouts';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, isLoading, login, logout } = useAuth();
  const { workouts, addWorkout, editWorkout, deleteWorkout } = useWorkouts(user?.uid);
  const { weeklyPlan, setWeeklyPlan } = useWeeklyPlan();

  return (
    <AppContext.Provider value={{
      user, isLoading, login, logout,
      workouts, addWorkout, editWorkout, deleteWorkout,
      weeklyPlan, setWeeklyPlan,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
```

### Step 5.8 — Simplify `App.jsx`

After all extractions, `App.jsx` becomes:

```javascript
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import QuickInput from './pages/QuickInput';
import History from './pages/History';
import WeeklyPlanTab from './pages/WeeklyPlanTab';
import NavButton from './components/NavButton';
import LoadingScreen from './components/ui/LoadingScreen';
import Toast from './components/ui/Toast';

function AppContent() {
  const { user, isLoading, login, logout, workouts, addWorkout, editWorkout, deleteWorkout, weeklyPlan, setWeeklyPlan } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState({ message: '', visible: false });

  if (isLoading) return <LoadingScreen />;
  if (!user) return <LoginPage onLogin={login} />;

  return (
    <div className="...">
      {/* Header with logout */}
      {/* Tab navigation */}
      {/* Conditional page rendering */}
      {/* Toast notification */}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
```

**Target size:** ~80–100 lines (down from ~400)

### Verification

After Phase 5, verify:
- [ ] Auth flow works (login/logout)
- [ ] Firestore CRUD works (add/edit/delete)
- [ ] Real-time sync works
- [ ] Weekly plan state is preserved
- [ ] All pages render correctly with context

---

## 11. Dependency Graph

### Extraction Order (Dependency-Aware)

```
Phase 1: Utils (no dependencies)
  constants.js ← no deps
  format.js    ← no deps
  gym.js       ← no deps
  run.js       ← no deps
  analytics.js ← depends on gym.js, run.js
  coach.js     ← depends on analytics.js

Phase 2: Pages (depend on utils)
  PerformanceTicker.jsx  ← format.js
  ProgressionTracker.jsx ← format.js, gym.js
  WeeklyPlanTab.jsx      ← constants.js
  History.jsx            ← format.js, gym.js
  QuickInput.jsx         ← format.js, gym.js, run.js, constants.js
  Dashboard.jsx          ← analytics.js, coach.js, format.js

Phase 3: Components (depend on utils + constants)
  ui/InputField.jsx      ← constants.js
  ui/SelectField.jsx     ← constants.js
  ui/SliderField.jsx     ← constants.js
  NavButton.jsx          ← no deps
  MiniTrend.jsx          ← no deps
  BarChart.jsx           ← no deps
  HRZoneBadge.jsx        ← run.js
  EditModal.jsx          ← format.js, gym.js, run.js, constants.js
  ExportModal.jsx        ← format.js
  ExerciseField.jsx      ← constants.js

Phase 4: Consolidation (modifies existing utils)
  format.js              ← merge formatPace + formatPaceTicker
  constants.js           ← add INPUT_CLASSES, LABEL_CLASSES

Phase 5: State Layer (depends on everything above)
  firebase/config.js     ← no deps
  firebase/auth.js       ← config.js
  firebase/db.js         ← config.js
  hooks/useAuth.js       ← firebase/auth.js
  hooks/useWorkouts.js   ← firebase/db.js
  hooks/useWeeklyPlan.js ← constants.js
  context/AppContext.jsx  ← all hooks
  App.jsx (simplified)   ← AppContext.jsx
```

### File Creation Order

When implementing, create files in this exact order to avoid import errors:

```
1.  src/utils/constants.js
2.  src/utils/format.js
3.  src/utils/gym.js
4.  src/utils/run.js
5.  src/utils/analytics.js
6.  src/utils/coach.js
7.  src/firebase/config.js
8.  src/firebase/auth.js
9.  src/firebase/db.js
10. src/hooks/useAuth.js
11. src/hooks/useWorkouts.js
12. src/hooks/useWeeklyPlan.js
13. src/context/AppContext.jsx
14. src/components/ui/InputField.jsx
15. src/components/ui/SelectField.jsx
16. src/components/ui/SliderField.jsx
17. src/components/ui/Toast.jsx
18. src/components/ui/LoadingScreen.jsx
19. src/components/NavButton.jsx
20. src/components/MiniTrend.jsx
21. src/components/BarChart.jsx
22. src/components/HRZoneBadge.jsx
23. src/components/CoachAlert.jsx
24. src/components/NextSessionCard.jsx
25. src/components/TodayPlanCard.jsx
26. src/components/ExerciseTemplateDropdown.jsx
27. src/components/ExerciseField.jsx
28. src/components/EditModal.jsx
29. src/components/ExportModal.jsx
30. src/components/DashboardHero.jsx
31. src/components/HeroMetric.jsx
32. src/components/StrengthProgressCard.jsx
33. src/components/RunningProgressCard.jsx
34. src/components/ProgressMetric.jsx
35. src/components/RunMetric.jsx
36. src/pages/PerformanceTicker.jsx
37. src/pages/ProgressionTracker.jsx
38. src/pages/WeeklyPlanTab.jsx
39. src/pages/History.jsx
40. src/pages/QuickInput.jsx
41. src/pages/Dashboard.jsx
42. src/App.jsx (simplified)
```

---

## 12. Rollback Strategy

### Per-Phase Rollback

| Phase | Rollback Method | Complexity |
|-------|----------------|------------|
| **Phase 1** (Utils) | Delete new files, restore old imports | 🟢 Easy — pure functions, no side effects |
| **Phase 2** (Pages) | Delete page files, restore inline JSX in App.jsx | 🟡 Medium — may need git checkout |
| **Phase 3** (Components) | Delete component files, restore inline JSX | 🟡 Medium — similar to Phase 2 |
| **Phase 4** (Consolidation) | Revert to old function signatures | 🟡 Medium — affects multiple callers |
| **Phase 5** (State Layer) | Revert App.jsx, delete new files | 🔴 Hard — affects entire app architecture |

### Git Strategy

```bash
# Before starting each phase, create a checkpoint
git add -A && git commit -m "checkpoint: before phase N"

# If something goes wrong during phase N
git reset --hard HEAD~1

# If phase N is successful
git tag "refactor-phase-N-complete"
```

### Testing Strategy

```bash
# After each phase, run the dev server and verify
npm run dev

# Check for:
# 1. No console errors
# 2. All tabs render correctly
# 3. CRUD operations work
# 4. No regression in existing features
```

### Risk Matrix

| Phase | Risk Level | Reason |
|-------|-----------|--------|
| Phase 1 | 🟢 Low | Pure function extraction — no runtime impact |
| Phase 2 | 🟡 Medium | Props must be passed correctly; easy to miss one |
| Phase 3 | 🟢 Low | Self-contained components; easy to verify |
| Phase 4 | 🟡 Medium | Function signature changes may break callers |
| Phase 5 | 🔴 High | State management rewrite; affects every component |

### Recommended Implementation Order

```
Week 1: Phase 1 (Utils) + Phase 4 (Consolidation)
  → Low risk, high confidence
  → Fix formatDateID() crash bug immediately

Week 2: Phase 3 (Components)
  → Medium risk, easy to verify
  → Extract UI primitives first, then shared components

Week 3: Phase 2 (Pages)
  → Medium risk, depends on Phase 1 + 3
  → Extract PerformanceTicker first (easiest), then QuickInput last (hardest)

Week 4: Phase 5 (State Layer)
  → High risk, depends on all previous phases
  → Create firebase/ files first, then hooks, then context
  → Simplify App.jsx last
```

---

## Summary

### What Will Change

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Files** | 1 monolithic file | ~39 focused files | 39× better organization |
| **App.jsx size** | ~2694 lines | ~80–100 lines | 96% reduction |
| **Component coupling** | Tight (all in one file) | Loose (via props/context) | Significantly better |
| **Testability** | Impossible | Possible (unit tests per file) | Major improvement |
| **Code duplication** | 10+ instances | 0 instances | Clean codebase |
| **Onboarding time** | Hours to understand | Minutes to navigate | Much faster |
| **Bug risk** | High (formatDateID crash) | Low (isolated, testable) | Much safer |

### What Won't Change

- **UI appearance** — All Tailwind classes remain identical
- **User experience** — Same tabs, same forms, same interactions
- **Firebase structure** — Same Firestore collection/document structure
- **Data format** — Same workout schema (v1/v2/v3 backward compatibility)
- **Build process** — Same Vite config, same dependencies

### Total Estimated Effort

| Phase | Time | Risk | Dependencies |
|-------|------|------|-------------|
| Phase 1: Utils | ~1 hour | 🟢 Low | None |
| Phase 2: Pages | ~2–3 hours | 🟡 Medium | Phase 1 |
| Phase 3: Components | ~1–2 hours | 🟢 Low | Phase 1 |
| Phase 4: Consolidation | ~1–2 hours | 🟡 Medium | Phase 1 |
| Phase 5: State Layer | ~3–4 hours | 🔴 High | All previous |
| **Total** | **~8–12 hours** | | |

### Success Criteria

- [ ] App.jsx is under 100 lines
- [ ] No duplicate logic exists
- [ ] All components are in their own files
- [ ] Firebase logic is in dedicated files
- [ ] Context API manages shared state
- [ ] All existing features work without regression
- [ ] `formatDateID()` crash bug is fixed
- [ ] `workout.exercise` fallback is fixed in EditModal

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*
