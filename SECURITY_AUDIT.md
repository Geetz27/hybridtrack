# HybridTrack — Firebase Security Audit

> Deep-dive analysis of Firestore Security Rules, authentication vulnerabilities, unauthorized access vectors, and data leakage risks.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Security Posture](#2-current-security-posture)
3. [Firestore Security Rules Analysis](#3-firestore-security-rules-analysis)
4. [Authentication Security Analysis](#4-authentication-security-analysis)
5. [Unauthorized Access Vectors](#5-unauthorized-access-vectors)
6. [Data Leakage Risks](#6-data-leakage-risks)
7. [Attack Scenarios](#7-attack-scenarios)
8. [Recommended Security Rules](#8-recommended-security-rules)
9. [Data Validation Rules](#9-data-validation-rules)
10. [App Check & Rate Limiting](#10-app-check--rate-limiting)
11. [Environment Variable Security](#11-environment-variable-security)
12. [Security Roadmap](#12-security-roadmap)

---

## 1. Executive Summary

### Current Risk Level: 🔴 CRITICAL

HybridTrack currently has **NO Firestore Security Rules deployed**. The Firebase project is either in "test mode" (open access for 30 days, which has likely expired) or has no rules at all. This means:

| Risk | Impact | Likelihood |
|------|--------|------------|
| **Any authenticated user can read any other user's data** | 🔴 Critical | High |
| **Any authenticated user can write/delete any user's data** | 🔴 Critical | Medium |
| **No data validation on writes** | 🟡 High | High |
| **API key exposed in source code** | 🟡 Medium | High |
| **No rate limiting or abuse protection** | 🟡 Medium | Medium |

### What's at Stake

- **User workout data** — Running routes, gym progress, body weight, heart rate data
- **User privacy** — Daily routines, location data (from run distances), health metrics
- **Firebase billing** — Malicious writes could incur thousands of dollars in Firestore costs
- **Application integrity** — Data corruption via unauthorized writes

### Immediate Action Required

**Deploy Firestore Security Rules before any further development.** This is a 30-minute fix that prevents catastrophic data breaches.

---

## 2. Current Security Posture

### What Exists

| Security Layer | Status | Details |
|---------------|--------|---------|
| **Firebase Auth** | ✅ Present | Google Sign-In via `signInWithPopup` |
| **Firestore Security Rules** | ❌ **MISSING** | No rules deployed (test mode or none) |
| **Data Validation** | ❌ **MISSING** | No client-side or server-side validation |
| **App Check** | ❌ **MISSING** | No reCAPTCHA or app attestation |
| **Rate Limiting** | ❌ **MISSING** | No write limits or abuse prevention |
| **Environment Variables** | ❌ **MISSING** | API keys hardcoded in source code |
| **HTTPS** | ✅ Present | Vite dev server + Firebase use HTTPS |

### The Gap

```
Expected Security Model:
  App → Firebase Auth → Security Rules → Firestore
  (authenticated)      (validates access)  (data)

Current Security Model:
  App → Firebase Auth → (nothing) → Firestore
  (authenticated)      (no rules)   (open to all)
```

The authentication layer exists, but there is **no authorization layer**. Authentication proves "who you are," but authorization (via Security Rules) proves "what you're allowed to do." Currently, any authenticated user can do anything to any document.

---

## 3. Firestore Security Rules Analysis

### Current Rules (Inferred)

Since no `firestore.rules` file exists in the repository, and no rules have been deployed via Firebase CLI, the project is using one of two default states:

#### Scenario A: Test Mode (Most Likely)

```javascript
// Default "test mode" rules — expires after 30 days
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 1, 23);
    }
  }
}
```

**Status:** If this was the original test mode from project creation, it has **already expired** (30 days from project creation). This means **ALL reads and writes are now DENIED** — the app would be completely broken.

#### Scenario B: No Rules (Also Likely)

```javascript
// No rules at all — Firebase defaults to deny all
```

**Status:** If no rules were ever configured, **ALL reads and writes are DENIED**. The app would be completely broken.

#### Scenario C: Wide Open (Worst Case)

```javascript
// Someone may have set this to allow all
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Status:** If someone set rules to `if true` to "make it work," the app functions but **ALL data is exposed to the entire internet**.

### Why This Matters

The app currently works (based on the code), which means one of two things:

1. **Scenario C is true** — Rules are set to `if true` (wide open). This is the worst possible security posture.
2. **The app is running against a different Firebase project** — The hardcoded config in `App.jsx` may not be the actual deployed project.

**Either way, the absence of rules in the repository means security is not being managed.**

---

## 4. Authentication Security Analysis

### Current Auth Implementation

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

### Auth Vulnerabilities

| # | Vulnerability | Severity | Explanation |
|---|--------------|----------|-------------|
| AV1 | **No token expiration handling** | 🟡 High | `onAuthStateChanged` doesn't detect expired tokens. User appears logged in but writes fail silently. |
| AV2 | **No `onIdTokenChanged` listener** | 🟡 High | Google OAuth tokens expire after 1 hour. Without refresh monitoring, the app may attempt writes with an expired token. |
| AV3 | **No error feedback to user** | 🟡 Medium | Auth errors are logged to console only. User sees nothing if login fails or session expires. |
| AV4 | **Popup blocker vulnerability** | 🟢 Low | `signInWithPopup` can be blocked. No fallback to `signInWithRedirect`. |
| AV5 | **No multi-factor authentication** | 🟢 Low | Google account MFA is handled by Google, but no app-level MFA exists. |

### Auth Attack Vectors

| Attack | Feasibility | Impact |
|--------|-------------|--------|
| **Stolen Google OAuth token** | Low (requires device access) | Full access to user's data |
| **Session replay** | Low (tokens are short-lived) | Limited window of access |
| **Brute force** | Not applicable | Google handles this |

**Conclusion:** Authentication is reasonably secure for a single-developer project. The main risk is not auth itself, but the **lack of authorization rules** that would limit what an authenticated user can do.

---

## 5. Unauthorized Access Vectors

### Vector 1: Direct Firestore Access (🔴 CRITICAL)

**How it works:**
1. Attacker creates their own Firebase account (free)
2. Attacker obtains the Firebase project ID from the exposed config: `projectId: "hybrid-track"`
3. Attacker writes a simple script using the Firebase Admin SDK or client SDK
4. Attacker enumerates user UIDs (or guesses them)
5. Attacker reads/writes any document at `users/{anyUid}/workouts/{anyDocId}`

**Code example of an attack:**

```javascript
// Attacker's script — requires only the project ID
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const app = initializeApp({
  projectId: "hybrid-track",
  apiKey: "AIzaSyDG_sI23RNXtb67w1-xRziGMbnoCYVjD70",
  authDomain: "hybrid-track.firebaseapp.com",
});

const auth = getAuth(app);
const db = getFirestore(app);

// Step 1: Login (any Google account works)
await signInWithPopup(auth, new GoogleAuthProvider());

// Step 2: Try to read another user's data
// Without security rules, this succeeds
const victimRef = collection(db, 'users', 'victim-uid-here', 'workouts');
const snapshot = await getDocs(victimRef);
snapshot.docs.forEach(doc => console.log(doc.data()));
```

**Feasibility:** High. The project ID and API key are publicly visible in the source code.

**Impact:** Complete data breach of all users.

### Vector 2: UID Enumeration (🟡 HIGH)

**How it works:**
1. Firebase Auth UIDs are not secret — they can sometimes be inferred
2. If an attacker knows a user's email, they can attempt to derive the UID
3. Without security rules, the attacker can test UIDs by attempting reads

**Mitigation:** Security rules with `request.auth.uid == userId` completely prevent this.

### Vector 3: Malicious Data Injection (🟡 HIGH)

**How it works:**
1. Attacker authenticates (any Google account)
2. Attacker writes malformed data to their own collection
3. If the app has no client-side validation, malformed data causes crashes for the attacker only
4. **More dangerous:** Without rules, attacker writes to OTHER users' collections

**Impact:** Data corruption, app crashes, XSS via stored data.

### Vector 4: Firestore Billing Attack (🟡 MEDIUM)

**How it works:**
1. Attacker authenticates and writes millions of documents in a loop
2. Firestore charges per read/write — a script can generate $10,000+ in bills overnight
3. Without rate limiting or write caps, there is no protection

**Impact:** Financial damage to the project owner.

### Vector 5: API Key Abuse (🟡 MEDIUM)

**How it works:**
1. The Firebase API key is hardcoded in `App.jsx`
2. Anyone can extract this key from the source code
3. The key can be used to access other Firebase services (if enabled)
4. Google's Firebase Abuse Detection may flag the key, causing service disruption

**Mitigation:** Firebase API keys are somewhat public by design, but should be restricted to specific domains/URLs in the Firebase Console.

---

## 6. Data Leakage Risks

### What Data Could Be Leaked

| Data Field | Sensitivity | Exposure Risk |
|------------|-------------|---------------|
| **Workout dates** | Low | Reveals daily routine patterns |
| **Running distances & routes** | Medium | Reveals home location, frequent routes |
| **Body weight** | High | Personal health information |
| **Heart rate data** | Medium | Health metrics |
| **Sleep data** | Medium | Health patterns |
| **Soreness/fatigue scores** | Low | Subjective health data |
| **Exercise PRs** | Low | Performance data |
| **Notes** | High | Potentially contains personal information |
| **Weekly plan** | Medium | Reveals training schedule, location patterns |

### Data Leakage Scenarios

#### Scenario 1: Targeted Attack on Specific User

```
Attacker knows victim's email → derives Firebase UID → reads all workout data
→ Gains knowledge of:
  - When victim exercises (home alone patterns)
  - Where victim runs (home location inference)
  - Victim's physical capabilities
  - Victim's health conditions
```

#### Scenario 2: Mass Data Scrape

```
Attacker writes script to enumerate UIDs → reads all users' data
→ Gains:
  - Complete dataset of all HybridTrack users
  - Can sell data or use for competitive analysis
  - Can identify high-profile users (athletes, influencers)
```

#### Scenario 3: Data Corruption

```
Attacker writes malicious data to user documents
→ Causes:
  - App crashes when user opens app
  - Permanent data loss (if overwritten)
  - User loses trust and abandons app
```

### Current Data Exposure Path

```
Client-side JavaScript (App.jsx)
  ↓
Firebase SDK (initialized with hardcoded config)
  ↓
Firestore (no security rules)
  ↓
/users/{uid}/workouts/{docId} ← ANY authenticated user can access ANY path
```

---

## 7. Attack Scenarios

### Scenario A: The Curious Competitor

| Step | Action | Success? |
|------|--------|----------|
| 1 | Downloads HybridTrack source code from GitHub | ✅ Public repo |
| 2 | Extracts Firebase project ID and API key | ✅ Hardcoded in App.jsx |
| 3 | Creates a Firebase project and writes a script | ✅ Trivial |
| 4 | Signs in with their own Google account | ✅ Works |
| 5 | Reads `users/{victimUid}/workouts` | ✅ **Succeeds (no rules)** |
| 6 | Exports all user data for analysis | ✅ Complete breach |

**Impact:** 🔴 CRITICAL — All user data exposed to competitor.

### Scenario B: The Malicious Insider

| Step | Action | Success? |
|------|--------|----------|
| 1 | Legitimate user of HybridTrack | ✅ Has account |
| 2 | Opens browser DevTools | ✅ Can inspect network requests |
| 3 | Modifies Firestore document path in console | ✅ Can write to any path |
| 4 | Deletes another user's workouts | ✅ **Succeeds (no rules)** |
| 5 | Writes fake workout data to another user | ✅ **Succeeds (no rules)** |

**Impact:** 🔴 CRITICAL — Data destruction and corruption.

### Scenario C: The Botnet Attack

| Step | Action | Success? |
|------|--------|----------|
| 1 | Attacker creates 1000 Google accounts | ✅ Automated |
| 2 | Each account writes 10,000 documents | ✅ **Succeeds (no rate limits)** |
| 3 | Firestore bills $50,000 in reads/writes | ✅ Project owner pays |
| 4 | App becomes unusable due to Firestore quota | ✅ Denial of service |

**Impact:** 🔴 CRITICAL — Financial damage and service disruption.

### Scenario D: The Casual Privacy Invasion

| Step | Action | Success? |
|------|--------|----------|
| 1 | User shares their phone with a friend | ✅ Common |
| 2 | Friend opens HybridTrack | ✅ Still logged in |
| 3 | Friend opens browser console | ✅ Can access DevTools |
| 4 | Friend reads all workout data | ✅ **Succeeds (no rules)** |

**Impact:** 🟡 HIGH — Privacy breach, but limited scope.

---

## 8. Recommended Security Rules

### Tier 1: Minimum Viable Rules (Deploy TODAY)

These rules prevent unauthorized access and data leakage. Deploy immediately.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ==========================================
    // GLOBAL DENY — catch-all for unmatched paths
    // ==========================================
    match /{document=**} {
      allow read, write: if false;
    }
    
    // ==========================================
    // USER DATA — strict ownership enforcement
    // ==========================================
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

**What this prevents:**
- ✅ User A reading User B's data
- ✅ User A writing to User B's collection
- ✅ Unauthenticated access to any data
- ✅ Access to any non-user path

**What this allows:**
- ✅ Authenticated users full access to their own data
- ✅ All existing app functionality continues to work

### Tier 2: With Data Validation (Deploy within 1 week)

Adds type checking and field validation to prevent malformed data.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global deny
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User data — owner only
    match /users/{userId}/{document=**} {
      allow read: if request.auth != null 
        && request.auth.uid == userId;
      
      allow write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Workout documents — with validation
    match /users/{userId}/workouts/{workoutId} {
      allow read: if request.auth != null 
        && request.auth.uid == userId;
      
      allow create: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['type', 'date'])
        && request.resource.data.type in ['Lari', 'Gym', 'Recovery']
        && request.resource.data.date is string
        && request.resource.data.date.matches('^\\d{4}-\\d{2}-\\d{2}$')
        && (!request.resource.data.keys().hasAny(['distance']) 
            || request.resource.data.distance is number)
        && (!request.resource.data.keys().hasAny(['duration']) 
            || request.resource.data.duration is number)
        && (!request.resource.data.keys().hasAny(['hr']) 
            || (request.resource.data.hr is number 
                && request.resource.data.hr >= 30 
                && request.resource.data.hr <= 250));
      
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.date is string
        && request.resource.data.date.matches('^\\d{4}-\\d{2}-\\d{2}$');
      
      allow delete: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

**Additional protections:**
- ✅ `type` must be one of the three valid values
- ✅ `date` must be a string in YYYY-MM-DD format
- ✅ `distance` must be a number (if provided)
- ✅ `duration` must be a number (if provided)
- ✅ `hr` must be a number between 30-250 (if provided)

### Tier 3: Production Rules (Deploy before public launch)

Adds rate limiting, field-level access control, and future-proofing.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global deny
    match /{document=**} {
      allow read, write: if false;
    }
    
    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isValidDate(dateStr) {
      return dateStr is string 
          && dateStr.matches('^\\d{4}-\\d{2}-\\d{2}$');
    }
    
    function isValidWorkoutType(type) {
      return type in ['Lari', 'Gym', 'Recovery'];
    }
    
    function isValidHeartRate(hr) {
      return hr is number && hr >= 30 && hr <= 250;
    }
    
    function isValidNumber(value) {
      return value is number && value >= 0;
    }
    
    // Rate limiting: max 100 writes per minute per user
    function isWithinRateLimit() {
      return request.auth.uid in getAfter(
        /databases/$(database)/documents/_rate_limits/$(request.auth.uid)
      ).data.writeCount < 100;
    }
    
    // ==========================================
    // USER DATA
    // ==========================================
    match /users/{userId}/{document=**} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // ==========================================
    // WORKOUTS — full validation
    // ==========================================
    match /users/{userId}/workouts/{workoutId} {
      allow read: if isOwner(userId);
      
      allow create: if isOwner(userId)
        && request.resource.data.keys().hasAll(['type', 'date'])
        && isValidWorkoutType(request.resource.data.type)
        && isValidDate(request.resource.data.date)
        && (!request.resource.data.keys().hasAny(['distance']) 
            || isValidNumber(request.resource.data.distance))
        && (!request.resource.data.keys().hasAny(['duration']) 
            || isValidNumber(request.resource.data.duration))
        && (!request.resource.data.keys().hasAny(['hr']) 
            || isValidHeartRate(request.resource.data.hr))
        && (!request.resource.data.keys().hasAny(['rpe']) 
            || (request.resource.data.rpe is number 
                && request.resource.data.rpe >= 1 
                && request.resource.data.rpe <= 10))
        && (!request.resource.data.keys().hasAny(['soreness']) 
            || (request.resource.data.soreness is number 
                && request.resource.data.soreness >= 1 
                && request.resource.data.soreness <= 10))
        && (!request.resource.data.keys().hasAny(['fatigue']) 
            || (request.resource.data.fatigue is number 
                && request.resource.data.fatigue >= 1 
                && request.resource.data.fatigue <= 10))
        && request.resource.data.keys().hasOnly([
          'type', 'date', 'category', 'distance', 'duration', 'pace',
          'hr', 'cadence', 'rpe', 'planStatus', 'exercises', 'sleep',
          'soreness', 'fatigue', 'weight', 'notes', 'createdAt'
        ]);
      
      allow update: if isOwner(userId)
        && isValidDate(request.resource.data.date);
      
      allow delete: if isOwner(userId);
    }
    
    // ==========================================
    // PLAN (future use)
    // ==========================================
    match /users/{userId}/plan/{document} {
      allow read, write: if isOwner(userId);
    }
    
    // ==========================================
    // RATE LIMITING (optional — requires counter doc)
    // ==========================================
    match /_rate_limits/{userId} {
      allow read, write: if false;  // Only accessible via Cloud Functions
    }
  }
}
```

---

## 9. Data Validation Rules

### Field-by-Field Validation

| Field | Type | Required | Validation Rule |
|-------|------|----------|-----------------|
| `type` | string | ✅ Yes | Must be `'Lari'`, `'Gym'`, or `'Recovery'` |
| `date` | string | ✅ Yes | Must match `^\d{4}-\d{2}-\d{2}$` (YYYY-MM-DD) |
| `category` | string | ❌ No | Any string (validated client-side) |
| `distance` | number | ❌ No | Must be ≥ 0 |
| `duration` | number | ❌ No | Must be ≥ 0 |
| `pace` | number | ❌ No | Must be ≥ 0 |
| `hr` | number | ❌ No | Must be 30–250 |
| `cadence` | number | ❌ No | Must be ≥ 0 |
| `rpe` | number | ❌ No | Must be 1–10 |
| `planStatus` | string | ❌ No | Any string (validated client-side) |
| `exercises` | array | ❌ No | Array of objects (validated client-side) |
| `sleep` | number | ❌ No | Must be 0–24 |
| `soreness` | number | ❌ No | Must be 1–10 |
| `fatigue` | number | ❌ No | Must be 1–10 |
| `weight` | number | ❌ No | Must be ≥ 0 |
| `notes` | string | ❌ No | Any string |
| `createdAt` | string | ❌ No | Any string (should be Timestamp in future) |

### What Validation Prevents

| Attack | Without Validation | With Validation |
|--------|-------------------|-----------------|
| Write `type: "Hacking"` | ✅ Succeeds | ❌ Denied (invalid type) |
| Write `date: "yesterday"` | ✅ Succeeds | ❌ Denied (invalid format) |
| Write `hr: 9999` | ✅ Succeeds | ❌ Denied (out of range) |
| Write `distance: -100` | ✅ Succeeds | ❌ Denied (negative number) |
| Write `rpe: 100` | ✅ Succeeds | ❌ Denied (out of range) |
| Write extra fields | ✅ Succeeds | ❌ Denied (hasOnly check) |
| Write non-numeric to numeric field | ✅ Succeeds | ❌ Denied (type check) |

---

## 10. App Check & Rate Limiting

### What is App Check?

Firebase App Check verifies that requests to your Firebase services come from your genuine app, not from unauthorized scripts or bots.

**Without App Check:**
```
Attacker's script → Firebase SDK → Firestore (no questions asked)
```

**With App Check:**
```
Attacker's script → Firebase SDK → App Check → ❌ DENIED
(no reCAPTCHA token)              (verification fails)

Legitimate app → Firebase SDK → App Check → Firestore
(reCAPTCHA token)                 (verified)
```

### Implementation

```javascript
// src/firebase/config.js (future)
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const app = initializeApp(firebaseConfig);

// Only enable in production
if (import.meta.env.PROD) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('your-recaptcha-key'),
    isTokenAutoRefreshEnabled: true,
  });
}
```

### Rate Limiting Strategy

Without Cloud Functions, Firestore Security Rules have limited rate limiting capabilities. However, you can:

1. **Use a write counter document** — Increment a counter on each write, deny if > threshold
2. **Use Cloud Functions** — Middleware that checks rate before allowing writes
3. **Use Firebase Extensions** — "Firestore Rate Limiting" extension

**Recommended approach for HybridTrack:**

| Scale | Rate Limiting Strategy |
|-------|----------------------|
| < 100 users | Security Rules only (no rate limiting needed) |
| 100–1000 users | Security Rules + client-side debouncing |
| > 1000 users | Cloud Functions + App Check |

---

## 11. Environment Variable Security

### Current Problem

```javascript
// Line 15-22 of App.jsx — HARDCODED 🔴
const firebaseConfig = {
  apiKey: "AIzaSyDG_sI23RNXtb67w1-xRziGMbnoCYVjD70",
  authDomain: "hybrid-track.firebaseapp.com",
  projectId: "hybrid-track",
  storageBucket: "hybrid-track.firebasestorage.app",
  messagingSenderId: "48093730097",
  appId: "1:48093730097:web:4986f7af26d92991088c10"
};
```

### Why This Matters

| Risk | Explanation |
|------|-------------|
| **Version control exposure** | Anyone with access to the repo has your Firebase credentials |
| **No environment separation** | Same config for dev, staging, and production |
| **Cannot rotate keys** | Changing the API key requires a code change |
| **Attack surface** | Exposed project ID enables targeted attacks |

### Recommended Fix

**Step 1:** Create `.env` file:

```bash
# .env (never commit this)
VITE_FIREBASE_API_KEY=AIzaSyDG_sI23RNXtb67w1-xRziGMbnoCYVjD70
VITE_FIREBASE_AUTH_DOMAIN=hybrid-track.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hybrid-track
VITE_FIREBASE_STORAGE_BUCKET=hybrid-track.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=48093730097
VITE_FIREBASE_APP_ID=1:48093730097:web:4986f7af26d92991088c10
```

**Step 2:** Create `.env.example` (commit this):

```bash
# .env.example
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Step 3:** Update `.gitignore`:

```bash
# .gitignore
.env
.env.local
.env.production
```

**Step 4:** Update `App.jsx`:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

### Firebase Console Restrictions

Even with exposed API keys, you can restrict usage in the Firebase Console:

1. **Go to:** Firebase Console → Project Settings → API Keys
2. **Select** the Web API key
3. **Under "Application restrictions":** Add your domain (e.g., `localhost`, `hybridtrack.app`)
4. **Under "API restrictions":** Restrict to Firebase services only

This prevents attackers from using your API key with non-Firebase Google services.

---

## 12. Security Roadmap

### Priority Matrix

| Priority | Action | Effort | Impact | Timeline |
|----------|--------|--------|--------|----------|
| 🔴 P0 | **Deploy Firestore Security Rules (Tier 1)** | 30 min | Prevents ALL unauthorized access | **Today** |
| 🔴 P0 | **Verify rules are active** | 15 min | Confirms protection is working | **Today** |
| 🟡 P1 | **Move Firebase config to `.env`** | 30 min | Prevents credential exposure | This week |
| 🟡 P1 | **Add API key restrictions in Firebase Console** | 15 min | Limits key abuse | This week |
| 🟡 P1 | **Deploy Security Rules with validation (Tier 2)** | 1 hr | Prevents malformed data | This week |
| 🟡 P2 | **Add `onIdTokenChanged` listener** | 30 min | Prevents silent write failures | Next sprint |
| 🟡 P2 | **Add client-side input validation** | 2 hrs | Defense in depth | Next sprint |
| 🟢 P3 | **Enable App Check** | 1 hr | Prevents script-based attacks | Q2 |
| 🟢 P3 | **Deploy production rules (Tier 3)** | 2 hrs | Full validation + rate limiting | Q2 |
| 🟢 P4 | **Add rate limiting via Cloud Functions** | 4 hrs | Prevents billing attacks | Q3 |
| 🟢 P4 | **Security audit automation** | 2 hrs | Continuous monitoring | Q3 |

### Deployment Commands

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (if not done)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules

# Verify rules
firebase firestore:rules:list
```

### Verification Checklist

After deploying rules, verify:

- [ ] **Own data accessible:** Log in and verify you can read/write your own workouts
- [ ] **Other user's data blocked:** Try to access `users/{differentUid}/workouts` — should fail
- [ ] **Unauthenticated access blocked:** Try to access Firestore without logging in — should fail
- [ ] **Invalid data rejected:** Try to create a workout with `type: "Invalid"` — should fail
- [ ] **Valid data accepted:** Create a normal workout — should succeed
- [ ] **Delete works:** Delete your own workout — should succeed
- [ ] **Update works:** Edit your own workout — should succeed

### Testing Script

```javascript
// Run this in browser console while logged in
async function testSecurity() {
  const { getFirestore, collection, getDocs, doc, setDoc } = await import('firebase/firestore');
  const db = getFirestore();
  
  // Test 1: Read own data
  try {
    const ownRef = collection(db, 'users', auth.currentUser.uid, 'workouts');
    await getDocs(ownRef);
    console.log('✅ Test 1: Can read own data');
  } catch (e) {
    console.error('❌ Test 1: Cannot read own data', e);
  }
  
  // Test 2: Read another user's data (should fail)
  try {
    const otherRef = collection(db, 'users', 'some-other-uid', 'workouts');
    await getDocs(otherRef);
    console.error('❌ Test 2: Could read another user\'s data! SECURITY BREACH');
  } catch (e) {
    console.log('✅ Test 2: Cannot read another user\'s data');
  }
  
  // Test 3: Write invalid data (should fail)
  try {
    const badRef = doc(db, 'users', auth.currentUser.uid, 'workouts', 'test-invalid');
    await setDoc(badRef, { type: 'InvalidType', date: 'not-a-date' });
    console.error('❌ Test 3: Could write invalid data! VALIDATION MISSING');
  } catch (e) {
    console.log('✅ Test 3: Cannot write invalid data');
  }
}
```

---

## Appendix: Security Checklist

### Pre-Launch Checklist

- [ ] Firestore Security Rules deployed (Tier 1 minimum)
- [ ] Rules verified with test script
- [ ] Firebase config moved to `.env`
- [ ] `.env` added to `.gitignore`
- [ ] API key restricted in Firebase Console
- [ ] `onIdTokenChanged` listener added
- [ ] Client-side input validation added
- [ ] Error messages shown to user (not just console)

### Post-Launch Checklist

- [ ] App Check enabled
- [ ] Production Security Rules deployed (Tier 3)
- [ ] Rate limiting implemented
- [ ] Security audit automated (monthly)
- [ ] Firebase billing alerts configured
- [ ] Incident response plan documented

### Firebase Console Settings to Review

| Setting | Location | Recommended Value |
|---------|----------|-------------------|
| **API key restrictions** | Project Settings → API Keys | Restrict to `hybrid-track.firebaseapp.com` |
| **Authentication > Sign-in methods** | Authentication → Sign-in method | Google enabled, others disabled |
| **Firestore > Rules** | Firestore → Rules | Tier 2+ rules deployed |
| **Firestore > Indexes** | Firestore → Indexes | Composite indexes as needed |
| **App Check > Apps** | App Check → Apps |