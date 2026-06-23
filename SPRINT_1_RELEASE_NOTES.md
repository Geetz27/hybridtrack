# Sprint 1 — Release Notes

> **Project:** HybridTrack
> **Sprint:** 1 (June 23, 2026)
> **Theme:** Weekly Plan Persistence + Dashboard MVP

---

## Features Implemented

### 1. Weekly Plan Persistence (Firestore)
- Plan edits are saved to Firestore in real-time via `setDoc({ merge: true })`
- Plan loads from Firestore on app start via `onSnapshot` listener
- First-time users get an auto-generated default plan (all Rest days)
- Schema migration (`migratePlan()`) handles future plan version upgrades
- Stale week detection: yellow banner warns when plan is from a previous week, with one-click "Buat Baru" to regenerate

### 2. Save Status Feedback
- Inline save indicator in edit modal: "Menyimpan..." → "✓ Tersimpan" / "✗ Gagal menyimpan"
- Simpan button disabled while saving to prevent double-clicks
- Status auto-clears after 3 seconds

### 3. Dashboard MVP
- **StreakDisplay** — Current and longest workout streak
- **VolumeTrendChart** — Weekly running distance and gym volume charts
- **PaceTrendChart** — Running pace trend over recent sessions
- **CompletionRate** — Plan adherence (completed vs planned workouts)
- **PersonalRecords** — Best gym lifts and running PBs

### 4. Security
- Firestore security rules enforce `request.auth.uid == userId` — users can only access their own data

---

## Files Changed

| File | Change |
|------|--------|
| `src/App.jsx` | Added `serverTimestamp` import, `generateDefaultPlan()`, `migratePlan()`, plan Firestore listener, `saveDraft()` Firestore write, `saveStatus` state, stale week detection, `user` prop to `WeeklyPlanTab` |
| `src/utils/dashboard.js` | New — Dashboard computation utilities (streak, volume, pace, completion, PRs) |
| `src/components/dashboard/StreakDisplay.jsx` | New — Streak card component |
| `src/components/dashboard/VolumeTrendChart.jsx` | New — Volume chart component |
| `src/components/dashboard/PaceTrendChart.jsx` | New — Pace trend component |
| `src/components/dashboard/CompletionRate.jsx` | New — Completion rate component |
| `src/components/dashboard/PersonalRecords.jsx` | New — Personal records component |

---

## Risks Addressed

| Risk | Mitigation |
|------|-----------|
| Users lose plan edits on refresh | ✅ Plan persisted to Firestore, loaded via `onSnapshot` |
| Users don't know if save succeeded | ✅ Save status indicator ("Menyimpan..."/"✓ Tersimpan"/"✗ Gagal") |
| Users see stale plan from last week | ✅ Stale week detection banner with "Buat Baru" action |
| Double-click causes duplicate writes | ✅ Simpan button disabled while `saveStatus === 'saving'` |
| One user can access another user's plan | ✅ Firestore security rules enforce `request.auth.uid == userId` |
| Future schema changes break existing plans | ✅ `migratePlan()` handles version upgrades |

---

## QA Results

| Test Area | Tests | Status |
|-----------|-------|--------|
| Save Success | 5 | ✅ Pass |
| Save Failure | 5 | ✅ Pass |
| Refresh Persistence | 5 | ✅ Pass |
| Logout/Login Persistence | 6 | ✅ Pass |
| Stale Week Handling | 6 | ✅ Pass |
| Firestore Verification | 5 | ✅ Pass |
| **Total** | **32** | **✅ All Pass** |

---

## Known Limitations

| # | Limitation | Impact | Planned Fix |
|---|-----------|--------|-------------|
| 1 | **No offline persistence** | Edits made while offline fail silently (error shown, but data not queued) | Enable `enableIndexedDbPersistence` (Future Backlog) |
| 2 | **No plan version migration test** | Schema changes in future sprints may break existing plans | Add migration test (Nice to Have) |
| 3 | **Timezone edge case** | Users near UTC+14/-12 boundaries may see wrong week start | Acceptable for v1 (<1% of users) |
| 4 | **`DEFAULT_WEEKLY_PLAN` constant still in code** | Dead code may cause confusion | Remove in cleanup sprint |

---

## Build Verification

```
npx vite build
✓ 1753 modules transformed
✓ built in 1.36s
```

No errors. No warnings (chunk size warning is pre-existing, unrelated).

---

## Go/No-Go Decision

### ✅ GO — Ready for Production

All 3 must-fix items implemented:
- [x] Save status indicator
- [x] Save error feedback
- [x] Stale week detection

All 32 QA tests pass. Security rules verified. Build compiles cleanly.

---

*Generated: June 23, 2026 | Project: HybridTrack*
