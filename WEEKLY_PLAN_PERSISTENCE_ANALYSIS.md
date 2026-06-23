# Weekly Plan Persistence Analysis

> Analysis of how `weeklyPlan` is currently stored, why it's lost after refresh, and a recommended Firestore structure for persistence.

---

## 1. How `weeklyPlan` Is Currently Stored

### In-Memory React State Only

The weekly plan is stored exclusively in React component state with **no persistence layer**:

```js
// App.jsx — line 472
const [weeklyPlan, setWeeklyPlan] = useState(DEFAULT_WEEKLY_PLAN);
```

### The `DEFAULT_WEEKLY_PLAN` Constant

Defined at the top of `App.jsx` (lines 32-97), this is a hardcoded JavaScript object:

```js
const DEFAULT_WEEKLY_PLAN = {
  weekStart: '2026-05-18',
  days: {
    monday:    { type: 'Gym', sessionName: 'Push A', exercises: [...] },
    tuesday:   { type: 'Run', sessionName: 'Easy Run', runTarget: { distance: 5, pace: '5:30', rpe: 4, effort: 'easy' } },
    wednesday: { type: 'Gym', sessionName: 'Pull A', exercises: [...] },
    thursday:  { type: 'Run', sessionName: 'Tempo', runTarget: { distance: 6, pace: '4:45', rpe: 7, effort: 'moderate' } },
    friday:    { type: 'Gym', sessionName: 'Legs A', exercises: [...] },
    saturday:  { type: 'Run', sessionName: 'Long Run', runTarget: { distance: 12, pace: '5:45', rpe: 5, effort: 'conversational' } },
    sunday:    { type: 'Rest' }
  }
};
```

Key observations:
- **`weekStart` is hardcoded** to `'2026-05-18'` — a date that has already passed.
- **All 7 days are pre-populated** with Push/Pull/Legs + Run sessions.
- **No user-specific customization** — every user sees the same default plan.

### How Edits Work

The `WeeklyPlanTab` component (line 115) receives `weeklyPlan` and `setWeeklyPlan` as props. When a user edits a day:

```js
// App.jsx — lines 157-160 (approximate)
setWeeklyPlan(prev => ({
  ...prev,
  days: { ...prev.days, [dayKey]: updatedDay }
}));
```

This updates React state only. There is **no Firestore write** triggered by this change.

### The Only "Persistence" Mechanism

Lines 123-145 contain manual JSON export/import:

```js
// Export: downloads a .json file of the current plan
const blob = new Blob([JSON.stringify(weeklyPlan, null, 2)], { type: 'application/json' });
// Import: user pastes JSON, parsed and set via setWeeklyPlan
```

This is a manual workaround, not real persistence.

---

## 2. Why It Is Lost After Refresh

Three independent reasons combine to cause data loss:

### Reason 1: No Firestore Document for the Plan

The app already has a Firestore integration for workouts. Lines 484-494 show:

```js
useEffect(() => {
  if (!user) return;
  const q = query(collection(db, 'users', user.uid, 'workouts'), orderBy('date', 'desc'));
  const unsub = onSnapshot(q, (snapshot) => {
    // hydrates workouts state from Firestore
  });
  return unsub;
}, [user]);
```

There is **no equivalent `useEffect`** for the plan. No document is read from Firestore on mount, and no document is written on edit.

### Reason 2: React State Is Ephemeral

`useState(DEFAULT_WEEKLY_PLAN)` initializes from the hardcoded constant on every page load:

```
Page Load → useState(DEFAULT_WEEKLY_PLAN) → weeklyPlan = hardcoded default
                                                      ↓
User edits plan → setWeeklyPlan(edited) → weeklyPlan = edited (in memory only)
                                                      ↓
Page Refresh → useState(DEFAULT_WEEKLY_PLAN) → weeklyPlan = hardcoded default (edits lost)
```

Since there's no `useEffect` to hydrate from Firestore, the state always resets to the default.

### Reason 3: Static Date in Default Plan

Even if the plan weren't lost, `weekStart: '2026-05-18'` is hardcoded. After May 24, 2026, the plan shows stale data. The app does not dynamically compute the current week's Monday.

### Data Flow Diagram (Current)

```
┌─────────────────────────────────────────────────────────┐
│                    Page Load                             │
│                                                          │
│  useState(DEFAULT_WEEKLY_PLAN)                           │
│       │                                                  │
│       ▼                                                  │
│  weeklyPlan = { weekStart: '2026-05-18', days: {...} }   │
│       │                                                  │
│       ▼                                                  │
│  User edits plan → setWeeklyPlan(edited)                 │
│       │                                                  │
│       ▼                                                  │
│  React re-renders with new plan                          │
│       │                                                  │
│       ▼                                                  │
│  ❌ No Firestore write happens                           │
│       │                                                  │
│       ▼                                                  │
│  Page Refresh → useState(DEFAULT_WEEKLY_PLAN)            │
│       │                                                  │
│       ▼                                                  │
│  ❌ All edits lost                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Recommended Firestore Structure

### Document Model

Store the plan as a **single document** under the user's document:

```
users/{uid}
├── plan (document)          ← NEW: single document per user
│   ├── weekStart: "2026-06-22"
│   ├── weekEnd: "2026-06-28"
│   ├── label: "Week of 22 June 2026"
│   ├── planVersion: 1       ← for future schema migrations
│   ├── updatedAt: Timestamp  ← Firestore server timestamp
│   ├── days: {
│   │     monday: {
│   │       type: "Gym",
│   │       sessionName: "Push A",
│   │       notes: "",
│   │       exercises: [
│   │         { name: "Bench Press", sets: [{ set: 1, weight: 60, reps: 10 }, ...] },
│   │         ...
│   │       ],
│   │       runTarget: null
│   │     },
│   │     tuesday: {
│   │       type: "Run",
│   │       sessionName: "Easy Run",
│   │       notes: "",
│   │       exercises: null,
│   │       runTarget: { distance: 5, pace: "5:30", rpe: 4, effort: "easy" }
│   │     },
│   │     wednesday: { ... },
│   │     thursday: { ... },
│   │     friday: { ... },
│   │     saturday: { ... },
│   │     sunday: { type: "Rest", sessionName: null, notes: "", exercises: null, runTarget: null }
│   │   }
│   └── createdAt: Timestamp
│
└── workouts (subcollection) ← EXISTING
```

### Why a Single Document (Not a Subcollection)

| Consideration | Single Document | Subcollection |
|---------------|----------------|---------------|
| **Read cost** | 1 read per page load | 1+ reads (depends on query) |
| **Write cost** | 1 write per edit | 1 write per day edited |
| **Simplicity** | Single `onSnapshot` listener | Need to listen to collection |
| **Data size** | ~2-5 KB (well under 1 MB limit) | N/A |
| **Atomic updates** | Can update all days atomically | Cannot atomically update across docs |
| **Offline support** | Single doc cached easily | Multiple docs need collection cache |

**Verdict:** A single document is simpler, cheaper, and more reliable for a per-user weekly plan.

### Read/Write Operations

**Read on page load:**
```js
useEffect(() => {
  if (!user) return;
  const planDoc = doc(db, 'users', user.uid, 'plan', 'current');
  const unsub = onSnapshot(planDoc, (snapshot) => {
    if (snapshot.exists()) {
      setWeeklyPlan(snapshot.data());
    } else {
      // First-time user: generate dynamic default for current week
      setWeeklyPlan(generateDefaultPlan());
    }
  });
  return unsub;
}, [user]);
```

**Write on edit:**
```js
const savePlan = (updatedPlan) => {
  const planDoc = doc(db, 'users', user.uid, 'plan', 'current');
  setDoc(planDoc, {
    ...updatedPlan,
    updatedAt: serverTimestamp()
  }, { merge: true });
};
```

**Dynamic default generation (first-time user):**
```js
function generateDefaultPlan() {
  const now = new Date();
  const weekStart = getMonday(now); // compute current Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return {
    weekStart: formatISO(weekStart),
    weekEnd: formatISO(weekEnd),
    label: `Week of ${formatDate(weekStart)}`,
    planVersion: 1,
    days: {
      monday:    { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      tuesday:   { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      wednesday: { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      thursday:  { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      friday:    { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      saturday:  { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      sunday:    { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null }
    }
  };
}
```

### Data Flow Diagram (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                      Page Load                               │
│                                                              │
│  onSnapshot('users/{uid}/plan/current')                      │
│       │                                                      │
│       ├── Document exists? → setWeeklyPlan(snapshot.data())  │
│       │                                                      │
│       └── No document? → generateDefaultPlan()               │
│                              │                               │
│                              ▼                               │
│                   setWeeklyPlan(dynamicDefault)               │
│                              │                               │
│                              ▼                               │
│                   setDoc(planDoc, dynamicDefault)             │
│                              │                               │
│                              ▼                               │
│                   User edits plan → setWeeklyPlan(edited)     │
│                              │                               │
│                              ▼                               │
│                   setDoc(planDoc, edited, { merge: true })    │
│                              │                               │
│                              ▼                               │
│                   ✅ Plan persisted to Firestore              │
│                              │                               │
│                              ▼                               │
│                   Page Refresh → onSnapshot reads Firestore   │
│                              │                               │
│                              ▼                               │
│                   ✅ Edits restored from Firestore            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Risks and Edge Cases

### Risk Matrix

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|------------|------------|
| 1 | **Stale plan after week ends** | 🔴 High | High (every week) | Auto-detect: if `weekEnd < today`, prompt user to generate new plan or carry forward previous week's structure |
| 2 | **Concurrent edits (two browser tabs)** | 🟡 Medium | Low | Firestore `onSnapshot` handles real-time sync. Use `setDoc` (not `updateDoc`) to avoid race conditions on nested fields |
| 3 | **Offline edits not synced** | 🟡 Medium | Medium | Enable Firestore offline persistence (`enableIndexedDbPersistence`) — part of the PWA feature (F01) |
| 4 | **Large plan with many exercises** | 🟢 Low | Low | Even with 7 days × 10 exercises × 5 sets, JSON is ~50 KB — well under Firestore's 1 MB document limit |
| 5 | **User accidentally deletes plan** | 🟢 Low | Low | Add "Reset to default" button that regenerates a fresh plan for the current week |
| 6 | **Plan schema changes (future versions)** | 🟡 Medium | Medium | Store `planVersion` field. On read, check version and migrate if needed |
| 7 | **Missing `updatedAt` timestamp** | 🟢 Low | Low | Always include `updatedAt: serverTimestamp()` on every write for debugging |
| 8 | **Week boundary ambiguity (timezone)** | 🟢 Low | Low | Store dates as ISO strings (already done). Compute week boundaries client-side using user's local timezone |
| 9 | **First-time user has no plan** | 🟡 Medium | High (all new users) | Generate dynamic default based on current week, not hardcoded May 2026 dates |
| 10 | **User edits plan, then immediately refreshes** | 🟢 Low | Medium | `onSnapshot` is real-time. If write completes before refresh, data is safe. If not, add debounce (300ms) on save |

### Edge Cases

#### Edge Case 1: Week Transition

**Scenario:** User creates a plan for Week A. Week B starts. The plan still shows Week A's data.

**Solution:** On page load, check if `plan.weekEnd < today`. If so, show a banner: *"Your plan is from last week. Would you like to carry it forward or start fresh?"*

```js
const isPlanStale = weeklyPlan.weekEnd && new Date(weeklyPlan.weekEnd) < new Date();
```

#### Edge Case 2: User Has No Internet

**Scenario:** User edits the plan while offline. The edit is lost because there's no offline Firestore persistence.

**Solution:** This is part of the PWA/offline feature (F01 in PRODUCT_ROADMAP). Enable `enableIndexedDbPersistence` on the Firestore instance. With this enabled, `setDoc` writes to the local cache and syncs when connectivity returns.

#### Edge Case 3: Multiple Days Edited Simultaneously

**Scenario:** User edits Monday, then Tuesday, then Wednesday in quick succession. Each edit triggers a separate `setDoc` call.

**Solution:** Debounce the save operation. Collect all edits for 500ms, then write the entire plan object atomically:

```js
const savePlan = useCallback(
  debounce((plan) => {
    setDoc(planDoc, { ...plan, updatedAt: serverTimestamp() }, { merge: true });
  }, 500),
  [user]
);
```

#### Edge Case 4: Plan Schema Migration

**Scenario:** In the future, the plan schema changes (e.g., adding `warmup` and `cooldown` fields). Old saved plans don't have these fields.

**Solution:** Use `planVersion` field:

```js
function migratePlan(plan) {
  if (!plan.planVersion || plan.planVersion < 2) {
    plan = { ...plan, planVersion: 2, warmup: null, cooldown: null };
  }
  return plan;
}
```

#### Edge Case 5: Empty Plan (All Rest Days)

**Scenario:** A new user hasn't set up their plan yet. All days are `{ type: 'Rest' }`.

**Solution:** This is valid. The "Today's Plan" card on the Dashboard should handle this gracefully (it already returns `null` if `todayPlan.type === 'Rest'`). Consider showing a prompt: *"Set up your weekly plan to get started!"*

#### Edge Case 6: Plan Exceeds Firestore Size Limit

**Scenario:** A power user creates a plan with 7 days × 15 exercises × 10 sets each.

**Calculation:**
- 7 days × 15 exercises × 10 sets × ~50 bytes per set = ~52,500 bytes
- Plus overhead for field names: ~10 KB
- **Total: ~62 KB** — well under the 1 MB Firestore document limit

**Verdict:** Not a realistic risk for this use case.

---

## Summary

| Aspect | Current State | Recommended State |
|--------|--------------|-------------------|
| **Storage** | In-memory React state only | Firestore document: `users/{uid}/plan/current` |
| **Initialization** | Hardcoded `DEFAULT_WEEKLY_PLAN` (May 2026) | Dynamic default based on current week |
| **Read** | None (always uses default) | `onSnapshot` on plan document |
| **Write** | None (edits lost on refresh) | `setDoc` with debounce on every edit |
| **Offline** | Not supported | Requires `enableIndexedDbPersistence` (PWA feature) |
| **Schema versioning** | None | `planVersion` field for future migrations |
| **Week transition** | Not handled | Auto-detect stale plan, prompt user |

---

*Analysis based on `src/App.jsx` (2694 lines)*  
*Generated: June 23, 2026 | Project: HybridTrack*
