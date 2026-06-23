# HybridTrack — Code Health Report

> Dead code, unused functions, duplicate logic, runtime crash risks, and missing null checks.

---

## Table of Contents

1. [Dead Code](#1-dead-code)
2. [Unused Functions & Variables](#2-unused-functions--variables)
3. [Duplicate Logic](#3-duplicate-logic)
4. [Potential Runtime Crashes](#4-potential-runtime-crashes)
5. [Missing Null Checks](#5-missing-null-checks)
6. [Code Smells](#6-code-smells)
7. [Health Score Summary](#7-health-score-summary)

---

## 1. Dead Code

### D1 — `src/App.css` (184 lines, entirely unused)

| Field | Value |
|-------|-------|
| **File** | `src/App.css` |
| **What** | Legacy Vite template styles (`.counter`, `.hero`, `.vite`, `.framework`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks`) |
| **Why dead** | The app uses Tailwind CSS exclusively. `App.css` is never imported in `App.jsx` or anywhere else. |
| **Impact** | 184 lines of dead code. Confusing for new developers. |
| **Action** | Delete the file. |

### D2 — `src/assets/` directory (empty)

| Field | Value |
|-------|-------|
| **Path** | `src/assets/` |
| **What** | Empty directory |
| **Why dead** | No assets are stored here. The app uses inline SVGs and external URLs. |
| **Impact** | Negligible. Just clutter. |
| **Action** | Remove the empty directory. |

### D3 — `dist-check/` directory (pre-built output in source control)

| Field | Value |
|-------|-------|
| **Path** | `dist-check/` |
| **What** | Pre-built production output checked into the repository |
| **Why dead** | Build artifacts should not be in version control. The `dist/` folder is already in `.gitignore`. |
| **Impact** | Bloats repo size. Confuses the purpose of the `dist/` folder. |
| **Action** | Add `dist-check/` to `.gitignore` and remove from tracking. |

### D4 — `public/favicon.svg` and `public/icons.svg` (Vite defaults)

| Field | Value |
|-------|-------|
| **Path** | `public/favicon.svg`, `public/icons.svg` |
| **What** | Default Vite favicon and icons |
| **Why dead** | The app doesn't have a custom favicon. These are the default Vite assets. |
| **Impact** | Minor. The app uses the default Vite icon in the browser tab. |
| **Action** | Replace with custom HybridTrack branding, or keep as-is. |

### D5 — `index.html` default Vite meta tags

| Field | Value |
|-------|-------|
| **Path** | `index.html` |
| **What** | Default Vite `<title>`, meta description, and OG tags |
| **Why dead** | Still says "Vite + React" as the page title. |
| **Impact** | Browser tab shows "Vite + React" instead of "HybridTrack". |
| **Action** | Update `<title>` and meta tags. |

---

## 2. Unused Functions & Variables

### U1 — `getGymPRs()` function (referenced but behavior unclear)

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` — referenced in `ProgressionTracker` |
| **Status** | The function is called but its definition is not clearly separated. The PR logic is embedded inline in `ProgressionTracker` rather than being a standalone reusable function. |
| **Impact** | Low. The logic works but is not reusable. |

### U2 — `getExercisePerformance()` function (referenced but behavior unclear)

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` — referenced in `ProgressionTracker` |
| **Status** | Similar to `getGymPRs` — the logic is embedded inline rather than extracted. |
| **Impact** | Low. Works but not reusable. |

### U3 — `editSets` state variable in `EditModal`

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 2277 |
| **Code** | `const [editSets, setEditSets] = useState([]); // kept for non-gym use` |
| **Why unused** | This state is initialized but never read or updated anywhere in the component. The comment says "kept for non-gym use" but it's never used. |
| **Impact** | 🟡 Medium. Dead state variable that could confuse developers. |
| **Action** | Remove the unused state. |

### U4 — `InputField`, `SelectField`, `SliderField` component props

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` lines 2469–2512 |
| **What** | These utility components accept `activeColor` prop but it's only used in some instances. |
| **Impact** | 🟢 Low. The prop works, just inconsistently applied. |

### U5 — `pb-safe` CSS class

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 635 |
| **Code** | `className="... pb-safe ..."` |
| **Why dead** | `pb-safe` is not defined in `tailwind.config.js` or any CSS file. Tailwind's JIT compiler will ignore it. |
| **Impact** | 🟢 Low. Padding-bottom on mobile nav may not apply correctly. |

### U6 — `@types/react` and `@types/react-dom` in devDependencies

| Field | Value |
|-------|-------|
| **Location** | `package.json` |
| **What** | TypeScript type packages are installed (`@types/react@^19.2.14`, `@types/react-dom@^19.2.3`) |
| **Why unused** | The project uses plain JavaScript (`.jsx`), not TypeScript (`.tsx`). These type packages are never used. |
| **Impact** | 🟢 Low. Unnecessary dependencies. Adds ~5MB to `node_modules`. |
| **Action** | Remove from `devDependencies` if not planning TypeScript soon. |

---

## 3. Duplicate Logic

### DP1 — Pace formatting logic duplicated

| Field | Value |
|-------|-------|
| **Locations** | `formatPace()` (line 2081) and `formatPaceTicker()` (line 2518) |
| **Code** | Both functions do the same thing: convert decimal minutes to `m:ss /km` format. |
| **Difference** | `formatPace` returns `"m:ss /km"`, `formatPaceTicker` returns `"m:ss"` (without the `/km` suffix). |
| **Impact** | 🟡 Medium. Two functions with nearly identical logic. If one is fixed, the other may be forgotten. |
| **Action** | Consolidate into a single `formatPace(min, km, { suffix: true })` function. |

### DP2 — Date formatting logic duplicated

| Field | Value |
|-------|-------|
| **Locations** | `formatDateShort()` (line 2525) and the missing `formatDateID()` (referenced at line 1994) |
| **Code** | Both format dates using `toLocaleDateString('id-ID', ...)` with slightly different options. |
| **Impact** | 🟡 Medium. The missing `formatDateID()` is a crash bug (see PRIORITY_FIXES.md #1). |
| **Action** | Consolidate into a single date formatting utility. |

### DP3 — HR zone logic duplicated

| Field | Value |
|-------|-------|
| **Locations** | `getHRZone()` (line 2089) and inline zone rendering in `EditModal` (line 2355) |
| **Code** | `getHRZone` is a standalone function, but `EditModal` also renders zone badges inline. |
| **Impact** | 🟢 Low. The function is used, but the rendering logic is duplicated. |
| **Action** | Create a reusable `HRZoneBadge` component. |

### DP4 — Exercise template dropdown duplicated

| Field | Value |
|-------|-------|
| **Locations** | `ExerciseField` component (lines 2167–2181 and 2209–2223) |
| **Code** | The template dropdown `<select>` is rendered twice in the same component — once for the "new exercise" mode and once for the "select existing" mode. |
| **Impact** | 🟡 Medium. Identical JSX block duplicated. Any change to the dropdown must be made in two places. |
| **Action** | Extract the template dropdown into a separate sub-component. |

### DP5 — Input styling classes duplicated

| Field | Value |
|-------|-------|
| **Locations** | `InputField` (line 2475), `SelectField` (line 2487), and inline in `EditModal` (line 2311) |
| **Code** | The same Tailwind class string `w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3.5 text-[#0F172A] text-sm focus:outline-none transition-colors placeholder:text-[#94A3B8]` is repeated in multiple places. |
| **Impact** | 🟡 Medium. If the design system changes, every instance must be updated. |
| **Action** | Define a shared `inputCls` constant or use a CSS class. |

### DP6 — `ChevronDown` icon SVG duplicated

| Field | Value |
|-------|-------|
| **Locations** | Lines 2179, 2221, 2239 |
| **Code** | The same `ChevronDown` icon is rendered three times in `ExerciseField`. |
| **Impact** | 🟢 Low. Minor duplication. |
| **Action** | Could be extracted, but acceptable for a small icon. |

### DP7 — Color mapping arrays duplicated

| Field | Value |
|-------|-------|
| **Locations** | `QuickInput` (around line 1341) and `ExerciseField` (around line 2142) |
| **Code** | Color arrays for exercise cards (e.g., `['fuchsia', 'pink', 'sky', 'amber', 'emerald']`) are defined in multiple places. |
| **Impact** | 🟢 Low. Small arrays, but could drift apart. |
| **Action** | Define once in a constants file. |

---

## 4. Potential Runtime Crashes

### C1 — `formatDateID()` is undefined (🔴 CRITICAL)

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 1994 |
| **Code** | `{formatDateID(item.date)}` |
| **What** | The function `formatDateID()` is called but never defined anywhere in the file. |
| **Consequence** | `ReferenceError: formatDateID is not defined` — the entire app crashes when `ProgressionTracker` renders. |
| **Trigger** | Navigating to Dashboard tab. |
| **Fix** | Define the function or replace with inline formatting. |

### C2 — `workout.exercise` may be undefined in `EditModal` header (🔴 CRITICAL)

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 2322 |
| **Code** | `<h3>Edit {workout.type === 'Gym' ? workout.exercise : 'Recovery'}</h3>` |
| **What** | For v3 gym workouts (with `exercises[]` array), `workout.exercise` is undefined. The old v1/v2 format had a single `exercise` field, but v3 uses `exercises[0].exercise`. |
| **Consequence** | The modal header shows "Edit undefined" for v3 gym workouts. |
| **Trigger** | Editing a gym workout that was created with the v3 format. |
| **Fix** | Use `workout.exercises?.[0]?.exercise || workout.exercise || 'Gym'`. |

### C3 — `workout.weight` may be NaN in `gymDisplayInfo` (🟡 HIGH)

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 2125 |
| **Code** | `return { main: \`${w.weight} kg\`, sub: \`${w.sets}×${w.reps}\` };` |
| **What** | For v1 format workouts, `w.weight`, `w.sets`, and `w.reps` could be undefined or non-numeric. |
| **Consequence** | Displays "undefined kg" or "NaN×NaN" in the UI. |
| **Trigger** | Viewing a malformed or very old workout in History. |
| **Fix** | Add fallback values: `w.weight || 0`, `w.sets || 0`, `w.reps || 0`. |

### C4 — `parseFloat()` and `parseInt()` on undefined values (🟡 HIGH)

| Field | Value |
|-------|-------|
| **Locations** | Multiple places in `handleAddData`, `handleEdit`, `EditModal.handleSave` |
| **Code** | `parseFloat(dist)`, `parseInt(dur)`, `parseFloat(sleep)`, etc. |
| **What** | If the input field is empty, `parseFloat('')` returns `NaN`. |
| **Consequence** | `NaN` values written to Firestore. `NaN` propagates through calculations. |
| **Trigger** | Saving a workout with empty optional fields. |
| **Fix** | Use `parseFloat(dist) || null` or validate before parsing. |

### C5 — `workouts.filter()` crash if `workouts` is not an array (🟡 HIGH)

| Field | Value |
|-------|-------|
| **Locations** | Multiple components: `Dashboard`, `History`, `ProgressionTracker`, `PerformanceTicker`, `QuickInput` |
| **Code** | `workouts.filter(w => w.type === 'Lari')` |
| **What** | If `workouts` state is somehow `null` or `undefined` (e.g., during initial load or after logout), `.filter()` throws `TypeError`. |
| **Consequence** | White screen crash. |
| **Trigger** | Race condition during logout or initial auth state resolution. |
| **Fix** | Use `(workouts || []).filter(...)` or default the state to `[]`. |

### C6 — `new Date(dateStr + 'T00:00:00')` invalid date (🟡 HIGH)

| Field | Value |
|-------|-------|
| **Locations** | `PerformanceTicker` (line 2527), `formatDateID` (missing), and sorting logic |
| **Code** | `new Date(dateStr + 'T00:00:00')` |
| **What** | If `dateStr` is `undefined`, `null`, or malformed, this creates an Invalid Date. |
| **Consequence** | Sorting produces incorrect order. Date display shows "Invalid Date". |
| **Trigger** | Workout with missing or corrupted `date` field. |
| **Fix** | Validate date string before parsing. |

### C7 — `Math.min(...array)` on empty array (🟡 MEDIUM)

| Field | Value |
|-------|-------|
| **Locations** | `gymDisplayInfo` (line 2122), `PerformanceTicker` (lines 2570–2573) |
| **Code** | `const minW = Math.min(...weights)` where `weights` could be `[]` |
| **What** | `Math.min()` on an empty array returns `Infinity`. |
| **Consequence** | Displays "Infinity kg" in the UI. |
| **Trigger** | Gym workout with empty `sets` array. |
| **Fix** | Check array length before calling `Math.min`/`Math.max`. |

### C8 — `points[points.length - 1]` on empty array (🟡 MEDIUM)

| Field | Value |
|-------|-------|
| **Location** | `PerformanceTicker` line 2596 |
| **Code** | `const latest = points[points.length - 1];` |
| **What** | If `sourceRuns` is empty after filtering, `points` will be empty and `latest` will be `undefined`. |
| **Consequence** | `latest.distance` throws `TypeError: Cannot read properties of undefined`. |
| **Trigger** | User has runs but none with valid `distance` and `pace` data. |
| **Fix** | Add guard: `if (points.length === 0) return null;` |

### C9 — `getHRZone(parseInt(hr))` with non-numeric HR (🟢 LOW)

| Field | Value |
|-------|-------|
| **Location** | `EditModal` line 2355 |
| **Code** | `getHRZone(parseInt(hr))` where `hr` could be `''` |
| **What** | `parseInt('')` returns `NaN`. `getHRZone(NaN)` returns `null` (safe due to `if (!hr) return null` check). |
| **Consequence** | Safe — the `!hr` check catches `NaN`. But relies on implicit behavior. |
| **Fix** | Add explicit `isNaN` check for clarity. |

---

## 5. Missing Null Checks

### N1 — `workouts` array not guarded in child components

| Field | Value |
|-------|-------|
| **Locations** | `Dashboard`, `History`, `ProgressionTracker`, `PerformanceTicker`, `QuickInput`, `ExerciseField` |
| **Code** | All components receive `workouts` as a prop and call `.filter()`, `.map()`, `.reduce()` on it. |
| **Missing check** | None of the components check if `workouts` is actually an array before using array methods. |
| **Impact** | 🟡 High. If `workouts` is ever `null`/`undefined`, the app crashes. |
| **Fix** | Add default prop: `const Dashboard = ({ workouts = [] }) => ...` |

### N2 — `user` object not null-checked in Firestore operations

| Field | Value |
|-------|-------|
| **Location** | `handleAddData` (line 512), `handleDelete` (line 529), `handleEdit` (line 539) |
| **Code** | `collection(db, 'users', user.uid, 'workouts')` |
| **Missing check** | No check that `user` and `user.uid` exist before accessing Firestore. |
| **Impact** | 🟡 High. If `user` is somehow `null` when these functions are called, Firestore throws an error. |
| **Fix** | Add `if (!user?.uid) return;` at the top of each handler. |

### N3 — `workout.exercises` not optional-chained in `gymVolume()`

| Field | Value |
|-------|-------|
| **Location** | `gymVolume()` line 2104 |
| **Code** | `if (w.exercises) { return w.exercises.reduce(...) }` |
| **Missing check** | The `w.exercises` check is present, but `w.exercises` could be an empty array, which is fine. However, `w.exercises` could also be `null` (not just undefined). |
| **Impact** | 🟢 Low. The falsy check catches both `null` and `undefined`. |
| **Fix** | Already handled by the truthy check. |

### N4 — `w.exercises[0]` not optional-chained in `gymDisplayInfo()`

| Field | Value |
|-------|-------|
| **Location** | `gymDisplayInfo()` line 2115 |
| **Code** | `if (w.exercises && w.exercises.length > 0)` |
| **Missing check** | The check is present and correct. |
| **Impact** | 🟢 Low. Already handled. |

### N5 — `snapshot.docs` not checked in Firestore listener

| Field | Value |
|-------|-------|
| **Location** | Firestore `onSnapshot` callback (line 488) |
| **Code** | `const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));` |
| **Missing check** | No check that `snapshot` and `snapshot.docs` exist. |
| **Impact** | 🟢 Low. Firestore `onSnapshot` always returns a valid `QuerySnapshot` with a `docs` array. |
| **Fix** | Not needed — Firestore guarantees this. |

### N6 — `e.target.value` not checked in slider onChange

| Field | Value |
|-------|-------|
| **Location** | `SliderField` (line 2508) |
| **Code** | `value={value} onChange={onChange}` |
| **Missing check** | The parent component passes `onChange` directly. If `value` is `undefined`, `parseInt(value)` returns `NaN`. |
| **Impact** | 🟢 Low. The slider always provides a valid value. |
| **Fix** | Add fallback: `const numVal = parseInt(value) || 0;` |

---

## 6. Code Smells

### S1 — ESLint warning suppressed with `// eslint-disable-line`

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 1148 |
| **Code** | `React.useEffect(() => { applyPlanForDate(date); }, []); // eslint-disable-line` |
| **Why it's a smell** | The dependency array is empty but the effect uses `applyPlanForDate` and `date`. This is a stale closure bug waiting to happen. |
| **Impact** | 🟡 High. Plan auto-fill may not update when the plan changes. |

### S2 — `useMemo` with missing dependencies

| Field | Value |
|-------|-------|
| **Locations** | Multiple `useMemo` hooks in `Dashboard`, `ProgressionTracker`, `ExerciseField` |
| **Code** | Various `useMemo` calls that may have incomplete dependency arrays. |
| **Impact** | 🟡 Medium. Stale computed values. |
| **Action** | Audit all `useMemo` dependency arrays. |

### S3 — Magic numbers and strings scattered throughout

| Field | Value |
|-------|-------|
| **Examples** | `hr <= 114` (Z1 threshold), `hr <= 134` (Z2), `hr <= 154` (Z3), `hr <= 174` (Z4), `distanceDelta >= 0` (color logic), `ex.sets.length < 4` (max sets), `editExercises.length < 5` (max exercises) |
| **Why it's a smell** | Hardcoded values with no explanation. If HR zones need to change, they must be found and updated manually. |
| **Impact** | 🟡 Medium. Maintenance burden. |
| **Action** | Extract to constants. |

### S4 — Deeply nested ternary operators

| Field | Value |
|-------|-------|
| **Location** | Multiple places in JSX |
| **Example** | `{condition ? (anotherCondition ? valueA : valueB) : valueC}` |
| **Why it's a smell** | Hard to read and debug. |
| **Impact** | 🟡 Medium. Reduces code readability. |
| **Action** | Extract into helper functions or early-return patterns. |

### S5 — `useState` for derived data

| Field | Value |
|-------|-------|
| **Location** | `QuickInput` — `totalVolume` state |
| **Code** | `const [totalVolume, setTotalVolume] = useState(0);` — this is derived from exercises/sets data. |
| **Why it's a smell** | Derived state should use `useMemo`, not `useState` + manual `setTotalVolume` calls. Risk of getting out of sync. |
| **Impact** | 🟡 Medium. Potential stale display values. |
| **Action** | Replace with `useMemo`. |

### S6 — `useEffect` for derived data

| Field | Value |
|-------|-------|
| **Location** | `QuickInput` — `useEffect` that calls `setTotalVolume(...)` |
| **Code** | Effect runs whenever exercises change and manually updates state. |
| **Why it's a smell** | This is exactly what `useMemo` is for. The effect runs after render, causing an extra re-render. |
| **Impact** | 🟡 Medium. Extra re-render, potential flicker. |
| **Action** | Replace with `useMemo`. |

### S7 — Inline arrow functions in JSX props

| Field | Value |
|-------|-------|
| **Locations** | Throughout the file |
| **Example** | `onChange={e => setValue(e.target.value)}` |
| **Why it's a smell** | Creates a new function on every render. Causes unnecessary re-renders of child components. |
| **Impact** | 🟢 Low. Acceptable for small apps, but problematic at scale. |
| **Action** | Use `useCallback` for frequently re-rendering components. |

### S8 — `var` keyword used (or implied)

| Field | Value |
|-------|-------|
| **Location** | Not found — the codebase uses `const`/`let` consistently. |
| **Impact** | 🟢 None. Good practice followed. |

### S9 — No error boundaries

| Field | Value |
|-------|-------|
| **Location** | Entire app |
| **What** | No `ErrorBoundary` component wrapping any part of the UI. |
| **Why it's a smell** | Any uncaught JavaScript error crashes the entire app (white screen). |
| **Impact** | 🔴 Critical. See C1 — the `formatDateID()` bug proves this is a real risk. |
| **Action** | Add error boundaries around each tab. |

### S10 — `console.error()` as the only error handling

| Field | Value |
|-------|-------|
| **Location** | `handleAddData`, `handleDelete`, `handleEdit` |
| **Code** | `console.error("Error saving data:", error);` |
| **Why it's a smell** | Users never see errors. Silent failures erode trust. |
| **Impact** | 🟡 Medium. Poor UX. |
| **Action** | Show user-facing error toasts. |

---

## 7. Health Score Summary

### By Category

| Category | Count | Severity |
|----------|-------|----------|
| **Dead Code** | 5 items | 🟢 Low (mostly cleanup) |
| **Unused Functions/Variables** | 6 items | 🟡 Medium (1 is dead state) |
| **Duplicate Logic** | 7 items | 🟡 Medium (consolidation needed) |
| **Potential Runtime Crashes** | 9 items | 🔴 Critical (1 will crash the app) |
| **Missing Null Checks** | 6 items | 🟡 High (could crash on edge cases) |
| **Code Smells** | 10 items | 🟡 Medium (maintainability issues) |

### Top 5 Most Dangerous Issues

| Rank | Issue | Type | Risk |
|------|-------|------|------|
| 1 | `formatDateID()` is undefined (C1) | Runtime Crash | 🔴 App crashes on Dashboard |
| 2 | `workout.exercise` undefined in v3 gym (C2) | Runtime Crash | 🔴 Shows "Edit undefined" |
| 3 | No error boundaries anywhere (S9) | Runtime Crash | 🔴 Any error = white screen |
| 4 | `workouts` not guarded as array (N1) | Null Check | 🟡 Crash on logout race condition |
| 5 | `user.uid` not null-checked (N2) | Null Check | 🟡 Crash on Firestore operations |

### Code Health Score

```
┌─────────────────────────────────────────────────────────────┐
│                     CODE HEALTH SCORE                        │
│                                                              │
│  Dead Code         ████████░░░░░░░░░░░░  40% (5 issues)     │
│  Unused Code       ██████████░░░░░░░░░░  50% (6 issues)     │
│  Duplicate Logic   ████████████░░░░░░░░  60% (7 issues)     │
│  Crash Risks       ████████████████░░░░  80% (9 issues)     │
│  Null Checks       ████████████░░░░░░░░  60% (6 issues)     │
│  Code Smells       ████████████████░░░░  80% (10 issues)    │
│                                                              │
│  OVERALL           █████████████░░░░░░░  62%                 │
│                                                              │
│  Interpretation:   Needs significant refactoring             │
│  Priority:         Fix crash risks first                     │
└─────────────────────────────────────────────────────────────┘
```

### Quick Fixes (Under 30 Minutes)

| # | Fix | Time | Impact |
|---|-----|------|--------|
| 1 | Define `formatDateID()` function | 5 min | 🔴 Prevents app crash |
| 2 | Fix `workout.exercise` fallback in EditModal | 5 min | 🟡 Fixes "Edit undefined" |
| 3 | Add `(workouts || [])` defaults in all components | 15 min | 🟡 Prevents null crash |
| 4 | Add `if (!user?.uid) return;` in CRUD handlers | 5 min | 🟡 Prevents Firestore errors |
| 5 | Delete unused `App.css` | 2 min | 🟢 Cleanup |
| 6 | Add `dist-check/` to `.gitignore` | 2 min | 🟢 Cleanup |
| 7 | Remove unused `editSets` state | 2 min | 🟢 Cleanup |
| 8 | Update `<title>` in `index.html` | 1 min | 🟢 Branding |

**Total quick fixes: ~37 minutes**

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*
