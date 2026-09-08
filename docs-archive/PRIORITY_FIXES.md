# HybridTrack — Priority Fixes

> Ranked by severity, risk, and effort.  
> Use this to decide what to fix first.

---

## Priority Matrix

```
                    HIGH IMPACT
                        │
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │   QUICK WINS      │   CRITICAL        │
    │   (Do these 1st)  │   (Do these 2nd)  │
    │                   │                   │
    │ • #4 Firebase env │ • #1 formatDateID │
    │ • #7 useEffect    │ • #3 Plan persist │
    │ • #14 pb-safe cls │ • #2 Monolith     │
    │ • #11 App.css     │ • #8 Data schema  │
    │ • #12 dist-check  │                   │
    │                   │                   │
    ├───────────────────┼───────────────────┤
    │                   │                   │
    │   LOW EFFORT      │   STRATEGIC       │
    │   (Do when bored) │   (Plan carefully)│
    │                   │                   │
    │ • #15 Google logo │ • #5 TypeScript   │
    │ • #16 Sanitization│ • #6 Tailwind dyn │
    │                   │ • #9 Loading state│
    │                   │ • #10 Nested JSX  │
    │                   │ • #13 Unit tests  │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```

---

## Issue Ranking

| Rank | ID | Issue | Severity | Risk if Ignored | Effort | Category |
|------|----|-------|----------|-----------------|--------|----------|
| 1 | #1 | **Missing `formatDateID()` function** | 🔴 Critical | App crashes on ProgressionTracker render | 5 min | Bug |
| 2 | #3 | **Weekly plan not persisted to Firestore** | 🔴 Critical | Users lose training plan on every refresh | 2–3 hrs | Data Loss |
| 3 | #2 | **Single 2694-line monolith file** | 🔴 Critical | Impossible to maintain; any change risks breaking unrelated features | 4–6 hrs | Architecture |
| 4 | #8 | **Inconsistent data schema (v1/v2/v3)** | 🟡 High | Data corruption; gymVolume() complexity; future migration nightmare | 3–4 hrs | Tech Debt |
| 5 | #9 | **No loading states for CRUD operations** | 🟡 High | Users get no feedback during save/delete; may click multiple times | 2–3 hrs | UX |
| 6 | #4 | **Hardcoded Firebase credentials** | 🟡 High | Security risk if repo goes public; can't have different env configs | 30 min | Security |
| 7 | #7 | **`useEffect` missing dependency** | 🟡 High | Stale closure bug; `applyPlanForDate` may use outdated `weeklyPlan` | 15 min | Bug |
| 8 | #6 | **Dynamic Tailwind class names** | 🟡 High | Classes may not exist in production build; visual breakage | 1–2 hrs | Build |
| 9 | #10 | **Deeply nested JSX (5+ levels)** | 🟡 Medium | Hard to read, debug, and modify; increases cognitive load | 2–3 hrs | Maintainability |
| 10 | #5 | **No TypeScript** | 🟡 Medium | No type safety; runtime errors from wrong data shapes; poor DX | 8–16 hrs | Architecture |
| 11 | #13 | **No unit tests** | 🟡 Medium | No safety net for refactoring; regressions go undetected | 8–12 hrs | Testing |
| 12 | #14 | **Custom `pb-safe` class not defined** | 🟢 Low | Padding-bottom on mobile nav may not apply correctly | 5 min | CSS |
| 13 | #11 | **Unused `App.css` (legacy Vite styles)** | 🟢 Low | Dead code; confusing for new developers | 5 min | Cleanup |
| 14 | #12 | **`dist-check/` folder in version control** | 🟢 Low | Bloats repo; should be in `.gitignore` | 5 min | Cleanup |
| 15 | #15 | **External Google logo URL** | 🟢 Low | Login button breaks without internet; slow load | 10 min | Resilience |
| 16 | #16 | **No input sanitization** | 🟢 Low | Invalid data can be written to Firestore | 1–2 hrs | Robustness |

---

## Detailed Breakdown

### 🔴 CRITICAL — Fix Immediately

---

#### #1 — Missing `formatDateID()` function

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 1994 (in `ProgressionTracker` component) |
| **What's wrong** | The function `formatDateID()` is called but never defined anywhere in the file. |
| **Consequence** | When `ProgressionTracker` renders (embedded in Dashboard), JavaScript throws `ReferenceError: formatDateID is not defined`. The entire app crashes. |
| **Risk if ignored** | 🔴 **App is broken.** Any user who navigates to Dashboard will see a blank white screen. |
| **Root cause** | The function was likely removed during refactoring or was intended to be imported from a utils file that was never created. |
| **Effort to fix** | **~5 minutes.** Define the function: `const formatDateID = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });` |
| **Dependencies** | None |
| **Fix strategy** | Add the function definition near other formatting helpers (around line 2080–2087 where `formatPace` and `getHRZone` are defined). |

---

#### #2 — Single 2694-line monolith file

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` |
| **What's wrong** | All 20+ components, 16 helper functions, Firebase config, and app logic are in one file. |
| **Consequence** | Impossible to: navigate the codebase, isolate bugs, write unit tests, onboard new developers, or make changes without risk of breaking unrelated features. |
| **Risk if ignored** | 🔴 **Maintenance nightmare escalates.** Every new feature makes it worse. Refactoring later becomes exponentially harder. |
| **Effort to fix** | **4–6 hours.** Extract into separate files by concern. |
| **Dependencies** | Should be done AFTER fixing #1 (crash bug) and #3 (data loss). |
| **Fix strategy** | Split into: `src/pages/`, `src/components/`, `src/components/ui/`, `src/utils/`, `src/firebase.js`. See recommended file structure below. |

**Recommended file structure after split:**

```
src/
├── main.jsx
├── index.css
├── firebase.js                  # Firebase init + auth + db exports
├── utils/
│   ├── helpers.js               # formatPace, formatDateID, gymVolume, etc.
│   ├── analytics.js             # getDashboardSummary, getExerciseProgress, etc.
│   └── constants.js             # DAY_KEYS, SESSION_COLORS, DEFAULT_WEEKLY_PLAN
├── components/
│   ├── NavButton.jsx
│   ├── MiniTrend.jsx
│   ├── BarChart.jsx
│   ├── ExerciseField.jsx
│   ├── EditModal.jsx
│   ├── ExportModal.jsx
│   └── ui/
│       ├── InputField.jsx
│       ├── SelectField.jsx
│       └── SliderField.jsx
└── pages/
    ├── Dashboard.jsx            # Dashboard + DashboardHero + cards
    ├── QuickInput.jsx
    ├── History.jsx
    ├── WeeklyPlanTab.jsx
    ├── ProgressionTracker.jsx
    └── PerformanceTicker.jsx
```

---

#### #3 — Weekly plan not persisted to Firestore

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` — `weeklyPlan` state (line 472) |
| **What's wrong** | The weekly training plan lives only in React state. Any page refresh, tab close, or browser restart loses all edits. |
| **Consequence** | Users must manually export JSON after every edit and re-import on every visit. This is fragile and user-hostile. |
| **Risk if ignored** | 🔴 **Data loss.** Users will eventually lose their training plan and become frustrated. |
| **Effort to fix** | **2–3 hours.** Add Firestore read/write for the plan document. |
| **Dependencies** | None technically, but easier after #2 (monolith split) since Firebase logic would be centralized. |
| **Fix strategy** | 1. Create a new Firestore document at `users/{uid}/plan/current` 2. Add `onSnapshot` listener for real-time plan sync 3. Auto-save on edits (debounced) 4. Remove manual import/export or keep as secondary feature |

---

### 🟡 HIGH — Fix Soon

---

#### #4 — Hardcoded Firebase credentials

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` lines 15–22 |
| **What's wrong** | Firebase API key, auth domain, project ID, etc. are hardcoded in source code. |
| **Consequence** | Cannot have different configs for dev/staging/prod. If repo is made public, keys are exposed (though Firebase API keys are somewhat public by design). |
| **Risk if ignored** | 🟡 **Security theater.** Not a critical vulnerability, but poor practice that prevents proper environment management. |
| **Effort to fix** | **~30 minutes.** Move to `.env` file. |
| **Dependencies** | None |
| **Fix strategy** | 1. Create `.env` with `VITE_FIREBASE_API_KEY=...` etc. 2. Update `firebaseConfig` to use `import.meta.env.VITE_FIREBASE_*` 3. Add `.env` to `.gitignore` 4. Document required env vars in README |

---

#### #5 — No loading states for CRUD operations

| Field | Value |
|-------|-------|
| **Location** | `handleAddData` (line 512), `handleDelete` (line 529), `handleEdit` (line 539) |
| **What's wrong** | Firestore write operations have no loading indicators. Users see no feedback during save/delete. |
| **Consequence** | Users may click "Save" multiple times, creating duplicate workouts. On slow connections, the app appears unresponsive. Errors are only logged to console. |
| **Risk if ignored** | 🟡 **Poor UX.** Users lose confidence in the app. Duplicate data clutters Firestore. |
| **Effort to fix** | **2–3 hours.** Add loading state + disable buttons during operations. |
| **Dependencies** | None |
| **Fix strategy** | 1. Add `isSaving` / `isDeleting` state flags 2. Disable submit buttons while true 3. Show spinner overlay or inline loading indicator 4. Add error toast on failure (instead of just `console.error`) |

---

#### #6 — `useEffect` missing dependency

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 1148 |
| **What's wrong** | `React.useEffect(() => { applyPlanForDate(date); }, []);` — `applyPlanForDate` is not in the dependency array. ESLint warning is suppressed with `// eslint-disable-line`. |
| **Consequence** | If `weeklyPlan` changes (e.g., user imports a new plan), the effect won't re-run. The input form won't auto-fill from the updated plan. |
| **Risk if ignored** | 🟡 **Stale closure bug.** Plan auto-fill feature becomes unreliable after plan changes. |
| **Effort to fix** | **~15 minutes.** Add proper dependencies or restructure. |
| **Dependencies** | None |
| **Fix strategy** | Either: (a) Add `applyPlanForDate` to dependency array and memoize it, or (b) Move the logic inline into the effect and depend on `weeklyPlan` directly. |

---

#### #7 — Dynamic Tailwind class names

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` lines 1341–1346 (and similar patterns) |
| **What's wrong** | Classes like `bg-${c}-500/20` are constructed dynamically. Tailwind's JIT compiler cannot tree-shake these — they may not exist in the production CSS bundle. |
| **Consequence** | Exercise cards in the Gym input form may have missing background colors, borders, and text colors in production builds. |
| **Risk if ignored** | 🟡 **Visual breakage in production.** The app looks different from development. |
| **Effort to fix** | **1–2 hours.** Replace dynamic classes with static mappings. |
| **Dependencies** | None |
| **Fix strategy** | 1. Create a color mapping object: `const EXERCISE_COLORS = { 0: 'fuchsia', 1: 'pink', ... }` 2. Map to full class strings instead of template literals: `bg-fuchsia-500/20` 3. Or use inline `style` props with hex colors |

---

#### #8 — Inconsistent data schema (v1/v2/v3)

| Field | Value |
|-------|-------|
| **Location** | Throughout `App.jsx` — `gymVolume()`, `gymDisplayInfo()`, `EditModal`, `History` |
| **What's wrong** | Gym workouts can be stored in 3 different formats: v1 (flat `weight`/`sets`/`reps`), v2 (`sets[]` array), v3 (`exercises[]` array). All helpers must handle all three. |
| **Consequence** | Complex, error-prone code. New features must account for all formats. Data migration is risky. |
| **Risk if ignored** | 🟡 **Tech debt compounds.** Every new feature becomes harder to implement correctly. |
| **Effort to fix** | **3–4 hours.** Write a migration script to normalize all existing data to v3 format. |
| **Dependencies** | Should be done after #2 (monolith split) to keep migration logic isolated. |
| **Fix strategy** | 1. Write a Firestore migration function that reads all workouts and converts v1/v2 to v3 2. Run once on app startup or as a manual trigger 3. Remove v1/v2 handling from all helpers 4. Add validation to ensure only v3 is written going forward |

---

### 🟡 MEDIUM — Plan for Next Sprint

---

#### #9 — Deeply nested JSX

| Field | Value |
|-------|-------|
| **Location** | Throughout `App.jsx` — `QuickInput`, `History`, `EditModal`, `PerformanceTicker` |
| **What's wrong** | Many components have 5+ levels of JSX nesting (e.g., `div > div > div > div > div`). |
| **Consequence** | Hard to read, debug, and modify. Increases cognitive load. |
| **Risk if ignored** | 🟡 **Slows development.** Each change requires tracing through deeply nested structures. |
| **Effort to fix** | **2–3 hours.** Extract sub-sections into named sub-components. |
| **Dependencies** | Best done after #2 (monolith split) since you'll be restructuring anyway. |
| **Fix strategy** | Extract repeated JSX patterns into small components (e.g., `ExerciseCard`, `SetRow`, `RunMetricTile`). |

---

#### #10 — No TypeScript

| Field | Value |
|-------|-------|
| **Location** | Entire project |
| **What's wrong** | No type definitions for workout data, plan data, or component props. |
| **Consequence** | Runtime errors from wrong data shapes. Poor IDE autocomplete. Difficult to refactor safely. |
| **Risk if ignored** | 🟡 **Slows development and increases bugs.** Every data access is a potential runtime crash. |
| **Effort to fix** | **8–16 hours.** Add TypeScript and define interfaces for all data shapes. |
| **Dependencies** | Should be done AFTER #2 (monolith split) — converting one file at a time is more manageable. |
| **Fix strategy** | 1. Rename `.jsx` → `.tsx` 2. Define interfaces: `Workout`, `RunWorkout`, `GymWorkout`, `RecoveryWorkout`, `Exercise`, `Set`, `WeeklyPlan`, `DayPlan` 3. Add types incrementally, starting with utility functions |

---

#### #11 — No unit tests

| Field | Value |
|-------|-------|
| **Location** | Entire project |
| **What's wrong** | Zero test files, no test configuration, no testing library installed. |
| **Consequence** | No safety net for refactoring. Regressions go undetected. Cannot verify bug fixes. |
| **Risk if ignored** | 🟡 **Refactoring is risky.** Every change must be manually tested. |
| **Effort to fix** | **8–12 hours.** Set up Vitest + React Testing Library, write tests for critical paths. |
| **Dependencies** | Should be done AFTER #2 (monolith split) — testing isolated modules is much easier. |
| **Fix strategy** | 1. Install `vitest`, `@testing-library/react`, `jsdom` 2. Configure in `vite.config.js` 3. Write tests for: utility functions first, then components 4. Aim for critical path coverage (gymVolume, formatPace, getDashboardSummary, etc.) |

---

### 🟢 LOW — Nice-to-Have

---

#### #12 — Custom `pb-safe` class not defined

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 635 |
| **What's wrong** | `pb-safe` is used but not defined in Tailwind config or CSS. |
| **Consequence** | Padding-bottom on mobile navigation may not apply correctly on some devices. |
| **Risk if ignored** | 🟢 **Minor visual glitch.** Content may be hidden behind mobile nav bar on some phones. |
| **Effort to fix** | **~5 minutes.** Add to Tailwind config or use a standard class. |
| **Fix strategy** | Either: (a) Add `paddingBottom: 'env(safe-area-inset-bottom)'` to Tailwind config, or (b) Replace with `pb-2` or similar. |

---

#### #13 — Unused `App.css`

| Field | Value |
|-------|-------|
| **Location** | `src/App.css` |
| **What's wrong** | Contains legacy Vite template styles (`.counter`, `.hero`, `.ticks`, etc.) that are not used by the app. |
| **Consequence** | Dead code confuses new developers. Adds unnecessary file to the project. |
| **Risk if ignored** | 🟢 **Minimal.** Just clutter. |
| **Effort to fix** | **~5 minutes.** Delete the file and remove the import from `App.jsx`. |
| **Fix strategy** | 1. Delete `src/App.css` 2. Remove `import './App.css'` from `src/App.jsx` (it's not imported currently — the import may already be absent) |

---

#### #14 — `dist-check/` folder in version control

| Field | Value |
|-------|-------|
| **Location** | `dist-check/` directory |
| **What's wrong** | Pre-built production output is checked into the repository. |
| **Consequence** | Bloats repository size. Confuses the purpose of the `dist/` folder. |
| **Risk if ignored** | 🟢 **Minor.** Increases clone time slightly. |
| **Effort to fix** | **~5 minutes.** Add to `.gitignore` and remove from tracking. |
| **Fix strategy** | 1. Add `dist-check/` to `.gitignore` 2. Run `git rm -r --cached dist-check/` 3. Keep the folder locally if needed for reference |

---

#### #15 — External Google logo URL

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` line 583 |
| **What's wrong** | Google login button loads the logo from `https://www.svgrepo.com/show/475656/google-color.svg` |
| **Consequence** | Login button has no icon if offline or if svgrepo.com is down. Slower initial load. |
| **Risk if ignored** | 🟢 **Minor UX issue.** Button still works, just looks slightly different. |
| **Effort to fix** | **~10 minutes.** Download the SVG locally or use inline SVG. |
| **Fix strategy** | 1. Download the Google logo SVG 2. Save to `public/google-logo.svg` 3. Reference as `/google-logo.svg` |

---

#### #16 — No input sanitization

| Field | Value |
|-------|-------|
| **Location** | `handleAddData` (line 512) |
| **What's wrong** | User input is written directly to Firestore without validation or sanitization. |
| **Consequence** | Invalid data types, missing required fields, or malicious data can be stored. |
| **Risk if ignored** | 🟢 **Low for now** (single-user app with auth). Would be critical if multi-user. |
| **Effort to fix** | **1–2 hours.** Add validation before Firestore writes. |
| **Fix strategy** | 1. Create a `validateWorkout(data)` function 2. Check required fields, types, and ranges 3. Return errors instead of writing invalid data 4. Show validation errors in the UI |

---

## Recommended Execution Order

```
Phase 1: STOP THE BLEEDING (Day 1)
─────────────────────────────────────
 1. #1  formatDateID() bug          ─ 5 min    🔴 App crashes without this
 2. #3  Persist weekly plan         ─ 2–3 hrs  🔴 Data loss on refresh
 3. #7  useEffect dependency        ─ 15 min   🟡 Stale closure bug

Phase 2: SECURE & CLEAN (Day 2)
─────────────────────────────────────
 4. #4  Firebase env vars           ─ 30 min   🟡 Security
 5. #14 Fix pb-safe class           ─ 5 min    🟢 Minor CSS fix
 6. #11 Delete unused App.css       ─ 5 min    🟢 Cleanup
 7. #12 gitignore dist-check        ─ 5 min    🟢 Cleanup
 8. #15 Local Google logo           ─ 10 min   🟢 Resilience

Phase 3: REFACTOR (Week 1–2)
─────────────────────────────────────
 9. #2  Split monolith into files   ─ 4–6 hrs  🔴 Architecture
10. #8  Normalize data schema       ─ 3–4 hrs  🟡 Tech debt
11. #6  Fix dynamic Tailwind classes─ 1–2 hrs  🟡 Visual bugs
12. #9  Add loading states          ─ 2–3 hrs  🟡 UX

Phase 4: STRENGTHEN (Week 3–4)
─────────────────────────────────────
13. #10 Extract nested JSX          ─ 2–3 hrs  🟡 Maintainability
14. #5  Add TypeScript              ─ 8–16 hrs 🟡 Type safety
15. #13 Add unit tests              ─ 8–12 hrs 🟡 Testing
16. #16 Add input sanitization      ─ 1–2 hrs  🟢 Robustness
```

**Total estimated effort: ~35–55 hours** (approximately 1–2 weeks full-time)

---

## Effort Summary

| Severity | Count | Total Effort |
|----------|-------|-------------|
| 🔴 Critical | 3 | ~7 hours |
| 🟡 High | 5 | ~8–12 hours |
| 🟡 Medium | 3 | ~18–31 hours |
| 🟢 Low | 5 | ~1.5–2.5 hours |
| **Total** | **16** | **~35–55 hours** |

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*
