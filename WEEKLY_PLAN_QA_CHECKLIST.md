# Weekly Plan Persistence — QA Checklist

> Practical end-to-end tests for the weekly plan Firestore persistence feature.
>
> **Feature scope:** Save plan edits to Firestore, load on refresh, detect stale weeks, show save status.
>
> **Review date:** June 23, 2026

---

## 1. Save Success

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1 | Open Plan tab, click a day, click Edit (pencil) | Edit modal opens with editable fields | |
| 2 | Change session type or exercise data, click **Simpan** | Edit modal closes, day card shows updated data | |
| 3 | Observe the modal header while saving | "Menyimpan..." text appears briefly, then "✓ Tersimpan" | |
| 4 | Check that the Simpan button is disabled while "Menyimpan..." is shown | Button is greyed out, not clickable | |
| 5 | After "✓ Tersimpan" appears, wait 3 seconds | Status text disappears automatically | |

## 2. Save Failure

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1 | Open DevTools → Network tab → throttle to **Offline** | | |
| 2 | Edit a day, click **Simpan** | "Menyimpan..." appears, then "✗ Gagal menyimpan" | |
| 3 | Check browser console | `Error saving plan:` logged with error details | |
| 4 | Set network back to **Online** | | |
| 5 | Edit the same day again, click **Simpan** | Save succeeds, "✓ Tersimpan" appears | |

## 3. Refresh Persistence

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1 | Edit a day (e.g., change Monday to "Gym - Push"), click Simpan | "✓ Tersimpan" appears | |
| 2 | **Refresh the page** (F5) | | |
| 3 | Navigate to Plan tab | Monday still shows "Gym - Push" with the edited exercises | |
| 4 | Edit a different day (e.g., Tuesday), click Simpan | "✓ Tersimpan" appears | |
| 5 | Refresh again | Both Monday and Tuesday edits are preserved | |

## 4. Logout/Login Persistence

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1 | Edit a day and save | "✓ Tersimpan" appears | |
| 2 | Click **Logout** | Returns to login screen | |
| 3 | Log in with the **same Google account** | App loads, Dashboard shows | |
| 4 | Navigate to Plan tab | All previous edits are still there | |
| 5 | Log out, log in with a **different Google account** | Plan tab shows a fresh plan (all Rest days) | |
| 6 | Log back in with the original account | Original edits are restored | |

## 5. Stale Week Handling

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1 | Open Firestore Console → `users/{uid}/plan/current` | | |
| 2 | Manually set `weekEnd` to a date **before today** (e.g., last week) | | |
| 3 | Refresh the app, navigate to Plan tab | Yellow warning banner appears at the top: "Plan ini dari minggu lalu. Buat plan baru untuk minggu ini?" | |
| 4 | Click **Buat Baru** | Banner disappears, plan is regenerated for the current week (all Rest days) | |
| 5 | Check Firestore Console → `users/{uid}/plan/current` | Document updated with new `weekStart` = this Monday, all Rest days | |
| 6 | Refresh the page | No stale banner, new plan persists | |

## 6. Firestore Verification

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| 1 | Open Firestore Console → `users/{uid}/plan/current` | Document exists | |
| 2 | Check document fields | Contains: `weekStart`, `weekEnd`, `label`, `days` (7 day keys), `planVersion`, `createdAt`, `updatedAt` | |
| 3 | Edit a day in the app, click Simpan | `updatedAt` timestamp changes in Firestore Console | |
| 4 | Check that `days.{dayKey}` matches what you edited | Exercise names, weights, reps are correct | |
| 5 | Verify that no other user's plan document was modified | Only `users/{yourUid}/plan/current` changed | |

---

## Summary

| Test Area | Tests | Status |
|-----------|-------|--------|
| Save Success | 5 | |
| Save Failure | 5 | |
| Refresh Persistence | 5 | |
| Logout/Login Persistence | 6 | |
| Stale Week Handling | 6 | |
| Firestore Verification | 5 | |
| **Total** | **32** | |

---

*Generated: June 23, 2026 | Project: HybridTrack*
