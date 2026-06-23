# Weekly Plan Persistence — Implementation Plan

> Concrete implementation plan for persisting `weeklyPlan` to Firestore, based on the analysis in `WEEKLY_PLAN_PERSISTENCE_ANALYSIS.md`.

---

## 1. Firestore Document Structure

### Path

```
users/{uid}/plan/current
```

### Document Schema

```typescript
interface WeeklyPlanDocument {
  // Metadata
  weekStart: string;        // ISO date: "2026-06-22"
  weekEnd: string;          // ISO date: "2026-06-28"
  label: string;            // "Week of 22 June 2026"
  planVersion: number;      // 1 — for future schema migrations
  updatedAt: Timestamp;     // Firestore serverTimestamp()
  createdAt: Timestamp;     // Firestore serverTimestamp()

  // Days
  days: {
    monday: DayPlan;
    tuesday: DayPlan;
    wednesday: DayPlan;
    thursday: DayPlan;
    friday: DayPlan;
    saturday: DayPlan;
    sunday: DayPlan;
  };
}

interface DayPlan {
  type: 'Gym' | 'Run' | 'Rest';
  sessionName: string | null;
  notes: string;
  exercises: GymExercise[] | null;
  runTarget: RunTarget | null;
}

interface GymExercise {
  name: string;
  sets: GymSet[];
}

interface GymSet {
  set: number;
  weight: number;
  reps: number;
}

interface RunTarget {
  distance: number;
  effort: string;
  rpe: string;
  pace: string;
}
```

### Firestore Security Rules

```javascript
// Required rule to allow plan read/write
match /users/{userId}/plan/{document} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 2. Read Flow

### On App Mount (after auth)

The read flow mirrors the existing workouts listener pattern (lines 484-494 of App.jsx):

```
┌──────────────────────────────────────────────────────────────────┐
│  useEffect([user])                                                │
│                                                                   │
│  1. If no user → return (don't listen)                           │
│                                                                   │
│  2. Create doc ref:                                               │
│     doc(db, 'users', user.uid, 'plan', 'current')                 │
│                                                                   │
│  3. Attach onSnapshot listener:                                   │
│     onSnapshot(planDocRef, (snapshot) => {                        │
│       if (snapshot.exists()) {                                    │
│         const data = snapshot.data();                             │
│         const migrated = migratePlan(data);  // handle versions   │
│         setWeeklyPlan(migrated);                                  │
│       } else {                                                    │
│         // First-time user — generate dynamic default             │
│         const defaultPlan = generateDefaultPlan();                │
│         setWeeklyPlan(defaultPlan);                               │
│         // Also write it to Firestore immediately                 │
│         setDoc(planDocRef, {                                      │
│           ...defaultPlan,                                         │
│           createdAt: serverTimestamp(),                           │
│           updatedAt: serverTimestamp()                            │
│         });                                                       │
│       }                                                           │
│     }, (error) => {                                               │
│       console.error("Error fetching plan:", error);               │
│     });                                                           │
│                                                                   │
│  4. Return unsubscribe function from useEffect                    │
└──────────────────────────────────────────────────────────────────┘
```

### Dynamic Default Generation

```javascript
function generateDefaultPlan() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  return {
    weekStart: formatDate(monday),
    weekEnd: formatDate(sunday),
    label: `Week of ${monday.getDate()} ${monthNames[monday.getMonth()]} ${monday.getFullYear()}`,
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

### Schema Migration

```javascript
function migratePlan(data) {
  let plan = { ...data };

  // Migration v1 → v2 (example: add warmup/cooldown fields)
  if (!plan.planVersion || plan.planVersion < 2) {
    plan = {
      ...plan,
      planVersion: 2,
      warmup: null,
      cooldown: null
    };
  }

  // Ensure all 7 days exist (in case of partial data)
  const requiredDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  requiredDays.forEach(day => {
    if (!plan.days[day]) {
      plan.days[day] = { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null };
    }
  });

  return plan;
}
```

---

## 3. Write Flow

### Trigger: User saves a day edit

The existing `saveDraft` function (line 156-163) already calls `setWeeklyPlan`. We add a Firestore write after it:

```
┌──────────────────────────────────────────────────────────────────┐
│  saveDraft() — called when user clicks "Save" on a day edit      │
│                                                                   │
│  1. Update React state (existing):                               │
│     setWeeklyPlan(prev => ({                                      │
│       ...prev,                                                    │
│       days: { ...prev.days, [editingDay]: editDraft }             │
│     }));                                                          │
│                                                                   │
│  2. NEW: Write to Firestore                                       │
│     const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
│     await setDoc(planDocRef, {                                    │
│       ...weeklyPlan,                                              │
│       days: { ...weeklyPlan.days, [editingDay]: editDraft },      │
│       updatedAt: serverTimestamp()                                │
│     }, { merge: true });                                          │
│                                                                   │
│  3. Clear editing state (existing):                              │
│     setEditingDay(null);                                          │
│     setEditDraft(null);                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Important: Use `setDoc` with `{ merge: true }`

- `setDoc` with `{ merge: true }` will create the document if it doesn't exist, or update only the specified fields if it does.
- This is safer than `updateDoc` because it won't fail if the document doesn't exist yet.
- This is safer than `setDoc` without merge because it won't overwrite fields like `createdAt`.

### Debounce Strategy

For rapid edits (e.g., user types exercise names quickly), debounce the Firestore write:

```javascript
// Using lodash.debounce or a simple custom debounce
const debouncedSavePlan = useCallback(
  debounce(async (plan) => {
    if (!user) return;
    const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
    try {
      await setDoc(planDocRef, {
        ...plan,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save plan:", err);
    }
  }, 500),
  [user]
);
```

**Debounce timing:** 500ms — long enough to batch rapid edits, short enough that the user won't notice a delay.

---

## 4. Auto-Save Strategy

### What Triggers an Auto-Save

| Action | Save Trigger | Debounce? |
|--------|-------------|-----------|
| User saves a day edit (clicks "Save") | Immediate write | No |
| User switches day while editing | Write current draft, then switch | No |
| User navigates away from Plan tab | Write current state | No |
| User closes browser/tab | Best-effort (use `beforeunload`) | N/A |

### Save on Tab Switch

When the user navigates away from the Plan tab while editing, save the current draft:

```javascript
// In WeeklyPlanTab, detect tab change via useEffect cleanup
useEffect(() => {
  return () => {
    // Component unmounting — save any pending edits
    if (editingDay && editDraft && user) {
      const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
      setDoc(planDocRef, {
        days: { [editingDay]: editDraft }
      }, { merge: true });
    }
  };
}, [editingDay, editDraft, user]);
```

### Save on `beforeunload`

```javascript
// In App.jsx, add a beforeunload handler
useEffect(() => {
  const handleBeforeUnload = () => {
    // Firestore writes are async — this is best-effort
    // The real safety net is the debounced auto-save
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

### Save Indicator

Show a small "Saving..." / "Saved" indicator in the Plan tab header:

```
┌─────────────────────────────────────────────┐
│  Program Mingguan              Week of ...  │
│                                    ● Saved  │
└─────────────────────────────────────────────┘
```

Implementation: Use a `isSaving` state that is `true` between `setDoc` call and `onSnapshot` confirmation.

---

## 5. Error Handling

### Error Scenarios

| Scenario | User Impact | Handling |
|----------|-------------|----------|
| Firestore write fails (network) | Plan not saved | Show toast: "Gagal menyimpan plan. Coba lagi." Retry on next edit. |
| Firestore read fails (network) | Plan shows default | Show toast: "Gagal memuat plan. Menampilkan default." |
| Firestore permission denied | Plan not saved | Show toast: "Tidak punya akses. Hubungi admin." |
| Plan document corrupted | App crashes | Wrap `migratePlan` in try/catch. Fall back to `generateDefaultPlan()`. |
| Concurrent edit conflict | Stale data | `onSnapshot` will update UI with latest data. User may see their edit overwritten. |

### Error Handling Code Pattern

```javascript
// Read error
onSnapshot(planDocRef, (snapshot) => {
  // ...success handler
}, (error) => {
  console.error("Error fetching plan:", error);
  // Fall back to default plan
  setWeeklyPlan(generateDefaultPlan());
  // Show error toast
  setToastMessage("Gagal memuat plan. Menampilkan default.");
  setShowToast(true);
});

// Write error
const savePlan = async (plan) => {
  try {
    await setDoc(planDocRef, { ...plan, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error saving plan:", error);
    setToastMessage("Gagal menyimpan plan. Coba lagi.");
    setShowToast(true);
  }
};
```

### Retry Logic

For transient network errors, retry the write up to 3 times with exponential backoff:

```javascript
async function savePlanWithRetry(planDocRef, plan, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await setDoc(planDocRef, plan, { merge: true });
      return; // success
    } catch (error) {
      if (i === retries - 1) throw error; // last retry failed
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // 1s, 2s, 4s
    }
  }
}
```

---

## 6. Offline Behavior

### With Firestore Offline Persistence (Recommended)

When `enableIndexedDbPersistence` is enabled (part of the PWA feature, F01):

```
┌─────────────────────────────────────────────────────────────┐
│  User edits plan while offline                               │
│                                                              │
│  1. setDoc writes to local IndexedDB cache                   │
│  2. onSnapshot fires with local data (optimistic UI)         │
│  3. User sees their edit immediately                         │
│                                                              │
│  ...later, connectivity returns...                           │
│                                                              │
│  4. Firestore syncs local changes to server                  │
│  5. onSnapshot fires again with confirmed server data        │
│  6. UI updates (no user action needed)                       │
└─────────────────────────────────────────────────────────────┘
```

### Without Offline Persistence

If offline persistence is not enabled:

```
┌─────────────────────────────────────────────────────────────┐
│  User edits plan while offline                               │
│                                                              │
│  1. setDoc call fails (no network)                           │
│  2. Error handler shows toast: "Gagal menyimpan plan"        │
│  3. Plan is NOT saved — lost on refresh                      │
│                                                              │
│  ⚠️ This is the current broken behavior for workouts too     │
│  ✅ Fix: Enable enableIndexedDbPersistence (PWA feature)     │
└─────────────────────────────────────────────────────────────┘
```

### Offline Indicator

Show a subtle indicator when the user is offline:

```javascript
// Detect online/offline status
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

Display in Plan tab header:

```jsx
{!isOnline && (
  <span className="text-[10px] text-amber-500 font-bold">
    ● Offline — perubahan akan tersimpan saat online
  </span>
)}
```

---

## 7. Required File Changes

### File: `src/App.jsx`

| # | Change | Location | Description |
|---|--------|----------|-------------|
| 1 | **Add import** | Top of file (line 12) | Add `serverTimestamp` to Firestore imports |
| 2 | **Add `generateDefaultPlan()`** | After `DEFAULT_WEEKLY_PLAN` constant (after line 97) | New function that generates a plan dynamically for the current week |
| 3 | **Add `migratePlan()`** | After `generateDefaultPlan()` | Handles future schema migrations |
| 4 | **Add plan Firestore listener** | New `useEffect` after line 494 | `onSnapshot` on `users/{uid}/plan/current` — reads plan, hydrates state |
| 5 | **Modify `saveDraft()`** | Lines 156-163 | Add `setDoc` call to Firestore after `setWeeklyPlan` |
| 6 | **Add debounced save** | Inside `WeeklyPlanTab` or `App` | Debounce rapid edits (500ms) |
| 7 | **Add save indicator state** | Inside `WeeklyPlanTab` | `isSaving` state for UI feedback |
| 8 | **Add offline detection** | Inside `WeeklyPlanTab` or `App` | `navigator.onLine` listener |
| 9 | **Add error toast for plan** | Inside `App` | Reuse existing `showToast` pattern |
| 10 | **Remove `DEFAULT_WEEKLY_PLAN`** | Lines 32-97 | Optional — can keep as fallback, but `generateDefaultPlan()` replaces it |

### File: `src/App.jsx` — Detailed Change Map

#### Change 1: Import `serverTimestamp`

```javascript
// Line 12 — BEFORE
import { getFirestore, collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// Line 12 — AFTER
import { getFirestore, collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
```

#### Change 2: Add `generateDefaultPlan()` and `migratePlan()`

Insert after line 97 (after the `DEFAULT_WEEKLY_PLAN` constant closing brace):

```javascript
// ─── DYNAMIC PLAN GENERATION ────────────────────────────────────────────────
function generateDefaultPlan() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  return {
    weekStart: fmt(monday),
    weekEnd: fmt(sunday),
    label: `Week of ${monday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()}`,
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

function migratePlan(data) {
  let plan = { ...data };
  if (!plan.planVersion || plan.planVersion < 1) {
    plan.planVersion = 1;
  }
  const requiredDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  requiredDays.forEach(day => {
    if (!plan.days[day]) {
      plan.days[day] = { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null };
    }
  });
  return plan;
}
```

#### Change 3: Add Plan Firestore Listener

Insert after the workouts listener (after line 494):

```javascript
// --- 4B. FETCH PLAN DARI FIRESTORE ---
useEffect(() => {
  if (!user) return;
  const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
  const unsubscribe = onSnapshot(planDocRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const migrated = migratePlan(data);
      setWeeklyPlan(migrated);
    } else {
      // First-time user: generate and save default plan
      const defaultPlan = generateDefaultPlan();
      setWeeklyPlan(defaultPlan);
      setDoc(planDocRef, {
        ...defaultPlan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => console.error("Error creating default plan:", err));
    }
  }, (error) => {
    console.error("Error fetching plan:", error);
    setWeeklyPlan(generateDefaultPlan());
  });
  return () => unsubscribe();
}, [user]);
```

#### Change 4: Modify `saveDraft()` to Write to Firestore

```javascript
// Lines 156-163 — BEFORE
const saveDraft = () => {
  setWeeklyPlan(prev => ({
    ...prev,
    days: { ...prev.days, [editingDay]: editDraft }
  }));
  setEditingDay(null);
  setEditDraft(null);
};

// Lines 156-163 — AFTER
const saveDraft = async () => {
  const updatedPlan = {
    ...weeklyPlan,
    days: { ...weeklyPlan.days, [editingDay]: editDraft }
  };
  setWeeklyPlan(updatedPlan);
  setEditingDay(null);
  setEditDraft(null);

  // Persist to Firestore
  if (user) {
    try {
      const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
      await setDoc(planDocRef, {
        ...updatedPlan,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving plan:", err);
    }
  }
};
```

#### Change 5: Pass `user` to `WeeklyPlanTab`

```jsx
// Line 631 — BEFORE
{activeTab === 'plan' && <WeeklyPlanTab weeklyPlan={weeklyPlan} setWeeklyPlan={setWeeklyPlan} workouts={workouts} />}

// Line 631 — AFTER
{activeTab === 'plan' && <WeeklyPlanTab weeklyPlan={weeklyPlan} setWeeklyPlan={setWeeklyPlan} workouts={workouts} user={user} />}
```

### File: `src/App.jsx` — No Changes Needed

| Component | Reason |
|-----------|--------|
| `Dashboard` | Already reads `weeklyPlan` — no changes needed |
| `QuickInput` | Already reads `weeklyPlan` — no changes needed |
| `getDashboardSummary` | Already reads `weeklyPlan.weekStart` and `weeklyPlan.days` — no changes needed |
| `DEFAULT_WEEKLY_PLAN` constant | Can be kept as fallback or removed — `generateDefaultPlan()` replaces it |

### Firestore Security Rules

Add to Firebase console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 8. Implementation Order

| Step | Task | Effort | Risk |
|------|------|--------|------|
| 1 | Add `serverTimestamp` import | 1 min | None |
| 2 | Add `generateDefaultPlan()` and `migratePlan()` functions | 15 min | Low |
| 3 | Add plan Firestore listener `useEffect` | 15 min | Low |
| 4 | Modify `saveDraft()` to write to Firestore | 10 min | Low |
| 5 | Pass `user` prop to `WeeklyPlanTab` | 2 min | None |
| 6 | Add error handling (toast messages) | 10 min | Low |
| 7 | Add save indicator UI | 15 min | Low |
| 8 | Add offline detection | 10 min | Low |
| 9 | Test: create plan, refresh, verify persistence | 10 min | — |
| 10 | Test: edit plan, refresh, verify persistence | 10 min | — |
| 11 | Test: offline edit (with PWA persistence enabled) | 10 min | — |
| 12 | Remove `DEFAULT_WEEKLY_PLAN` constant (optional) | 5 min | Low |

**Total implementation effort:** ~1.5 hours (excluding testing)

---

## 9. Rollback Plan

If the implementation causes issues:

1. **Revert `saveDraft()`** to its original code (remove Firestore write)
2. **Remove the plan listener `useEffect`**
3. **Restore `useState(DEFAULT_WEEKLY_PLAN)`** initialization
4. **Remove `generateDefaultPlan()` and `migratePlan()`**

This restores the original behavior completely.

---

*Based on analysis in `WEEKLY_PLAN_PERSISTENCE_ANALYSIS.md` and `src/App.jsx` (2694 lines)*  
*Generated: June 23, 2026 | Project: HybridTrack*
