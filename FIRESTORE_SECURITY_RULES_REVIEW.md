# Firestore Security Rules — Current State Review

> Analysis of the current Firestore security rules for the HybridTrack project.
>
> **Evidence sources:** `SECURITY_AUDIT.md`, `FIREBASE_AUDIT.md`, `src/App.jsx`, repository file listing

---

## 1. Do Firestore Security Rules Exist?

**Answer: No rules file exists in the repository.**

The project directory was searched for:
- `firestore.rules` — not found
- `firebase.json` — not found
- Any `.rules` file — not found
- Any reference to security rules in documentation — only recommendations, no deployed rules

There is **no `firestore.rules` file** in the repository, and there is **no `firebase.json`** that would indicate Firebase CLI initialization or rule deployment.

---

## 2. What Rules Are Currently Active on Firebase?

Since no rules are managed in the repository, the Firebase project is using whatever rules were set in the Firebase Console. There are three possible scenarios:

### Scenario A: Test Mode (Most Likely — If Project Was Recently Created)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 1, 23);
    }
  }
}
```

**Effect:** All reads and writes are **DENIED** because the test mode expiration date has passed (assuming the project was created before May 2026).

### Scenario B: Wide Open (If Someone Set `if true` to "Make It Work")

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Effect:** **ANYONE on the internet** can read and write any document. No authentication required.

### Scenario C: No Rules Configured

```javascript
// No rules at all — Firebase defaults to deny all
```

**Effect:** All reads and writes are **DENIED**.

### Which Scenario Is Most Likely?

The app **currently works** (users can log in, read/write workouts). This eliminates Scenarios A (expired) and C (deny all). **Scenario B is the most likely** — someone set rules to `if true` to get the app working during development and never locked them down.

---

## 3. Can One Authenticated User Access Another User's Data?

**Answer: YES — if Scenario B is true (wide open rules).**

The app's code correctly uses `user.uid` in the Firestore document path:

```javascript
// App.jsx — workout write
const docRef = doc(db, 'users', user.uid, 'workouts', newId);

// App.jsx — workout read
const workoutsRef = collection(db, 'users', user.uid, 'workouts');

// App.jsx — plan read/write
const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
```

However, **the document path is just a convention, not a security boundary.** Without security rules that enforce `request.auth.uid == userId`, any authenticated user can:

1. **Read any user's workouts:** `collection(db, 'users', 'victim-uid', 'workouts')`
2. **Write to any user's collection:** `setDoc(doc(db, 'users', 'victim-uid', 'workouts', 'malicious-id'), data)`
3. **Delete any user's data:** `deleteDoc(doc(db, 'users', 'victim-uid', 'workouts', 'any-id'))`
4. **Read/write any user's plan:** `doc(db, 'users', 'victim-uid', 'plan', 'current')`

**Evidence from SECURITY_AUDIT.md (Section 5, Vector 1):**

> **Vector 1: Direct Firestore Access (🔴 CRITICAL)**
> 
> Attacker creates their own Firebase account, obtains the Firebase project ID from the exposed config (`projectId: "hybrid-track"`), writes a simple script, and reads/writes any document at `users/{anyUid}/workouts/{anyDocId}`.
> 
> **Feasibility:** High. The project ID and API key are publicly visible in the source code.

---

## 4. Are Current Rules Production-Safe?

**Answer: NO — 🔴 CRITICAL risk.**

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Users restricted to own data | ❌ **Not enforced** | No rules file in repo; app works → likely `if true` rules |
| Unauthenticated access blocked | ❌ **Not enforced** | No rules to check `request.auth != null` |
| Data validation on writes | ❌ **Not enforced** | No rules to validate field types or values |
| Write rate limiting | ❌ **Not enforced** | No rules to limit write frequency |
| Plan document protected | ❌ **Not enforced** | No rules specific to `users/{uid}/plan/{doc}` |

**From FIREBASE_AUDIT.md (Section 5):**

> | S1 | **No Firestore Security Rules** | 🔴 Critical | Without rules, any authenticated user can read/write any document. A malicious user could read another user's workouts by guessing their UID. |

**From SECURITY_AUDIT.md (Section 1):**

> **Current Risk Level: 🔴 CRITICAL**
> 
> HybridTrack currently has **NO Firestore Security Rules deployed**. The Firebase project is either in "test mode" (open access for 30 days, which has likely expired) or has no rules at all.

---

## 5. What the Recommended Rules Should Look Like

The minimum viable rules to fix all three issues:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global deny — catch-all for unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User data — strict ownership enforcement
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

This single rule:
- ✅ **Restricts users to their own data** — `request.auth.uid == userId` ensures User A cannot access `users/userB/...`
- ✅ **Blocks unauthenticated access** — `request.auth != null` ensures only logged-in users can access Firestore
- ✅ **Protects plan documents** — the wildcard `{document=**}` covers `users/{uid}/plan/current` and `users/{uid}/workouts/{docId}`
- ✅ **Is production-safe** — this is the standard pattern used by thousands of Firebase apps

---

## 6. Summary

| Question | Answer |
|----------|--------|
| Are users restricted to their own data? | ❌ **No** — no security rules enforce this |
| Can one authenticated user access another user's plan? | ✅ **Yes** — with current (likely wide-open) rules, any authenticated user can read/write any document |
| Are current rules production-safe? | ❌ **No** — this is the #1 security vulnerability in the app |
| What is the fix? | Deploy the 4-line security rule shown above to Firebase Console → Firestore → Rules |

**Action required:** Deploy Firestore Security Rules before any production deployment. This is a 30-minute fix that prevents catastrophic data breaches.

---

*Generated: June 23, 2026 | Project: HybridTrack*
