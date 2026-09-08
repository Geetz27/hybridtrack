# Progress Dashboard — Design Document

## 1. Data Inventory

### 1.1 Currently Collected Data

| Workout Type | Fields | Optional Fields |
|---|---|---|
| **Lari (Run)** | `type`, `category`, `date`, `distance`, `duration`, `rpe`, `pace` (computed) | `hr`, `cadence`, `notes`, `planStatus` |
| **Gym** | `type`, `category`, `date`, `exercises[]`, `rpe` | `notes` |
| **Gym — Exercise** | `exercise` (name), `sets[]` | — |
| **Gym — Set** | `weight`, `reps` | — |
| **Recovery** | `type`, `date`, `sleep`, `soreness`, `fatigue` | `weight` (body), `notes` |
| **Weekly Plan** | `weekStart`, `weekEnd`, `label`, `days{}` | `planVersion` |

### 1.2 Derived Data (Currently Computed)

| Metric | Source | Computation |
|---|---|---|
| Run pace | `duration / distance` | Computed on submit |
| Gym volume | `sum(weight × reps)` per exercise | Computed in `gymVolume()` |
| Weekly run distance | Filter by current week | `getDashboardSummary()` |
| Weekly gym sessions | Filter by current week | `getDashboardSummary()` |
| Consistency % | Planned vs completed this week | `getDashboardSummary()` |
| Exercise PR | Best weight × reps per exercise | `getGymPRs()` |
| 5K PB | Best pace on 4.9–5.1 km runs | `getRunningProgress()` |
| 30-day avg pace | Distance-weighted avg pace | `getRunningProgress()` |
| HR zone | Based on heart rate | `getHRZone()` |
| Alerts | RPE trends, easy run intensity | `analyzeAlerts()` |

---

## 2. Current Dashboard Gaps

| Gap | Current State | Impact |
|---|---|---|
| **Running volume trend** | Only shows current week total | No month-over-month or year-over-year comparison |
| **Gym volume trend** | Only shows PR per exercise | No total volume trend per session type |
| **Consistency over time** | Only current week | No 4-week or 12-week consistency trend |
| **Recovery insights** | Not shown on dashboard | Sleep, soreness, fatigue data is collected but unused |
| **Body weight trend** | Not shown | Weight data from Recovery logs is unused |
| **HR zone distribution** | Only shown per-run in history | No aggregate HR zone breakdown |
| **Category balance** | Not shown | Push/Pull/Legs ratio not visualized |
| **Plan adherence** | Only weekly consistency % | No per-day adherence tracking |
| **Coach insights** | Basic RPE alerts only | No trend-based recommendations |
| **Goal tracking** | Not implemented | No distance, volume, or frequency goals |

---

## 3. Proposed Dashboard Sections

### 3.1 Overview Hero (Enhanced)

**Current:** `DashboardHero` — shows weekly run distance, gym sessions, consistency %

**Proposed enhancements:**
- Add **30-day trend arrow** (↑↓→) next to each metric
- Add **streak counter** (consecutive days with logged workouts)
- Add **monthly total** toggle (switch between weekly/monthly view)
- Add **comparison** to previous period (e.g., "12% more than last week")

**Data sources:** `workouts[]`, `weeklyPlan`

### 3.2 Running Progress (Enhanced)

**Current:** `RunningProgressCard` — 5K PB, 30D pace, longest run, mini trend chart

**Proposed enhancements:**

| Card | Metrics | Visualization |
|---|---|---|
| **Volume Trend** | Weekly km (last 12 weeks) | Bar chart with 4-week moving average line |
| **Pace Trend** | Pace per run (last 20 runs) | Line chart with trend direction |
| **HR Zone Distribution** | % time in Z1–Z5 (last 30 days) | Stacked horizontal bar |
| **Cadence Analysis** | Avg cadence per run (last 10 runs) | Scatter plot (cadence vs pace) |
| **Long Run Progression** | Longest run per week | Step chart showing progression |
| **Run Type Split** | Easy/Tempo/Interval/Long Run distribution | Pie or donut chart |

**Data sources:** `workouts[]` filtered by `type === 'Lari'`

### 3.3 Gym Progress (Enhanced)

**Current:** `StrengthProgressCard` — best progress exercise, PR list

**Proposed enhancements:**

| Card | Metrics | Visualization |
|---|---|---|
| **Volume Trend** | Weekly total volume (last 12 weeks) | Stacked bar chart by category (Push/Pull/Legs) |
| **Category Balance** | Push/Pull/Legs session count (last 30 days) | Donut chart |
| **Exercise PR Timeline** | PR weight over time per exercise | Multi-line chart (selectable exercises) |
| **Estimated 1RM** | Epley formula: `weight × (1 + reps/30)` | Table with progress indicator |
| **Session RPE Trend** | Avg RPE per session (last 20 sessions) | Bar chart with color coding |
| **Volume per Session** | Total kg per gym session | Bar chart with category coloring |

**Data sources:** `workouts[]` filtered by `type === 'Gym'`

### 3.4 Recovery & Health (New Section)

**Current:** Not shown on dashboard

**Proposed:**

| Card | Metrics | Visualization |
|---|---|---|
| **Sleep Trend** | Avg sleep hours per night (last 30 days) | Line chart with 7-day moving average |
| **Readiness Score** | Composite: `(sleep × 0.4) + ((10-soreness) × 0.3) + ((10-fatigue) × 0.3)` | Gauge (0–100) |
| **Body Weight Trend** | Weight over time (last 90 days) | Line chart with trend line |
| **DOMS Pattern** | Soreness by muscle group (inferred from gym category) | Heat map |

**Data sources:** `workouts[]` filtered by `type === 'Recovery'`, plus `type === 'Gym'` for DOMS inference

### 3.5 Consistency & Adherence (New Section)

**Current:** Single consistency % in hero

**Proposed:**

| Card | Metrics | Visualization |
|---|---|---|
| **Weekly Adherence** | % of planned sessions completed (last 12 weeks) | Bar chart with 80% target line |
| **Streak** | Current streak + longest streak | Number display with fire icon |
| **Missed Pattern** | Days of week most often missed | Heat map (day × week) |
| **Plan vs Actual** | Planned vs completed by day type | Side-by-side bar chart |

**Data sources:** `workouts[]`, `weeklyPlan`

### 3.6 Personal Records (Enhanced)

**Current:** PR list in `ProgressionTracker` tab

**Proposed:**

| Card | Metrics | Visualization |
|---|---|---|
| **All-Time PRs** | Best weight × reps per exercise | Sortable table with date |
| **Recent PRs** | PRs set in last 30 days | Timeline with badges |
| **Estimated 1RM PRs** | Best estimated 1RM per exercise | Table with progress bars |
| **Running PBs** | 5K, 10K, longest distance, best pace | Card with medals |

**Data sources:** `getGymPRs()`, `getRunningProgress()`

### 3.7 Coach Insights (Enhanced)

**Current:** Basic RPE alerts

**Proposed:**

| Insight Type | Trigger | Message |
|---|---|---|
| **Overtraining risk** | 3+ consecutive sessions with RPE ≥ 8 | "⚠️ High RPE trend detected. Consider a deload week." |
| **Stagnation alert** | Exercise weight unchanged for 4+ weeks | "💪 Smith Machine Bench Press hasn't progressed in 4 weeks. Try a double progression." |
| **Volume drop** | Weekly volume drops >20% vs 4-week average | "📉 Volume dropped this week. Check recovery or schedule." |
| **Consistency milestone** | 7, 14, 30, 60, 90 day streak | "🎉 30-day streak! Keep it up!" |
| **Pace improvement** | 5K PB improved | "🏆 New 5K PB! Your training is paying off." |
| **Category imbalance** | One category >60% of gym sessions | "⚖️ Your training is Push-heavy. Consider adding more Pull exercises." |
| **Recovery warning** | Sleep < 6h or readiness < 40 for 3+ days | "😴 Low recovery detected. Prioritize sleep and consider a rest day." |

**Data sources:** All workout data + plan data

---

## 4. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Firestore (source of truth)               │
│  users/{uid}/workouts/{id}   users/{uid}/plan/current       │
└─────────────────────┬───────────────────────┬───────────────┘
                      │                       │
                      ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Client-Side Computation Layer                   │
│                                                              │
│  useMemo(() => computeMetrics(workouts, weeklyPlan),         │
│           [workouts, weeklyPlan])                            │
│                                                              │
│  Functions:                                                  │
│  - getRunningTrends(workouts, weeks)                         │
│  - getGymTrends(workouts, weeks)                             │
│  - getRecoveryTrends(workouts, days)                         │
│  - getConsistency(workouts, weeklyPlan, weeks)               │
│  - getPersonalRecords(workouts)                              │
│  - getCoachInsights(workouts, weeklyPlan)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Components                            │
│                                                              │
│  <Dashboard>                                                 │
│    ├── <OverviewHero />                                      │
│    ├── <RunningSection>                                      │
│    │    ├── <VolumeTrendChart />                             │
│    │    ├── <PaceTrendChart />                               │
│    │    ├── <HRZoneDistribution />                           │
│    │    └── <RunTypeSplit />                                 │
│    ├── <GymSection>                                          │
│    │    ├── <VolumeTrendChart />                             │
│    │    ├── <CategoryBalance />                              │
│    │    ├── <ExercisePRTimeline />                           │
│    │    └── <Estimated1RMTable />                            │
│    ├── <RecoverySection>                                     │
│    │    ├── <SleepTrendChart />                              │
│    │    ├── <ReadinessGauge />                               │
│    │    └── <BodyWeightChart />                              │
│    ├── <ConsistencySection>                                  │
│    │    ├── <WeeklyAdherenceChart />                         │
│    │    ├── <StreakDisplay />                                │
│    │    └── <MissedPatternHeatmap />                         │
│    ├── <PersonalRecords />                                   │
│    └── <CoachInsights />                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Computation Functions

### 5.1 Running Trends

```typescript
interface RunningTrends {
  weeklyVolume: { week: string, km: number }[];           // Last 12 weeks
  paceTrend: { date: string, pace: number, category: string }[]; // Last 20 runs
  hrZones: { zone: string, percentage: number }[];        // Last 30 days
  runTypeSplit: { category: string, count: number, totalKm: number }[];
  longRunProgression: { week: string, distance: number }[];
  cadenceAnalysis: { date: string, cadence: number, pace: number }[];
  best5K: { pace: number, date: string } | null;
  best10K: { pace: number, date: string } | null;
  totalDistance: number;
  averageWeeklyKm: number;                                 // Last 4 weeks
}
```

### 5.2 Gym Trends

```typescript
interface GymTrends {
  weeklyVolume: { week: string, push: number, pull: number, legs: number }[]; // Last 12 weeks
  categoryBalance: { category: string, sessions: number, percentage: number }[];
  exercisePRs: { exercise: string, weight: number, reps: number, date: string, estimated1RM: number }[];
  exerciseTimeline: { exercise: string, data: { date: string, weight: number }[] }[];
  rpeTrend: { date: string, rpe: number, category: string }[];
  totalSessions: number;
  averageWeeklySessions: number;
  totalVolume: number;
}
```

### 5.3 Recovery Trends

```typescript
interface RecoveryTrends {
  sleepTrend: { date: string, hours: number }[];          // Last 30 days
  readinessTrend: { date: string, score: number }[];      // Last 30 days
  bodyWeightTrend: { date: string, weight: number }[];    // Last 90 days
  averageSleep: number;                                    // Last 7 days
  averageReadiness: number;                                // Last 7 days
  domsPattern: { category: string, avgSoreness: number }[];
}
```

### 5.4 Consistency Metrics

```typescript
interface ConsistencyMetrics {
  weeklyAdherence: { week: string, planned: number, completed: number, percentage: number }[];
  currentStreak: number;
  longestStreak: number;
  missedPattern: { dayOfWeek: string, missRate: number }[];
  overallAdherence: number;                                // Last 12 weeks
}
```

### 5.5 Coach Insights

```typescript
interface CoachInsight {
  type: 'warning' | 'achievement' | 'tip' | 'milestone';
  message: string;
  priority: number;                                        // 1 (urgent) to 5 (informational)
  timestamp: Date;
  actionUrl?: string;                                      // Deep link to relevant section
}
```

---

## 6. Visualization Components

### 6.1 Chart Components

| Component | Type | Library | Data Points |
|---|---|---|---|
| `VolumeTrendChart` | Vertical bar + line | Recharts / Chart.js | Up to 12 weeks |
| `PaceTrendChart` | Line chart | Recharts / Chart.js | Up to 20 runs |
| `HRZoneDistribution` | Stacked horizontal bar | Recharts / Chart.js | 5 zones |
| `RunTypeSplit` | Donut chart | Recharts / Chart.js | 4–5 categories |
| `CategoryBalance` | Donut chart | Recharts / Chart.js | 3 categories |
| `ExercisePRTimeline` | Multi-line chart | Recharts / Chart.js | Up to 5 exercises |
| `SleepTrendChart` | Line chart | Recharts / Chart.js | 30 days |
| `ReadinessGauge` | Circular gauge | Custom SVG | 0–100 score |
| `BodyWeightChart` | Line chart | Recharts / Chart.js | 90 days |
| `WeeklyAdherenceChart` | Bar chart with target line | Recharts / Chart.js | 12 weeks |
| `MissedPatternHeatmap` | Calendar heatmap | Custom CSS grid | 7 days × 12 weeks |

### 6.2 Chart Library Recommendation

**Recharts** is recommended because:
- React-native (declarative JSX API)
- Lightweight (~150KB gzipped)
- Good animation support
- Responsive by default
- Already compatible with the existing Tailwind CSS setup

### 6.3 Responsive Layout

```
Desktop (≥768px):                    Mobile (<768px):
┌──────────────────────┐            ┌──────────────────┐
│     Overview Hero    │            │   Overview Hero  │
├──────────┬───────────┤            ├──────────────────┤
│ Running  │   Gym     │            │    Running       │
│ Section  │  Section  │            ├──────────────────┤
│          │           │            │      Gym         │
├──────────┴───────────┤            ├──────────────────┤
│    Recovery Section  │            │    Recovery      │
├──────────────────────┤            ├──────────────────┤
│  Consistency Section │            │  Consistency     │
├──────────┬───────────┤            ├──────────────────┤
│   PRs    │  Insights │            │   PRs & Insights │
└──────────┴───────────┘            └──────────────────┘
```

---

## 7. Implementation Phases

### Phase 1 — Foundation (Week 1)

| Task | Files | Description |
|---|---|---|
| Install Recharts | `package.json` | Add charting library |
| Create `useRunningTrends` hook | `src/hooks/useRunningTrends.js` | Compute running metrics |
| Create `useGymTrends` hook | `src/hooks/useGymTrends.js` | Compute gym metrics |
| Create `useRecoveryTrends` hook | `src/hooks/useRecoveryTrends.js` | Compute recovery metrics |
| Create `useConsistency` hook | `src/hooks/useConsistency.js` | Compute adherence metrics |
| Create `useCoachInsights` hook | `src/hooks/useCoachInsights.js` | Generate insights |

### Phase 2 — Running Section (Week 2)

| Task | Files | Description |
|---|---|---|
| `VolumeTrendChart` | `src/components/charts/VolumeTrendChart.jsx` | Weekly km bar chart |
| `PaceTrendChart` | `src/components/charts/PaceTrendChart.jsx` | Pace line chart |
| `HRZoneDistribution` | `src/components/charts/HRZoneDistribution.jsx` | HR zone stacked bar |
| `RunTypeSplit` | `src/components/charts/RunTypeSplit.jsx` | Run type donut |
| `RunningSection` | `src/components/dashboard/RunningSection.jsx` | Container component |

### Phase 3 — Gym Section (Week 3)

| Task | Files | Description |
|---|---|---|
| `VolumeTrendChart` (gym) | `src/components/charts/GymVolumeChart.jsx` | Stacked bar by category |
| `CategoryBalance` | `src/components/charts/CategoryBalance.jsx` | Donut chart |
| `ExercisePRTimeline` | `src/components/charts/PRTimeline.jsx` | Multi-line chart |
| `Estimated1RMTable` | `src/components/dashboard/Estimated1RMTable.jsx` | Sortable table |
| `GymSection` | `src/components/dashboard/GymSection.jsx` | Container component |

### Phase 4 — Recovery & Consistency (Week 4)

| Task | Files | Description |
|---|---|---|
| `SleepTrendChart` | `src/components/charts/SleepTrendChart.jsx` | Line chart |
| `ReadinessGauge` | `src/components/charts/ReadinessGauge.jsx` | SVG gauge |
| `BodyWeightChart` | `src/components/charts/BodyWeightChart.jsx` | Line chart |
| `WeeklyAdherenceChart` | `src/components/charts/AdherenceChart.jsx` | Bar + target line |
| `StreakDisplay` | `src/components/dashboard/StreakDisplay.jsx` | Streak counter |
| `MissedPatternHeatmap` | `src/components/charts/Heatmap.jsx` | CSS grid heatmap |
| `RecoverySection` | `src/components/dashboard/RecoverySection.jsx` | Container |
| `ConsistencySection` | `src/components/dashboard/ConsistencySection.jsx` | Container |

### Phase 5 — PRs & Insights (Week 5)

| Task | Files | Description |
|---|---|---|
| `PersonalRecords` | `src/components/dashboard/PersonalRecords.jsx` | PR table + timeline |
| `CoachInsights` | `src/components/dashboard/CoachInsights.jsx` | Insight cards |
| Integrate into Dashboard | `src/App.jsx` | Replace existing Dashboard |

---

## 8. Performance Considerations

### 8.1 Computation Optimization

```typescript
// Use useMemo for all computed data
const runningTrends = useMemo(() => getRunningTrends(workouts), [workouts]);
const gymTrends = useMemo(() => getGymTrends(workouts), [workouts]);
const recoveryTrends = useMemo(() => getRecoveryTrends(workouts), [workouts]);
const consistency = useMemo(() => getConsistency(workouts, weeklyPlan), [workouts, weeklyPlan]);
const insights = useMemo(() => getCoachInsights(workouts, weeklyPlan), [workouts, weeklyPlan]);
```

### 8.2 Data Limits

| Computation | Max Data Points | Time Complexity |
|---|---|---|
| Running trends | Last 200 runs | O(n) |
| Gym trends | Last 200 sessions | O(n × m) where m = exercises per session |
| Recovery trends | Last 90 days | O(n) |
| Consistency | Last 12 weeks | O(n + p) where p = plan days |
| Coach insights | All data | O(n) |

### 8.3 Lazy Loading

- Sections below the fold (Recovery, Consistency, PRs, Insights) can use `IntersectionObserver` to defer computation until visible
- Charts can use `React.lazy` + `Suspense` for code splitting

---

## 9. Data Export & Sharing

### 9.1 Export Options

| Format | Content | Use Case |
|---|---|---|
| **PNG/SVG** | Chart screenshots | Share on social media |
| **PDF** | Full dashboard report | Share with coach |
| **CSV** | Raw data tables | Import into spreadsheet |
| **JSON** | Full workout data | Backup / migrate |

### 9.2 Sharing

- Generate shareable link with read-only view
- Coach access via Firebase custom claims
- Public profile (opt-in) with limited metrics

---

## 10. Success Metrics

| Metric | Current | Target |
|---|---|---|
| Dashboard load time | ~200ms (no charts) | <500ms (with charts) |
| Insights shown per visit | 0–2 alerts | 3–5 actionable insights |
| User engagement (time on dashboard) | ~30s | >60s |
| Data points visualized | ~5 metrics | >20 metrics |
| Chart rendering time | N/A | <200ms |

---

## 11. File Structure

```
src/
├── hooks/
│   ├── useRunningTrends.js
│   ├── useGymTrends.js
│   ├── useRecoveryTrends.js
│   ├── useConsistency.js
│   └── useCoachInsights.js
├── components/
│   ├── charts/
│   │   ├── VolumeTrendChart.jsx
│   │   ├── PaceTrendChart.jsx
│   │   ├── HRZoneDistribution.jsx
│   │   ├── RunTypeSplit.jsx
│   │   ├── GymVolumeChart.jsx
│   │   ├── CategoryBalance.jsx
│   │   ├── PRTimeline.jsx
│   │   ├── SleepTrendChart.jsx
│   │   ├── ReadinessGauge.jsx
│   │   ├── BodyWeightChart.jsx
│   │   ├── AdherenceChart.jsx
│   │   └── Heatmap.jsx
│   └── dashboard/
│       ├── OverviewHero.jsx
│       ├── RunningSection.jsx
│       ├── GymSection.jsx
│       ├── RecoverySection.jsx
│       ├── ConsistencySection.jsx
│       ├── PersonalRecords.jsx
│       └── CoachInsights.jsx
├── utils/
│   ├── running.js
│   ├── gym.js
│   ├── recovery.js
│   ├── consistency.js
│   └── insights.js
└── App.jsx
```
