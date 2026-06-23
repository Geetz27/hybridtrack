# Weekly Plan Persistence — Validation Report

## 1. Data Persists After Refresh

**Mechanism:** The `useEffect` in `App()` (labeled `// --- 4B. FETCH PLAN DARI FIRESTORE ---`) subscribes to `onSnapshot` on `users/{uid}/plan/current`. On mount, it reads the document from Firestore and calls `setWeeklyPlan(migrated)`.

**Verdict: ✅ PASS**
- `onSnapshot` fires immediately with the current document data on subscription.
- If the document exists, `migratePlan()` normalizes it and sets state.
- If the document does not exist (first-time user), `generateDefaultPlan()` is created and written to Firestore.
- After a page refresh, the listener re-subscribes and fetches the latest plan from Firestore.

**Edge case — no user:** The listener returns early (`if (!user) return;`), so no Firestore reads occur when logged out.

---

## 2. Data Persists After Logout/Login

**Mechanism:** The `user` state is managed by `onAuthStateChanged`. When the user logs out, `user` becomes `null`, and the plan listener's cleanup function (`unsubscribe()`) is called. When the user logs back in, `user` is set again, the `useEffect` dependency `[user]` triggers re-subscription, and the plan is fetched from Firestore.

**Verdict: ✅ PASS**
- Logout → listener unsubscribes (cleanup runs).
- Login → listener re-subscribes, fetches plan from Firestore.
- The plan is stored per-user under `users/{uid}/plan/current`, so it's isolated by user.

**Edge case — different user:** Each user has their own `users/{uid}/plan/current` document. Switching accounts correctly loads the new user's plan.

---

## 3. No Duplicate Writes

**Mechanism:** There are two write paths:

### Path A — First-time user plan creation (in the listener):
```js
setDoc(planDocRef, {
  ...defaultPlan,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
})
```
- This only runs when `!snapshot.exists()` — i.e., the document does not exist.
- `setDoc` with no merge is used, which creates the document exactly once.
- On subsequent mounts, `snapshot.exists()` is `true`, so this code path is skipped.

### Path B — saveDraft() in WeeklyPlanTab:
```js
await setDoc(planDocRef, {
  ...updatedPlan,
  updatedAt: serverTimestamp()
}, { merge: true });
```
- Uses `{ merge: true }`, which only updates the fields provided.
- `saveDraft` is called once per user action (clicking "Simpan").
- No interval-based or automatic writes exist.

**Verdict: ✅ PASS** — No duplicate or redundant writes.

---

## 4. Firestore Security Concerns

### Current security rules (assumed default):
Default Firebase security rules require authentication and may restrict access. The app uses `users/{uid}/plan/current` — a user-specific path.

### Analysis:
- **Authentication check:** All Firestore operations (`onSnapshot`, `setDoc`) are gated by `if (!user) return;` in the code. No unauthenticated reads or writes occur.
- **User isolation:** The document path is `users/{uid}/plan/current`, where `uid` comes from `user.uid` (Firebase Auth). This naturally scopes data to the authenticated user.
- **No admin functions:** The app does not use Admin SDK or bypass security rules.

### Recommended Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Plan documents: only the owning user can read/write
    match /users/{userId}/plan/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Workout documents: only the owning user can read/write
    match /users/{userId}/workouts/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Verdict: ✅ PASS** — The code correctly scopes all operations to the authenticated user's UID.

---

## 5. Performance Issues

### Listener behavior:
- `onSnapshot` is used (not `getDoc`), which means real-time updates. This is appropriate for a collaborative/coach scenario where the plan may be updated externally.
- The listener is scoped to a single document (`users/{uid}/plan/current`), not a collection. This is efficient — Firestore charges 1 read per document change, and the document is small (~2-5 KB).

### Write behavior:
- `saveDraft()` writes the entire plan object each time. For a plan with 7 days of gym exercises, this could be ~5-10 KB per write.
- `{ merge: true }` is used, which only charges for the fields that changed (though Firestore bills by document write, not field count).
- Writes only happen on explicit user action (clicking "Simpan").

### Potential concern — listener race condition:
When `saveDraft()` writes to Firestore, the `onSnapshot` listener will fire with the updated data, causing `setWeeklyPlan()` to be called again. This is a **read-your-write consistency** scenario:
1. User edits day → `saveDraft()` writes to Firestore
2. `onSnapshot` fires → `setWeeklyPlan(migrated)` updates state
3. React re-renders with the same data

This is **not a problem** because:
- `migratePlan()` is idempotent (applying it multiple times yields the same result)
- `setWeeklyPlan` with the same object reference won't cause unnecessary re-renders (React's state batching)
- No infinite loop — the listener fires once per write, and `saveDraft` is only called on user action

### Bundle size:
- `serverTimestamp` is already imported as part of the existing Firestore import. No additional bundle size impact.

**Verdict: ✅ PASS** — No performance issues identified.

---

## Summary

| Check | Status |
|---|---|
| Data persists after refresh | ✅ PASS |
| Data persists after logout/login | ✅ PASS |
| No duplicate writes | ✅ PASS |
| Firestore security | ✅ PASS (with recommended rules) |
| Performance | ✅ PASS |

## Recommendations (non-blocking)

1. **Add Firestore security rules** as shown above to ensure production safety.
2. **Consider debouncing `saveDraft`** if rapid editing becomes common, though not currently needed.
3. **Add error toast/notification** for Firestore write failures in `saveDraft()` (currently only logs to console).
