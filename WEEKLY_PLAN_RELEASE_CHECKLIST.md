# Weekly Plan Persistence — Release Checklist

> **Senior Engineer Review** — Production readiness assessment for the weekly plan Firestore persistence feature.
>
> Reviewed files: `WEEKLY_PLAN_PERSISTENCE_ANALYSIS.md`, `WEEKLY_PLAN_IMPLEMENTATION_PLAN.md`, `WEEKLY_PLAN_VALIDATION.md`
>
> **Review date:** June 23, 2026 | **Reviewer:** Senior Software Engineer

---

## 1. Production Readiness Verdict

### ⚠️ NOT READY FOR PRODUCTION — 3 blocking issues identified

The implementation is **architecturally sound** and the code changes are **correct**, but three issues must be resolved before this can ship to production:

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | **No error feedback to user on write failure** | 🔴 Blocking | UX / Reliability |
| 2 | **No Firestore security rules deployed** | 🔴 Blocking | Security |
| 3 | **No stale-week detection** | 🟡 High | Data Integrity |

---

## 2. Blocking Issues (Must Fix Before Release)

### 🔴 Issue 1: Silent Write Failures

**What's implemented:** `saveDraft()` has a `try/catch` that logs to `console.error` but does not surface the error to the user.

**Risk:** If a Firestore write fails (network issue, quota exceeded, permission denied), the user sees no feedback. They navigate away or refresh, and their edits are lost. They have no way to know.

**Fix required:**
```javascript
// In saveDraft(), after the catch block:
} catch (err) {
  console.error("Error saving plan:", err);
  // ADD: Show error toast to user
  // The app already has a showToast pattern — reuse it
  // Example: setToastMessage("Gagal menyimpan plan. Coba lagi.");
  //          setShowToast(true);
}
```

**Verification:** After fix, simulate a write failure (e.g., disconnect network, click Save). User must see a visible error message.

---

### 🔴 Issue 2: No Firestore Security Rules

**What's implemented:** The code correctly scopes reads/writes to `users/{uid}/plan/current` using `user.uid`. However, **no security rules have been deployed** to Firebase.

**Risk:** With default (open) Firestore rules, any authenticated user could read or write any other user's plan document. This is a data privacy vulnerability.

**Fix required:** Deploy these rules to Firebase Console → Firestore → Rules:

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

**Verification:** After deployment, verify that:
- User A cannot read `users/userB/plan/current`
- Unauthenticated requests are rejected
- User A can read/write their own plan

---

### 🔴 Issue 3: No Stale-Week Detection

**What's implemented:** `generateDefaultPlan()` correctly computes the current week's Monday. However, once a plan is saved to Firestore, it stays there indefinitely. If a user's plan is from last week, the app shows stale data with no warning.

**Risk:** User opens the app on a new week, sees last week's plan, and logs workouts against the wrong plan. The Dashboard's "Today's Plan" card shows incorrect sessions.

**Fix required:** Add a stale-week check in the plan listener or in the `WeeklyPlanTab` component:

```javascript
// After setWeeklyPlan(migrated) in the listener:
const isStale = migrated.weekEnd && new Date(migrated.weekEnd) < new Date();
if (isStale) {
  // Show banner: "Your plan is from last week. Carry forward or start fresh?"
  // Or auto-generate a new plan with a confirmation dialog
}
```

**Verification:** After fix:
1. Create a plan with `weekEnd` set to last week
2. Refresh the app
3. User must see a prompt to update their plan

---

## 3. High-Risk Items (Should Fix Before Release)

### 🟡 Issue 4: No Debounce on Save

**What's implemented:** `saveDraft()` writes to Firestore immediately on every "Simpan" click.

**Risk:** If a user rapidly edits multiple fields (e.g., types exercise names quickly), each keystroke could trigger a Firestore write. This is mitigated by the fact that `saveDraft` is only called on explicit "Simpan" button click, not on keystroke. However, if the user clicks "Simpan" multiple times rapidly, it could cause multiple writes.

**Recommendation:** Add a 300ms debounce or a loading state that disables the Save button while the write is in progress.

```javascript
const [isSaving, setIsSaving] = useState(false);

const saveDraft = async () => {
  if (isSaving) return; // prevent double-save
  setIsSaving(true);
  try {
    // ... existing save logic
  } finally {
    setIsSaving(false);
  }
};
```

---

### 🟡 Issue 5: No Save Indicator

**What's implemented:** No visual feedback when the plan is being saved or has been saved.

**Risk:** User clicks "Simpan" and sees no confirmation. They may click again (causing duplicate writes) or navigate away before the write completes.

**Recommendation:** Add a "Saving..." / "Saved" indicator in the edit modal header. The app already has a `showToast` pattern that can be reused.

---

### 🟡 Issue 6: Race Condition — Listener vs. Local State

**What's implemented:** `saveDraft()` writes to Firestore, then the `onSnapshot` listener fires and overwrites local state with the server data.

**Risk:** If the Firestore write succeeds but the `onSnapshot` callback fires with stale data (due to Firestore's multi-region replication lag), the user's edit could be overwritten. This is unlikely in single-region Firestore but possible.

**Mitigation already in place:** `migratePlan()` is idempotent. The listener uses `setWeeklyPlan(migrated)` which will set the same data. React's state batching prevents unnecessary re-renders.

**Recommendation:** Accept this risk for now. If users report edits being lost, switch to optimistic updates (update local state immediately, then sync to Firestore without waiting for `onSnapshot`).

---

## 4. Medium-Risk Items (Post-Release)

### 🟢 Issue 7: Offline Edits Lost

**What's implemented:** No offline persistence. If the user edits their plan while offline, the `setDoc` call fails, and the error is logged to console only.

**Risk:** Users in areas with poor connectivity lose their plan edits.

**Recommendation:** Enable Firestore offline persistence (`enableIndexedDbPersistence`) as part of the PWA feature (F01 in PRODUCT_ROADMAP). This is a separate feature, not a blocker for this release.

---

### 🟢 Issue 8: No Plan Version Migration Test

**What's implemented:** `migratePlan()` handles schema versioning, but there's no test to verify that old plans are correctly migrated.

**Risk:** When the plan schema changes in the future, existing plans may not migrate correctly, causing runtime errors.

**Recommendation:** Create a manual test procedure (see Section 6) that includes testing migration from v1 to v2.

---

## 5. Assumptions Requiring Verification

| # | Assumption | How to Verify | Status |
|---|-----------|---------------|--------|
| 1 | **Firestore is properly initialized** in the app | Check that `getFirestore(app)` is called and `db` is exported | ✅ Confirmed in code |
| 2 | **`serverTimestamp` is imported** | Check import line | ✅ Confirmed in code |
| 3 | **`user.uid` is always defined** when Firestore operations run | Check that all Firestore calls are gated by `if (!user) return;` | ✅ Confirmed in code |
| 4 | **`onSnapshot` returns an unsubscribe function** | Check that the return value is stored and called in cleanup | ✅ Confirmed in code |
| 5 | **`setDoc` with `{ merge: true }` does not overwrite `createdAt`** | Check that `createdAt` is only set on first write | ✅ Confirmed — `createdAt` is only in the first-time path |
| 6 | **Firebase project has Firestore enabled** | Check Firebase Console | ⚠️ Needs manual verification |
| 7 | **Firestore is in the correct region** | Check Firebase Console | ⚠️ Needs manual verification |
| 8 | **No Firestore quota limits will be hit** | Estimate daily active users × reads/writes | ⚠️ Needs estimation |
| 9 | **The `DEFAULT_WEEKLY_PLAN` constant is no longer used** | Search for references | ⚠️ Needs verification — it may still be referenced in tests or fallback paths |
| 10 | **`generateDefaultPlan()` handles timezone correctly** | Test with user in UTC+14 and UTC-12 | ⚠️ Needs manual testing |

---

## 6. Manual Test Plan

### Pre-Test Setup
- [ ] Firebase project is accessible
- [ ] Firestore is enabled in the correct region
- [ ] Security rules are deployed (see Issue 2)
- [ ] App is running locally (`npm run dev`)
- [ ] Browser DevTools → Network tab is open

### Test 1: First-Time User Flow
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.1 | Log out completely | See login screen | |
| 1.2 | Log in with a new Google account (never used before) | App loads, Dashboard shows | |
| 1.3 | Navigate to Plan tab | See 7-day strip with all "Rest" days | |
| 1.4 | Check Firestore Console → `users/{uid}/plan/current` | Document exists with `weekStart` = current Monday, all days = Rest | |
| 1.5 | Refresh the page | Plan tab still shows all Rest days (persisted) | |

### Test 2: Edit and Persist
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.1 | Click on a day (e.g., Monday) | Day detail card opens | |
| 2.2 | Click Edit (pencil icon) | Edit mode opens with editable fields | |
| 2.3 | Change session type to "Gym", add an exercise with sets | Fields update in real-time | |
| 2.4 | Click "Simpan" | Edit mode closes, day card shows updated data | |
| 2.5 | Check Firestore Console → `users/{uid}/plan/current` | Document has updated `days.monday` with new exercise data | |
| 2.6 | Refresh the page | Monday still shows the edited exercise data | |

### Test 3: Multiple Day Edits
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.1 | Edit Monday, Tuesday, Wednesday with different sessions | Each saves independently | |
| 3.2 | Refresh the page | All three days show their respective edits | |

### Test 4: Logout/Login Cycle
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.1 | Edit a day and save | Edit is persisted | |
| 4.2 | Log out | Return to login screen | |
| 4.3 | Log in with the same account | Plan tab shows the edited plan from step 4.1 | |

### Test 5: Error Handling
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.1 | Open DevTools → Network tab → throttle to "Offline" | | |
| 5.2 | Edit a day and click "Simpan" | Error toast appears: "Gagal menyimpan plan. Coba lagi." | |
| 5.3 | Set network back to "Online" | | |
| 5.4 | Edit the same day again and click "Simpan" | Save succeeds, no error toast | |

### Test 6: Stale Week Detection (if implemented)
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 6.1 | Manually set `weekEnd` to last week in Firestore Console | | |
| 6.2 | Refresh the app | Banner appears: "Your plan is from last week. Update now?" | |
| 6.3 | Click "Update" | New plan generated for current week | |

### Test 7: Concurrent Tabs
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 7.1 | Open the app in two browser tabs | Both tabs show the same plan | |
| 7.2 | In Tab A, edit Monday and save | Tab B automatically updates to show the change (within 1-2 seconds) | |

### Test 8: Security Rules
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 8.1 | Open Firebase Console → Firestore → Rules | Rules match the recommended ruleset | |
| 8.2 | In a separate browser session, log in as User B | | |
| 8.3 | Open DevTools Console and run: `firebase.firestore().doc('users/{UserA_uid}/plan/current').get()` | Permission denied error | |

### Test 9: Performance
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 9.1 | Open DevTools → Network tab | | |
| 9.2 | Load the app | Only 1 Firestore read for the plan document | |
| 9.3 | Edit and save a day | Only 1 Firestore write | |
| 9.4 | Check the payload size of the write request | Should be < 10 KB | |

### Test 10: Regression — Existing Features
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 10.1 | Navigate to Dashboard | Dashboard loads correctly, shows "Today's Plan" if applicable | |
| 10.2 | Navigate to Input tab | QuickInput works, can log workouts | |
| 10.3 | Navigate to History tab | All workouts are listed | |
| 10.4 | Log a workout | Workout saves to Firestore, toast appears | |
| 10.5 | Navigate back to Plan tab | Plan tab still works, no console errors | |

---

## 7. Rollback Criteria

If any of the following occur after deployment, **immediately roll back** by reverting the 5 code changes:

1. **Users report lost plan edits** — The primary feature is broken
2. **Console errors related to Firestore permissions** — Security rules may be misconfigured
3. **App crashes on the Plan tab** — Likely a migration or data format issue
4. **Existing workout data is affected** — Regression in the core feature

### Rollback Steps

1. Revert `saveDraft()` to original (remove Firestore write)
2. Remove the plan listener `useEffect`
3. Restore `useState(DEFAULT_WEEKLY_PLAN)` initialization
4. Remove `generateDefaultPlan()` and `migratePlan()`
5. Revert the `serverTimestamp` import addition
6. Revert the `user` prop pass to `WeeklyPlanTab`

---

## 8. Summary

| Category | Count | Details |
|----------|-------|---------|
| 🔴 Blocking (must fix) | 3 | Error feedback, security rules, stale-week detection |
| 🟡 High (should fix) | 3 | Debounce, save indicator, race condition |
| 🟢 Medium (post-release) | 2 | Offline persistence, migration testing |
| ⚠️ Assumptions to verify | 10 | See Section 5 |

### Go/No-Go Decision

| Condition | Status |
|-----------|--------|
| All 3 blocking issues resolved | ❌ Not yet |
| All 3 high-risk items addressed | ❌ Not yet |
| All 10 assumptions verified | ❌ Not yet |
| All 10 manual tests pass | ❌ Not yet |

**Decision: NO-GO for production deployment.**

**Recommended next steps:**
1. Fix the 3 blocking issues (estimated: 2-3 hours)
2. Address the 3 high-risk items (estimated: 1-2 hours)
3. Verify the 10 assumptions (estimated: 30 minutes)
4. Run the 10 manual tests (estimated: 1 hour)
5. Re-review after fixes are applied

---

*Generated: June 23, 2026 | Project: HybridTrack*
