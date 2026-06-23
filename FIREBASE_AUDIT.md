# HybridTrack — Firebase Audit

> Security, structure, performance, and cost analysis of all Firebase usage.

---

## Table of Contents

1. [Firebase Services Used](#1-firebase-services-used)
2. [Authentication Audit](#2-authentication-audit)
3. [Firestore Structure Audit](#3-firestore-structure-audit)
4. [Query Efficiency Analysis](#4-query-efficiency-analysis)
5. [Security Risks](#5-security-risks)
6. [Scaling Issues](#6-scaling-issues)
7. [Cost Optimization](#7-cost-optimization)
8. [Firestore Security Rules](#8-firestore-security-rules)
9. [Recommendations Summary](#9-recommendations-summary)

---

## 1. Firebase Services Used

| Service | Used? | Details |
|---------|-------|---------|
| **Firebase Auth** | ✅ Yes | Google Sign-In via `signInWithPopup` |
| **Cloud Firestore** | ✅ Yes | Workout data storage at `users/{uid}/workouts/{docId}` |
| **Firebase Storage** | ❌ No | Not used |
| **Firebase Hosting** | ❌ No | Not used (uses Vite dev server) |
| **Cloud Functions** | ❌ No | Not used |
| **Realtime Database** | ❌ No | Not used |
| **Analytics** | ❌ No | Not used |
| **Performance Monitoring** | ❌ No | Not used |
| **Crashlytics** | ❌ No | Not used |

**Firebase SDK version:** `firebase@^12.12.1` (latest as of June 2026)

---

## 2. Authentication Audit

### Current Implementation

```javascript
// Line 475-481 — Auth state listener
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setIsLoading(false);
  });
  return () => unsubscribe();
}, []);

// Line 497-504 — Login
const loginWithGoogle = async () => {
  await signInWithPopup(auth, googleProvider);
};

// Line 506-509 — Logout
const handleLogout = () => {
  signOut(auth);
  setWorkouts([]);
};
```

### Findings

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A1 | **No error handling for expired tokens** | 🟡 Medium | `onAuthStateChanged` doesn't handle token expiration. User may appear logged in but Firestore writes fail silently. |
| A2 | **No token refresh monitoring** | 🟡 Medium | No `onIdTokenChanged` listener. If Google session expires mid-usage, writes fail with no user feedback. |
| A3 | **No email/password or anonymous auth** | 🟢 Low | Only Google Sign-In is supported. No fallback for users without Google accounts. |
| A4 | **No multi-tenant support** | 🟢 Low | Single Firebase project. Fine for personal use, but would need restructuring for coach/athlete mode. |
| A5 | **No auth state persistence config** | 🟢 Low | Uses default persistence (localStorage). User stays logged in across sessions — acceptable behavior. |

### Recommendation

- Add `onIdTokenChanged` alongside `onAuthStateChanged` to detect token expiration
- Show a "Session expired, please re-login" toast when token refresh fails
- Consider adding anonymous auth as a fallback for offline/demo use

---

## 3. Firestore Structure Audit

### Current Structure

```
/users/{uid}/workouts/{docId}
  ├── type: "Lari" | "Gym" | "Recovery"
  ├── date: "2026-06-23" (string)
  ├── category: "Easy Run" | "Push" | etc.
  ├── distance: 5.0 (number, optional)
  ├── duration: 30 (number, optional)
  ├── pace: 6.0 (number, optional)
  ├── hr: 150 (number, optional)
  ├── cadence: 170 (number, optional)
  ├── rpe: 5 (number, optional)
  ├── planStatus: "Sesuai Plan" | etc. (string, optional)
  ├── exercises: [{ exercise: "...", sets: [...] }] (array, optional)
  ├── sleep: 7.5 (number, optional)
  ├── soreness: 5 (number, optional)
  ├── fatigue: 5 (number, optional)
  ├── weight: 65.0 (number, optional)
  ├── notes: "..." (string, optional)
  └── createdAt: "1748000000000" (string — timestamp as string)
```

### Findings

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| F1 | **Document ID is `Date.now().toString()`** | 🔴 Critical | `Date.now()` can produce duplicate IDs if two workouts are created in the same millisecond. Also, sequential IDs are predictable and can cause hotspotting in Firestore's index distribution. |
| F2 | **No subcollection for exercises** | 🟡 Medium | Exercises are stored as nested arrays inside workout documents. For large gym sessions (10+ exercises, 4+ sets each), this can exceed Firestore's 1 MiB document size limit. |
| F3 | **`createdAt` stored as string, not Timestamp** | 🟡 Medium | `createdAt: newId` where `newId = Date.now().toString()`. This is a string, not a Firestore Timestamp. Cannot use Firestore's timestamp-based queries or ordering. |
| F4 | **No data validation before write** | 🟡 Medium | Any shape of data can be written. No required field checks, no type validation, no range validation. |
| F5 | **Mixed schema in single collection** | 🟡 Medium | Run, Gym, and Recovery documents all live in the same `workouts` collection with different fields. This is acceptable but makes queries less efficient (must filter by `type`). |
| F6 | **No composite indexes defined** | 🟢 Low | Current queries are simple enough to not need composite indexes, but any future sorting by `date` + `type` will require them. |
| F7 | **No plan persistence** | 🔴 Critical | Weekly plan is NOT stored in Firestore at all. Lives only in React state. |

### Document Size Analysis

| Workout Type | Estimated Size | Notes |
|-------------|---------------|-------|
| Run (simple) | ~200–400 bytes | Small document |
| Gym (3 exercises, 3 sets each) | ~1–3 KB | Moderate |
| Gym (10 exercises, 4 sets each) | ~8–15 KB | Getting large |
| Recovery | ~200–300 bytes | Small document |

**Firestore limit:** 1 MiB per document. Current usage is well within limits, but a single workout with 50+ exercises could approach the limit.

### Recommendation

- **Use Firestore's `addDoc()` with auto-generated IDs** instead of `Date.now().toString()` — eliminates collision risk and hotspotting
- **Store `createdAt` as `serverTimestamp()`** — enables proper time-based queries
- **Consider moving exercises to a subcollection** if gym sessions regularly exceed 10 exercises
- **Add a data validation layer** before writes (see PRIORITY_FIXES.md #16)

---

## 4. Query Efficiency Analysis

### Current Queries

#### Query 1: Real-time listener (line 486-494)

```javascript
const workoutsRef = collection(db, 'users', user.uid, 'workouts');
const unsubscribe = onSnapshot(workoutsRef, (snapshot) => {
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setWorkouts(data);
});
```

| Aspect | Assessment |
|--------|-----------|
| **Query type** | Full collection read with real-time listener |
| **Filtering** | None — reads ALL workouts for the user |
| **Sorting** | None — sorted client-side in components |
| **Data transferred** | All workout documents on every change |
| **Listener behavior** | Re-reads entire collection on any change |

### Findings

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| Q1 | **No date filtering on query** | 🟡 High | Reads ALL workouts from Firestore every time. As data grows (1000+ workouts), this becomes slow and expensive. |
| Q2 | **Client-side sorting** | 🟡 Medium | `sorted = [...workouts].sort(...)` is done in multiple components. Sorting should be done server-side with `.orderBy()` for efficiency. |
| Q3 | **No pagination** | 🟡 Medium | No limit on query. A user with 10,000 workouts will download all of them on every listener trigger. |
| Q4 | **Full re-read on every change** | 🟡 Medium | `onSnapshot` with no query constraints re-reads the entire collection when any document changes. For a user with 500 workouts, a single new workout triggers a 500-document read. |
| Q5 | **Multiple `useMemo` re-computations** | 🟢 Low | `getWeeklyRunData`, `getWeeklyGymData`, `getExerciseProgress`, etc. re-compute on every workout change. With memoization this is acceptable, but still CPU work. |

### Performance Projections

| Workout Count | Query Time (estimate) | Data Size (estimate) | UX Impact |
|--------------|----------------------|---------------------|-----------|
| 10 | < 100ms | ~10 KB | Instant |
| 100 | ~200ms | ~100 KB | Fast |
| 500 | ~500ms | ~500 KB | Noticeable delay |
| 1000 | ~1s | ~1 MB | Slow initial load |
| 5000 | ~3-5s | ~5 MB | Poor experience |

### Recommendation

- **Add date range filtering** to the Firestore query — e.g., only fetch workouts from the last 12 months
- **Use `.orderBy('date', 'desc')`** with `.limit(200)` to reduce data transfer
- **Implement pagination** with Firestore cursors for history view
- **Consider a separate "summary" document** that caches aggregated stats (weekly totals, PRs) to avoid re-computing from raw data

---

## 5. Security Risks

### Current State

There are **NO Firestore Security Rules** defined (or they use the default "test mode" rules). The app relies entirely on Firebase Auth for access control.

### Findings

| # | Risk | Severity | Details |
|---|------|----------|---------|
| S1 | **No Firestore Security Rules** | 🔴 Critical | Without rules, any authenticated user can read/write any document. A malicious user could read another user's workouts by guessing their UID. |
| S2 | **API key exposed in source code** | 🟡 Medium | `apiKey: "AIzaSyDG_sI23RNXtb67w1-xRziGMbnoCYVjD70"` is hardcoded in App.jsx. While Firebase API keys are somewhat public by design, this enables abuse if someone uses the key for unauthorized Firebase project access. |
| S3 | **No input sanitization** | 🟡 Medium | User input is written directly to Firestore. A user could write malicious data (e.g., extremely large strings, negative numbers, wrong types). |
| S4 | **No rate limiting** | 🟡 Medium | No protection against rapid writes. A bug or malicious script could create thousands of documents in seconds, incurring high Firestore costs. |
| S5 | **No data ownership validation** | 🟡 Medium | The `handleDelete` and `handleEdit` functions don't verify that the workout belongs to the current user before modifying it. (Mitigated by Firestore path using `user.uid`, but still risky without rules.) |
| S6 | **Google Auth popup blocker risk** | 🟢 Low | `signInWithPopup` can be blocked by browser popup blockers. No fallback to `signInWithRedirect`. |

### Required Security Rules

```javascript
// Minimum viable Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Validate workout data on write
    match /users/{userId}/workouts/{docId} {
      allow create: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['type', 'date'])
        && request.resource.data.type in ['Lari', 'Gym', 'Recovery'];
      
      allow update: if request.auth != null 
        && request.auth.uid == userId;
      
      allow delete: if request.auth != null 
        && request.auth.uid == userId;
      
      allow read: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

### Recommendation

- **IMMEDIATELY deploy Firestore Security Rules** — this is the #1 security risk
- **Move Firebase config to `.env`** — prevents accidental exposure in version control
- **Add input validation** before writing to Firestore
- **Consider adding App Check** to prevent unauthorized API usage

---

## 6. Scaling Issues

### Current Architecture Limitations

| # | Issue | Impact at Scale | Details |
|---|-------|----------------|---------|
| SC1 | **No pagination** | 1000+ workouts | All workouts loaded at once. History page becomes slow. |
| SC2 | **Client-side aggregation** | 500+ workouts | `getDashboardSummary`, `getExerciseProgress`, `getWeeklyRunData` all iterate over the full dataset. Dashboard load time increases linearly with data. |
| SC3 | **No caching** | All scales | Every page load re-fetches all data from Firestore. No local cache, no service worker. |
| SC4 | **Single collection for all types** | 10,000+ workouts | Querying for "all runs" requires filtering client-side. No way to query only runs efficiently. |
| SC5 | **No data archiving** | 2+ years of data | Old workouts are never archived. A user who logs 2 workouts/day for 2 years has ~1,460 documents. |
| SC6 | **No offline support** | All scales | App is unusable without internet. No local cache for recently viewed data. |

### Scaling Projections

| Users | Workouts/User | Total Docs | Monthly Reads (est.) | Monthly Cost (est.) |
|-------|--------------|------------|---------------------|---------------------|
| 1 | 500 | 500 | ~15,000 | Free tier |
| 10 | 500 | 5,000 | ~150,000 | Free tier |
| 100 | 500 | 50,000 | ~1,500,000 | ~$5–10/month |
| 1,000 | 500 | 500,000 | ~15,000,000 | ~$50–100/month |

**Firestore Free Tier:** 50,000 reads/day, 20,000 writes/day, 1 GiB stored data.

### Recommendation

- **Implement pagination** for history view (limit 50, cursor-based)
- **Add a summary/aggregation document** updated on each workout write (e.g., `users/{uid}/stats/current` with weekly totals, PRs)
- **Consider data archiving** — move workouts older than 12 months to a separate "archive" collection
- **Add Firestore offline persistence** (`enableIndexedDbPersistence`) for basic offline support
- **If scaling beyond 100 users**, consider subcollections by year: `users/{uid}/workouts/2026/{docId}`

---

## 7. Cost Optimization

### Current Cost Drivers

| Driver | Impact | Optimization |
|--------|--------|-------------|
| **Full collection reads on every listener trigger** | High | Each workout add/edit triggers a re-read of ALL documents. A user with 500 workouts pays 500 reads for every single write. |
| **No query filtering** | High | Dashboard loads all workouts even though it only needs the last 90 days. |
| **Real-time listener always active** | Medium | `onSnapshot` keeps an open connection and re-reads on every change. For a user who opens the app and leaves it open, this runs continuously. |
| **Client-side aggregation** | Medium | Every page load re-processes all data. CPU cost is on the client, but Firestore reads are still incurred. |

### Estimated Current Monthly Usage (Single User)

| Activity | Reads/Day | Writes/Day | Monthly Reads | Monthly Writes |
|----------|-----------|------------|---------------|----------------|
| Open app (loads all workouts) | 5× | — | 150 | — |
| Log workout | 1 | 1 | 30 | 30 |
| Edit workout | 1 | 1 | 30 | 30 |
| Delete workout | 1 | 1 | 30 | 30 |
| View history (triggers re-read) | 3× | — | 90 | — |
| **Total** | **~11/day** | **~3/day** | **~330/month** | **~90/month** |

**Cost:** Well within Free Tier (50,000 reads/day, 20,000 writes/day).

### Projected Monthly Cost at Scale (100 Users)

| Scenario | Reads/Month | Writes/Month | Estimated Cost |
|----------|-------------|--------------|----------------|
| Current (no optimization) | ~33,000 | ~9,000 | Free tier |
| With optimization | ~6,000 | ~9,000 | Free tier |
| 1,000 users (current) | ~330,000 | ~90,000 | ~$5–15/month |
| 1,000 users (optimized) | ~60,000 | ~90,000 | Free tier |

### Optimization Opportunities

| # | Optimization | Savings | Effort |
|---|-------------|---------|--------|
| C1 | **Add `.limit(200)` to Firestore query** | 60–90% fewer reads | 15 min |
| C2 | **Filter by date range (last 12 months)** | 50–80% fewer reads | 30 min |
| C3 | **Cache aggregated stats in a summary document** | 80–95% fewer re-computations | 2–3 hrs |
| C4 | **Remove `onSnapshot` when app is backgrounded** | 50% fewer unnecessary reads | 1 hr |
| C5 | **Use `.orderBy()` + `.startAfter()` for pagination** | 70% fewer reads on history | 1–2 hrs |
| C6 | **Batch writes for gym sessions** | No change in reads, but fewer write operations | 30 min |

### Recommendation

- **Immediately add `.limit(200)`** to the Firestore query — this is the single biggest cost optimization
- **Add date filtering** — most users only need the last 6–12 months of data
- **Consider removing real-time listener** and using manual fetch with a "Refresh" button instead

---

## 8. Firestore Security Rules

### Current State

**No custom security rules are deployed.** The Firebase project likely uses the default "test mode" rules (open access for 30 days) or has no rules at all.

### Required Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ==========================================
    // USER DATA — strict ownership enforcement
    // ==========================================
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // ==========================================
    // WORKOUTS — with data validation
    // ==========================================
    match /users/{userId}/workouts/{workoutId} {
      // Read: only the owner
      allow read: if request.auth != null 
        && request.auth.uid == userId;
      
      // Create: owner + required fields + valid type
      allow create: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['type', 'date'])
        && request.resource.data.type in ['Lari', 'Gym', 'Recovery']
        && request.resource.data.date is string
        && request.resource.data.date.matches('^\\d{4}-\\d{2}-\\d{2}$');
      
      // Update: owner only (partial updates allowed)
      allow update: if request.auth != null 
        && request.auth.uid == userId;
      
      // Delete: owner only
      allow delete: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // ==========================================
    // PLAN (future) — owner only
    // ==========================================
    match /users/{userId}/plan/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

### Deployment

```bash
# Deploy security rules via Firebase CLI
firebase deploy --only firestore:rules
```

---

## 9. Recommendations Summary

### 🔴 Critical — Fix Immediately

| # | Issue | Category | Effort | Impact |
|---|-------|----------|--------|--------|
| 1 | **Deploy Firestore Security Rules** | Security | 30 min | Prevents unauthorized data access |
| 2 | **Fix document ID generation** (use `addDoc` instead of `Date.now().toString()`) | Structure | 15 min | Prevents ID collision and hotspotting |
| 3 | **Store `createdAt` as `serverTimestamp()`** | Structure | 15 min | Enables proper time-based queries |
| 4 | **Add `.limit(200)` to Firestore query** | Performance | 15 min | Reduces reads by 60–90% |

### 🟡 High — Fix Soon

| # | Issue | Category | Effort | Impact |
|---|-------|----------|--------|--------|
| 5 | **Add date range filtering to query** | Performance | 30 min | Reduces reads by 50–80% |
| 6 | **Add `onIdTokenChanged` listener** | Auth | 15 min | Prevents silent write failures |
| 7 | **Move Firebase config to `.env`** | Security | 30 min | Prevents key exposure |
| 8 | **Add input validation before writes** | Security | 1–2 hrs | Prevents invalid data in Firestore |
| 9 | **Persist weekly plan to Firestore** | Structure | 2–3 hrs | Prevents data loss |

### 🟡 Medium — Plan for Next Sprint

| # | Issue | Category | Effort | Impact |
|---|-------|----------|--------|--------|
| 10 | **Implement pagination for history** | Performance | 1–2 hrs | Improves UX at scale |
| 11 | **Add summary/aggregation document** | Performance | 2–3 hrs | Reduces re-computation |
| 12 | **Use `.orderBy()` for server-side sorting** | Performance | 30 min | More efficient queries |
| 13 | **Add Firestore offline persistence** | UX | 1 hr | Basic offline support |

### 🟢 Low — Nice-to-Have

| # | Issue | Category | Effort | Impact |
|---|-------|----------|--------|--------|
| 14 | **Add App Check** | Security | 1 hr | Prevents API abuse |
| 15 | **Consider year-based subcollections** | Structure | 2 hrs | Better scaling at 10K+ docs |
| 16 | **Add anonymous auth fallback** | Auth | 30 min | Demo/offline mode |
| 17 | **Batch writes for gym sessions** | Performance | 30 min | Fewer write operations |

### Cost Impact Summary

| Optimization | Monthly Reads (100 users) | Monthly Cost |
|-------------|--------------------------|-------------|
| Current (no optimization) | ~33,000 | Free tier |
| With `.limit(200)` + date filter | ~6,000 | Free tier |
| With summary document + pagination | ~2,000 | Free tier |
| **Firestore Free Tier limit** | **1,500,000** | **Free** |

**Conclusion:** Even without optimization, a single user will never exceed the Free Tier. At 100+ users, optimization becomes important. At 1,000+ users, all optimizations in this document become essential.

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*
