# HybridTrack — Development Guide

> How to set up, run, and contribute to HybridTrack.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Environment Variables](#3-environment-variables)
4. [Firebase Setup](#4-firebase-setup)
5. [Running Locally](#5-running-locally)
6. [Project Structure](#6-project-structure)
7. [Folder Conventions](#7-folder-conventions)
8. [Coding Standards](#8-coding-standards)
9. [Component Patterns](#9-component-patterns)
10. [State Management](#10-state-management)
11. [Firestore Patterns](#11-firestore-patterns)
12. [Testing](#12-testing)
13. [Building for Production](#13-building-for-production)
14. [Deployment](#14-deployment)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥ 18.x | JavaScript runtime |
| **npm** | ≥ 9.x | Package manager |
| **Git** | ≥ 2.x | Version control |
| **Firebase CLI** | ≥ 13.x | Firebase deployment (optional for local dev) |
| **VS Code** | Latest | Recommended editor |

### Recommended VS Code Extensions

| Extension | Purpose |
|-----------|---------|
| **Tailwind CSS IntelliSense** | Tailwind class autocomplete |
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **GitLens** | Git history/blame |
| **Error Lens** | Inline error display |

### Verify Installation

```bash
node --version   # Should be ≥ 18.x
npm --version    # Should be ≥ 9.x
git --version    # Should be ≥ 2.x
```

---

## 2. Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd hybridtrack

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your Firebase credentials (see Section 3)

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5173
```

**That's it.** The app should be running at `http://localhost:5173`.

---

## 3. Environment Variables

### Required Variables

Create a `.env` file in the project root:

```bash
# .env
VITE_FIREBASE_API_KEY=AIzaSyDG_sI23RNXtb67w1-xRziGMbnoCYVjD70
VITE_FIREBASE_AUTH_DOMAIN=hybrid-track.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hybrid-track
VITE_FIREBASE_STORAGE_BUCKET=hybrid-track.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=48093730097
VITE_FIREBASE_APP_ID=1:48093730097:web:4986f7af26d92991088c10
```

### How Variables Are Used

In `src/App.jsx`, environment variables are accessed via Vite's `import.meta.env`:

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

### Naming Convention

- All environment variables must be prefixed with `VITE_` (Vite requirement)
- Use `SCREAMING_SNAKE_CASE`
- Group related variables with a common prefix (e.g., `VITE_FIREBASE_*`)

### .env Files

| File | Purpose | Committed? |
|------|---------|------------|
| `.env` | Local development | ❌ No (in `.gitignore`) |
| `.env.example` | Template for new developers | ✅ Yes |
| `.env.production` | Production build | ❌ No |

### Adding a New Environment Variable

1. Add to `.env` with `VITE_` prefix
2. Add to `.env.example` with placeholder value
3. Access via `import.meta.env.VITE_YOUR_VAR`
4. Document in this section

---

## 4. Firebase Setup

### Project Overview

HybridTrack uses the following Firebase services:

| Service | Usage | Required? |
|---------|-------|-----------|
| **Firebase Auth** | Google Sign-In | ✅ Required |
| **Cloud Firestore** | Workout data storage | ✅ Required |
| **Firebase Storage** | Not currently used | ❌ Optional |
| **Firebase Hosting** | Not currently used | ❌ Optional |
| **Cloud Functions** | Not currently used | ❌ Optional |

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name (e.g., "hybrid-track")
4. Disable Google Analytics (optional)
5. Click **Create project**

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication → Sign-in method**
2. Enable **Google** provider
3. Add your support email
4. Click **Save**

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development — deploy security rules before production)
4. Select a region (e.g., `asia-southeast2` for Jakarta)
5. Click **Enable**

### Step 4: Register Your Web App

1. In Firebase Console, go to **Project Settings → General → Your apps**
2. Click **Add app → Web**
3. Register app with nickname (e.g., "hybrid-track-web")
4. Copy the `firebaseConfig` object
5. Paste values into your `.env` file

### Step 5: Deploy Security Rules

**Before going to production**, deploy Firestore Security Rules:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore in project
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for the recommended rules.

### Firestore Data Structure

```
/users/{uid}/workouts/{docId}
  ├── type: "Lari" | "Gym" | "Recovery"
  ├── date: "2026-06-23" (string, YYYY-MM-DD)
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
  └── createdAt: "1748000000000" (string — timestamp)
```

---

## 5. Running Locally

### Development Server

```bash
# Start with hot-reload
npm run dev

# Start on a specific port
npm run dev -- --port 3000

# Start with network access (for mobile testing)
npm run dev -- --host
```

The app will be available at:
- Local: `http://localhost:5173`
- Network: `http://<your-ip>:5173`

### Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Mobile Testing

To test on your phone:

1. Run `npm run dev -- --host` (enables network access)
2. Find your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. On your phone, open `http://<your-ip>:5173`
4. Both devices must be on the same network

---

## 6. Project Structure

### Current Structure

```
hybridtrack/
├── public/                  # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/                     # Application source
│   ├── App.jsx              # Main application (2694 lines — to be refactored)
│   ├── App.css              # Legacy styles (unused)
│   ├── index.css            # Tailwind directives
│   ├── main.jsx             # React entry point
│   └── assets/              # Empty directory
├── dist-check/              # Pre-built output (should not be in repo)
├── .gitignore
├── index.html               # HTML entry point
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── eslint.config.js
├── README.md
├── PROJECT_OVERVIEW.md
├── PRIORITY_FIXES.md
├── FIREBASE_AUDIT.md
├── CODE_HEALTH_REPORT.md
├── REFACTOR_PLAN.md
├── PRODUCT_ROADMAP.md
├── SECURITY_AUDIT.md
└── DEVELOPMENT_GUIDE.md     # ← You are here
```

### Target Structure (After Refactoring)

See [REFACTOR_PLAN.md](./REFACTOR_PLAN.md#5-recommended-file-structure) for the complete target architecture.

```
src/
├── main.jsx
├── index.css
├── App.jsx                    # ~80-100 lines (orchestrator only)
├── firebase/
│   ├── config.js
│   ├── auth.js
│   └── db.js
├── utils/
│   ├── constants.js
│   ├── format.js
│   ├── gym.js
│   ├── run.js
│   ├── analytics.js
│   └── coach.js
├── hooks/
│   ├── useAuth.js
│   ├── useWorkouts.js
│   └── useWeeklyPlan.js
├── context/
│   └── AppContext.jsx
├── components/
│   ├── ui/
│   │   ├── InputField.jsx
│   │   ├── SelectField.jsx
│   │   ├── SliderField.jsx
│   │   ├── Toast.jsx
│   │   └── LoadingScreen.jsx
│   ├── NavButton.jsx
│   ├── MiniTrend.jsx
│   ├── BarChart.jsx
│   ├── HRZoneBadge.jsx
│   ├── ExerciseField.jsx
│   ├── EditModal.jsx
│   ├── ExportModal.jsx
│   ├── CoachAlert.jsx
│   ├── NextSessionCard.jsx
│   ├── TodayPlanCard.jsx
│   ├── DashboardHero.jsx
│   ├── HeroMetric.jsx
│   ├── StrengthProgressCard.jsx
│   ├── RunningProgressCard.jsx
│   ├── ProgressMetric.jsx
│   └── RunMetric.jsx
└── pages/
    ├── Dashboard.jsx
    ├── QuickInput.jsx
    ├── History.jsx
    ├── WeeklyPlanTab.jsx
    ├── ProgressionTracker.jsx
    └── PerformanceTicker.jsx
```

---

## 7. Folder Conventions

### Directory Naming

| Directory | Convention | Example |
|-----------|------------|---------|
| `src/` | Always lowercase | `src/` |
| `src/components/` | Lowercase, plural | `components/` |
| `src/components/ui/` | Lowercase, `ui/` for primitives | `components/ui/` |
| `src/pages/` | Lowercase, plural | `pages/` |
| `src/utils/` | Lowercase, plural | `utils/` |
| `src/hooks/` | Lowercase, plural | `hooks/` |
| `src/context/` | Lowercase, singular | `context/` |
| `src/firebase/` | Lowercase, singular | `firebase/` |

### File Naming

| File Type | Convention | Example |
|-----------|------------|---------|
| **React components** | PascalCase | `DashboardHero.jsx` |
| **Utility functions** | camelCase | `formatPace.js` |
| **Custom hooks** | camelCase with `use` prefix | `useWorkouts.js` |
| **Constants** | camelCase | `constants.js` |
| **Context** | PascalCase | `AppContext.jsx` |
| **CSS** | lowercase | `index.css` |
| **Config** | lowercase | `vite.config.js` |

### File Organization Rules

1. **One component per file** — Each `.jsx` file should export exactly one component
2. **Group by feature** — Related components go in the same directory
3. **UI primitives** — Generic, reusable components go in `components/ui/`
4. **Page components** — Top-level route components go in `pages/`
5. **Pure functions** — Non-React logic goes in `utils/`
6. **Firebase logic** — All Firebase interaction goes in `firebase/`

### Import Order

Within each file, imports should be grouped in this order:

```javascript
// 1. React and third-party libraries
import React, { useState, useMemo } from 'react';
import { Activity, Dumbbell } from 'lucide-react';

// 2. Firebase
import { getFirestore, collection } from 'firebase/firestore';

// 3. Custom hooks
import { useAuth } from '../hooks/useAuth';

// 4. Components
import NavButton from '../components/NavButton';
import InputField from '../components/ui/InputField';

// 5. Utilities
import { formatPace } from '../utils/format';
import { EXERCISE_COLORS } from '../utils/constants';

// 6. Assets (rare)
import logo from '../assets/logo.svg';
```

---

## 8. Coding Standards

### JavaScript/React Style

| Rule | Standard | Example |
|------|----------|---------|
| **Quotes** | Single quotes | `'hello'` not `"hello"` |
| **Semicolons** | Required | `const x = 1;` |
| **Indentation** | 2 spaces | Not tabs |
| **Line length** | 100 characters max | Break long lines |
| **Trailing commas** | ES5 (objects, arrays) | `{ a: 1, }` |
| **Arrow functions** | Prefer over `function` | `const fn = () => {}` |
| **Destructuring** | Prefer for props | `function Card({ title, children })` |
| **Optional chaining** | Use for nested access | `user?.name` |
| **Nullish coalescing** | Use for defaults | `value ?? 'default'` |

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| **Components** | PascalCase | `function DashboardHero()` |
| **Functions** | camelCase | `function formatPace()` |
| **Variables** | camelCase | `const workoutCount` |
| **Constants** | UPPER_SNAKE_CASE | `const MAX_SETS = 4` |
| **Booleans** | Prefix with `is`, `has`, `should` | `isLoading`, `hasError` |
| **Event handlers** | Prefix with `handle` | `handleAddData` |
| **Props** | camelCase | `onClick`, `activeTab` |
| **State setters** | `set` + PascalCase | `setWorkouts` |
| **Custom hooks** | `use` + camelCase | `useWorkouts` |

### Component Structure

Every component should follow this structure:

```javascript
// 1. Imports
import React, { useState, useMemo } from 'react';

// 2. PropTypes / default props (optional)
const propTypes = { ... };

// 3. Component function
export default function ComponentName({ prop1, prop2 }) {
  // 3a. State hooks
  const [state, setState] = useState(initialValue);
  
  // 3b. Memoized values
  const computed = useMemo(() => computeValue(), [deps]);
  
  // 3c. Effects
  useEffect(() => {
    // side effects
  }, [deps]);
  
  // 3d. Event handlers
  const handleClick = () => { ... };
  
  // 3e. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### JSX Rules

1. **Self-closing tags** for components without children: `<NavButton />`
2. **Multi-line JSX** wrapped in parentheses:
   ```javascript
   return (
     <div className="container">
       <Child />
     </div>
   );
   ```
3. **Conditional rendering** using ternary or `&&`:
   ```javascript
   {isLoading ? <Spinner /> : <Content />}
   {showError && <Error message={error} />}
   ```
4. **Lists** always have a `key` prop:
   ```javascript
   {items.map(item => <Item key={item.id} data={item} />)}
   ```
5. **Event handlers** defined as functions, not inline arrows (for performance):
   ```javascript
   // ✅ Good
   const handleChange = (e) => setValue(e.target.value);
   <input onChange={handleChange} />
   
   // ❌ Avoid (creates new function on every render)
   <input onChange={(e) => setValue(e.target.value)} />
   ```

### Tailwind CSS Conventions

1. **Use Tailwind classes exclusively** — No custom CSS unless absolutely necessary
2. **Class order** — Follow a consistent order:
   ```
   Layout → Flex/Grid → Spacing → Size → Typography → Background → Border → Effects
   ```
   Example:
   ```javascript
   <div className="
     flex items-center justify-between   // layout
     px-4 py-3                            // spacing
     w-full h-12                          // size
     text-sm font-bold                    // typography
     bg-white                             // background
     border border-gray-200 rounded-xl    // border
     shadow-sm                            // effects
   ">
   ```
3. **Custom colors** use the project's palette:
   - Primary: `#14B8A6` (teal-500)
   - Secondary: `#8B5CF6` (violet-500)
   - Background: `#F5F7F9`
   - Text: `#0F172A` (slate-900)
   - Border: `#CBD5E1` (slate-300)
   - Muted: `#94A3B8` (slate-400)

### Comment Style

```javascript
// Single line comment for simple explanations

/**
 * Multi-line comment for complex logic
 * @param {number} durationMin - Duration in minutes
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted pace string
 */
function formatPace(durationMin, distanceKm) {
  // ...
}
```

---

## 9. Component Patterns

### Presentational Component

A component that only renders UI based on props:

```javascript
export default function HeroMetric({ label, value, unit, icon: Icon }) {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-xl">
      <div className="p-2 rounded-lg bg-[#99F6E4]/20">
        <Icon className="w-5 h-5 text-[#14B8A6]" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
          {label}
        </p>
        <p className="text-lg font-bold text-[#0F172A]">
          {value}
          <span className="text-xs font-medium text-[#64748B] ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}
```

### Container Component

A component that manages state and passes data to presentational components:

```javascript
export default function Dashboard({ workouts, weeklyPlan }) {
  const summary = useMemo(() => getDashboardSummary(workouts), [workouts]);
  const alerts = useMemo(() => analyzeAlerts(workouts), [workouts]);
  
  return (
    <div>
      <DashboardHero summary={summary} />
      {alerts.map(alert => <CoachAlert key={alert.id} alert={alert} />)}
    </div>
  );
}
```

### Form Component

A component that handles user input:

```javascript
export default function InputField({ label, type, value, onChange, placeholder }) {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div>
      <label htmlFor={inputId} className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3.5 text-[#0F172A] text-sm focus:outline-none transition-colors placeholder:text-[#94A3B8]"
      />
    </div>
  );
}
```

### Modal Component

A component that renders as an overlay:

```javascript
export default function EditModal({ workout, onClose, onSave }) {
  const [formData, setFormData] = useState(workout);
  
  const handleSave = () => {
    onSave(formData);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
        {/* Content */}
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}
```

---

## 10. State Management

### Current Approach

The app currently uses React's built-in state management:

| State | Location | Type |
|-------|----------|------|
| `user` | `App.jsx` | `useState` |
| `workouts` | `App.jsx` | `useState` (synced with Firestore) |
| `weeklyPlan` | `App.jsx` | `useState` |
| `activeTab` | `App.jsx` | `useState` |
| `toast` | `App.jsx` | `useState` |
| Component-level state | Various | `useState` |

### Future Approach (Post-Refactor)

After the refactor (see [REFACTOR_PLAN.md](./REFACTOR_PLAN.md#10-phase-5-state--data-layer)), state will be managed via:

1. **React Context** (`AppContext`) — Shared global state
2. **Custom hooks** — Encapsulated logic
3. **`useState`** — Component-local state
4. **`useMemo`** — Derived/computed values

### When to Use Each Pattern

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Context** | Global state shared by many components | `user`, `workouts` |
| **Custom hook** | Reusable stateful logic | `useAuth`, `useWorkouts` |
| **`useState`** | Component-local state | `activeTab`, `toast` |
| **`useMemo`** | Derived data from state | `summary`, `filteredWorkouts` |
| **`useEffect`** | Side effects (Firestore sync) | `onSnapshot` listener |

### Rules for State

1. **Minimize global state** — Only put truly shared state in Context
2. **Derive, don't duplicate** — Use `useMemo` instead of storing computed values
3. **Keep state close** — If only one component uses it, keep it local
4. **No prop drilling** — Use Context for deeply nested props
5. **Immutable updates** — Always create new objects/arrays, never mutate

---

## 11. Firestore Patterns

### Reading Data

```javascript
// Real-time listener (current approach)
useEffect(() => {
  if (!user) return;
  const workoutsRef = collection(db, 'users', user.uid, 'workouts');
  const unsubscribe = onSnapshot(workoutsRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkouts(data);
  });
  return () => unsubscribe();
}, [user]);
```

### Writing Data

```javascript
// Create
const handleAddData = async (newData) => {
  if (!user) return;
  const newId = Date.now().toString();
  const docRef = doc(db, 'users', user.uid, 'workouts', newId);
  await setDoc(docRef, { ...newData, createdAt: newId });
};

// Update (merge)
const handleEdit = async (id, updatedData) => {
  if (!user) return;
  const docRef = doc(db, 'users', user.uid, 'workouts', id.toString());
  await setDoc(docRef, updatedData, { merge: true });
};

// Delete
const handleDelete = async (id) => {
  if (!user) return;
  await deleteDoc(doc(db, 'users', user.uid, 'workouts', id.toString()));
};
```

### Best Practices

1. **Always check `user` before Firestore operations** — Prevent errors when user is null
2. **Use `merge: true` for updates** — Prevents overwriting existing fields
3. **Handle errors gracefully** — Show user-friendly error messages, not just `console.error`
4. **Clean up listeners** — Return the unsubscribe function from `useEffect`
5. **Limit data** — Use `.limit()` and date filtering for large datasets

### Security Rules

Before any Firestore operation, the Security Rules verify:

```javascript
// User can only access their own data
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for complete rules.

---

## 12. Testing

### Current State

HybridTrack currently has **no automated tests**. Testing is done manually by running the app and verifying functionality.

### Testing Strategy (Future)

| Test Type | Tool | Coverage |
|-----------|------|----------|
| **Unit tests** | Vitest | Utility functions, helpers |
| **Component tests** | React Testing Library | Individual components |
| **Integration tests** | React Testing Library | Page-level flows |
| **E2E tests** | Playwright | Critical user journeys |

### Manual Testing Checklist

Before committing, verify:

- [ ] App loads without errors
- [ ] Google Sign-In works
- [ ] All 4 tabs render correctly
- [ ] Can add a Run workout
- [ ] Can add a Gym workout
- [ ] Can add a Recovery entry
- [ ] Can edit a workout
- [ ] Can delete a workout
- [ ] Dashboard shows correct stats
- [ ] History shows all workouts
- [ ] Weekly plan renders and can be edited
- [ ] ProgressionTracker shows data
- [ ] PerformanceTicker shows data
- [ ] No console errors

---

## 13. Building for Production

### Build Command

```bash
npm run build
```

This creates a `dist/` directory with the production build.

### Preview Build

```bash
npm run preview
```

This serves the production build locally for testing.

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js      # Main JS bundle
│   └── index-abc123.css     # CSS bundle
└── favicon.svg
```

### Bundle Size Optimization

| Technique | Current Size | Target Size |
|-----------|-------------|-------------|
| **Code splitting** (lazy loading pages) | ~500 KB | ~150 KB initial |
| **Tree shaking** (remove unused imports) | Already applied | — |
| **Compression** (gzip via hosting) | ~150 KB gzipped | ~50 KB gzipped |

---

## 14. Deployment

### Option 1: Firebase Hosting (Recommended)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize hosting
firebase init hosting

# 4. Build
npm run build

# 5. Deploy
firebase deploy --only hosting
```

### Option 2: Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
```

### Option 3: Netlify

```bash
# 1. Build
npm run build

# 2. Deploy via Netlify CLI or drag-and-drop dist/ folder
npx netlify deploy --prod --dir=dist
```

### Environment Variables in Production

For Vercel/Netlify, set environment variables in the platform dashboard:

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Your project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `VITE_FIREBASE_APP_ID` | Your app ID |

---

## 15. Troubleshooting

### Common Issues

#### "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT"

**Cause:** Browser is blocking the Google Sign-In popup.

**Fix:** Allow popups for the site, or use `signInWithRedirect` instead of `signInWithPopup`.

---

#### "FirebaseError: Missing or insufficient permissions"

**Cause:** Firestore Security Rules are blocking the request.

**Fix:** 
1. Check your Security Rules in Firebase Console
2. Ensure rules allow `request.auth.uid == userId`
3. For development, temporarily use test mode rules

---

#### "Module not found: Can't resolve 'firebase/app'"

**Cause:** Firebase SDK not installed.

**Fix:**
```bash
npm install firebase
```

---

#### "Error: ENOENT: no such file or directory"

**Cause:** Missing `.env` file or environment variables.

**Fix:**
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

---

#### App loads but shows blank screen

**Cause:** JavaScript error in the app (likely the `formatDateID()` crash bug).

**Fix:** Check browser console for errors. The `formatDateID()` function is called but not defined — see [PRIORITY_FIXES.md](./PRIORITY_FIXES.md).

---

#### Firestore reads are very slow

**Cause:** Loading all workouts without filtering.

**Fix:** Add `.limit(200)` and date range filtering to the Firestore query.

---

#### "Quota exceeded" error

**Cause:** Firestore free tier limit reached (50,000 reads/day).

**Fix:**
1. Add query limits (see [FIREBASE_AUDIT.md](./FIREBASE_AUDIT.md#4-query-efficiency-analysis))
2. Upgrade to Blaze plan if needed

---

### Getting Help

| Resource | Location |
|----------|----------|
| **Project documentation** | `*.md` files in project root |
| **Firebase docs** | [firebase.google.com/docs](https://firebase.google.com/docs) |
| **Tailwind CSS docs** | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| **Vite docs** | [vitejs.dev](https://vitejs.dev) |
| **React docs** | [react.dev](https://react.dev) |

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*