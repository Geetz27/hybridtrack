# Dashboard Implementation Plan

## Widget Ranking Methodology

Each widget is scored on three dimensions:

| Dimension | Scale | Definition |
|---|---|---|
| **User Value** | 1 (low) – 5 (high) | How frequently would a user check this? How actionable is the insight? |
| **Implementation Effort** | 1 (easy) – 5 (hard) | Complexity of computation, visualization, and integration |
| **Data Availability** | 1 (missing) – 5 (ready) | Is the data already collected and structured? |

**Priority Score = (User Value × Data Availability) / Implementation Effort**

Higher score = ship sooner.

---

## 1. Full Widget Ranking

### Tier 1 — MVP (Score ≥ 6.0)

| Rank | Widget | User Value | Effort | Data Avail. | Score | Rationale |
|---|---|---|---|---|---|---|
| 1 | **Streak Display** | 5 | 1 | 5 | **25.0** | Motivational, trivial to compute (just sort dates), no chart library needed |
| 2 | **All-Time PRs** | 5 | 1 | 5 | **25.0** | Already computed in `getGymPRs()`, just needs better UI presentation |
| 3 | **Running PBs** | 5 | 1 | 5 | **25.0** | Already computed in `getRunningProgress()`, just needs better UI |
| 4 | **Overview Hero (enhanced)** | 5 | 2 | 5 | **12.5** | Already exists, just add trend arrows + streak + monthly toggle |
| 5 | **Weekly Adherence** | 4 | 2 | 4 | **8.0** | High value for coach oversight, plan data already in Firestore |
| 6 | **Category Balance** | 4 | 2 | 5 | **10.0** | Simple donut chart, gym data already has category field |
| 7 | **Volume Trend (Running)** | 4 | 3 | 5 | **6.7** | Bar chart with 12 weeks of data, distance already collected |
| 8 | **Volume Trend (Gym)** | 4 | 3 | 5 | **6.7** | Stacked bar, volume already computed in `gymVolume()` |
| 9 | **Coach Insights — Consistency milestone** | 4 | 1 | 5 | **20.0** | Trivial — check streak length, send message |
| 10 | **Coach Insights — Overtraining risk** | 5 | 2 | 4 | **10.0** | High value, RPE data already collected |

### Tier 2 — Phase 2 (Score 3.0 – 5.9)

| Rank | Widget | User Value | Effort | Data Avail. | Score | Rationale |
|---|---|---|---|---|---|---|
| 11 | **Pace Trend** | 4 | 3 | 4 | **5.3** | Line chart, pace already computed, but needs filtering |
| 12 | **Run Type Split** | 3 | 2 | 5 | **7.5** | Donut chart, category field already exists |
| 13 | **Estimated 1RM Table** | 4 | 3 | 4 | **5.3** | Epley formula is simple, but needs exercise grouping |
| 14 | **Session RPE Trend** | 3 | 2 | 4 | **6.0** | Bar chart, RPE already collected for all workout types |
| 15 | **Coach Insights — Stagnation alert** | 4 | 3 | 3 | **4.0** | Needs historical comparison per exercise |
| 16 | **Coach Insights — Volume drop** | 4 | 3 | 3 | **4.0** | Needs 4-week rolling average computation |
| 17 | **Coach Insights — Pace improvement** | 3 | 2 | 4 | **6.0** | Simple comparison of best 5K pace |
| 18 | **Sleep Trend** | 3 | 3 | 3 | **3.0** | Recovery data collected but sparse for most users |
| 19 | **Readiness Score Gauge** | 3 | 3 | 3 | **3.0** | Composite score, needs all recovery fields |
| 20 | **Long Run Progression** | 3 | 3 | 4 | **4.0** | Step chart, needs weekly grouping |

### Tier 3 — Future (Score < 3.0)

| Rank | Widget | User Value | Effort | Data Avail. | Score | Rationale |
|---|---|---|---|---|---|---|
| 21 | **HR Zone Distribution** | 3 | 4 | 2 | **1.5** | HR data is optional, sparse for most users |
| 22 | **Cadence Analysis** | 2 | 4 | 2 | **1.0** | Cadence data is optional, needs scatter plot |
| 23 | **Body Weight Trend** | 3 | 3 | 2 | **2.0** | Weight data is optional in Recovery logs |
| 24 | **DOMS Pattern** | 2 | 4 | 2 | **1.0** | Needs inference from gym category, complex |
| 25 | **Missed Pattern Heatmap** | 3 | 4 | 3 | **2.3** | Complex heatmap visualization |
| 26 | **Plan vs Actual** | 3 | 4 | 3 | **2.3** | Needs day-by-day plan comparison |
| 27 | **Exercise PR Timeline** | 4 | 4 | 3 | **3.0** | Multi-line chart, needs exercise name matching |
| 28 | **Recent PRs Timeline** | 3 | 3 | 3 | **3.0** | Timeline visualization, moderate effort |
| 29 | **Volume per Session** | 2 | 3 | 4 | **2.7** | Redundant with Volume Trend |
| 30 | **Coach Insights — Category imbalance** | 3 | 3 | 3 | **3.0** | Needs threshold logic |
| 31 | **Coach Insights — Recovery warning** | 3 | 3 | 2 | **2.0** | Recovery data sparse |

---

## 2. MVP Dashboard (Tier 1 — Ship in Week 1-2)

### MVP Widgets

```
┌──────────────────────────────────────┐
│         OVERVIEW HERO (Enhanced)      │
│  🏃 45km this week ↑12%   🔥 12-day  │
│  🏋️ 4 sessions this week  ✓ 85%      │
├──────────────────────────────────────┤
│                                      │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  Running     │  │    Gym      │   │
│  │  Volume      │  │   Volume    │   │
│  │  Trend       │  │   Trend     │   │
│  │  [bar chart] │  │ [stacked]   │   │
│  └─────────────┘  └─────────────┘   │
│                                      │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  Category    │  │  Weekly     │   │
│  │  Balance     │  │  Adherence  │   │
│  │  [donut]     │  │  [bar]      │   │
│  └─────────────┘  └─────────────┘   │
│                                      │
├──────────────────────────────────────┤
│         PERSONAL RECORDS             │
│  🏆 Gym PRs:                         │
│  Bench Press: 80kg×8  (12 Jun)      │
│  Squat: 100kg×6     (10 Jun)        │
│  Deadlift: 120kg×5  (8 Jun)         │
│                                      │
│  🏃 Running PBs:                     │
│  5K: 22:30  (5 Jun)                 │
│  10K: 48:15  (1 Jun)                │
├──────────────────────────────────────┤
│         COACH INSIGHTS               │
│  🔥 12-day streak! Keep it up!      │
│  ⚠️ High RPE trend detected.        │
│  🏆 New 5K PB! 22:30                │
└──────────────────────────────────────┘
```

### MVP Implementation Order

| Step | Task | Files | Depends On | Est. Time |
|---|---|---|---|---|
| 1 | **Install Recharts** | `package.json` | None | 5 min |
| 2 | **Enhance Overview Hero** | `src/components/dashboard/OverviewHero.jsx` | None | 2 hrs |
| 3 | **Add Streak Display** | `src/components/dashboard/StreakDisplay.jsx` | Step 2 | 1 hr |
| 4 | **Create Running Volume Trend** | `src/components/charts/VolumeTrendChart.jsx` | Step 1 | 3 hrs |
| 5 | **Create Gym Volume Trend** | `src/components/charts/GymVolumeChart.jsx` | Step 1 | 3 hrs |
| 6 | **Create Category Balance** | `src/components/charts/CategoryBalance.jsx` | Step 1 | 2 hrs |
| 7 | **Create Weekly Adherence** | `src/components/charts/AdherenceChart.jsx` | Step 1 | 3 hrs |
| 8 | **Enhance Personal Records** | `src/components/dashboard/PersonalRecords.jsx` | None (uses existing `getGymPRs`) | 2 hrs |
| 9 | **Add Running PBs** | `src/components/dashboard/PersonalRecords.jsx` | None (uses existing `getRunningProgress`) | 1 hr |
| 10 | **Create Coach Insights** | `src/components/dashboard/CoachInsights.jsx` | Steps 3, 8, 9 | 3 hrs |
| 11 | **Integrate into Dashboard** | `src/App.jsx` | All above | 2 hrs |

**Total MVP effort: ~22 hours (3 days)**

### MVP Data Flow

```javascript
// App.jsx — minimal changes
import { OverviewHero, StreakDisplay, PersonalRecords, CoachInsights } from './components/dashboard';
import { VolumeTrendChart, GymVolumeChart, CategoryBalance, AdherenceChart } from './components/charts';

function Dashboard({ workouts, weeklyPlan }) {
  const streak = useMemo(() => computeStreak(workouts), [workouts]);
  const runningVolume = useMemo(() => getWeeklyRunningVolume(workouts, 12), [workouts]);
  const gymVolume = useMemo(() => getWeeklyGymVolume(workouts, 12), [workouts]);
  const categoryBalance = useMemo(() => getCategoryBalance(workouts), [workouts]);
  const adherence = useMemo(() => getAdherence(workouts, weeklyPlan, 12), [workouts, weeklyPlan]);
  const prs = useMemo(() => ({
    gym: getGymPRs(workouts),
    running: getRunningProgress(workouts)
  }), [workouts]);
  const insights = useMemo(() => getInsights(workouts, streak, prs), [workouts, streak, prs]);

  return (
    <div className="space-y-6">
      <OverviewHero workouts={workouts} weeklyPlan={weeklyPlan} streak={streak} />
      <StreakDisplay current={streak.current} longest={streak.longest} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VolumeTrendChart data={runningVolume} unit="km" title="Running Volume" />
        <GymVolumeChart data={gymVolume} title="Gym Volume" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryBalance data={categoryBalance} />
        <AdherenceChart data={adherence} />
      </div>
      <PersonalRecords gymPRs={prs.gym} runningPBs={prs.running} />
      <CoachInsights insights={insights} />
    </div>
  );
}
```

---

## 3. Tier 2 — Phase 2 (Ship in Week 3-4)

### Widgets

| Widget | Est. Time | Prerequisites |
|---|---|---|
| Pace Trend Chart | 4 hrs | Recharts installed |
| Run Type Split (donut) | 2 hrs | Recharts installed |
| Estimated 1RM Table | 3 hrs | Exercise data grouped |
| Session RPE Trend | 3 hrs | RPE data filtered |
| Sleep Trend Chart | 4 hrs | Recovery data available |
| Readiness Score Gauge | 4 hrs | Custom SVG component |
| Long Run Progression | 3 hrs | Weekly grouping logic |
| Coach Insights — Stagnation | 3 hrs | Exercise history |
| Coach Insights — Volume drop | 2 hrs | 4-week rolling avg |
| Coach Insights — Pace improvement | 1 hr | PR comparison |

**Total Phase 2 effort: ~29 hours (4 days)**

---

## 4. Tier 3 — Future (Ship in Week 5+)

### Widgets

| Widget | Est. Time | Blockers |
|---|---|---|
| HR Zone Distribution | 5 hrs | HR data adoption low |
| Cadence Analysis | 4 hrs | Cadence data adoption low |
| Body Weight Trend | 3 hrs | Weight data adoption low |
| DOMS Pattern | 5 hrs | Needs inference logic |
| Missed Pattern Heatmap | 6 hrs | Complex CSS grid |
| Plan vs Actual | 5 hrs | Day-by-day comparison |
| Exercise PR Timeline | 6 hrs | Multi-line chart, name matching |
| Recent PRs Timeline | 4 hrs | Timeline component |
| Volume per Session | 2 hrs | Redundant with Volume Trend |
| Coach Insights — Category imbalance | 2 hrs | Threshold logic |
| Coach Insights — Recovery warning | 3 hrs | Recovery data sparse |

**Total Phase 3 effort: ~45 hours (6 days)**

---

## 5. Dependency Graph

```
Install Recharts
       │
       ▼
┌──────────────┐
│ Overview Hero│───► Streak Display ──┐
│ (enhanced)   │                      │
└──────────────┘                      │
       │                              │
       ├──► Volume Trend (Run) ──────┤
       │                              │
       ├──► Volume Trend (Gym) ──────┤
       │                              │
       ├──► Category Balance ────────┤
       │                              │
       ├──► Weekly Adherence ────────┤
       │                              │
       ├──► Personal Records ────────┤
       │                              │
       └──► Running PBs ─────────────┤
                                      │
                                      ▼
                              ┌──────────────┐
                              │Coach Insights │
                              └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │  Integrate    │
                              │  into App.jsx │
                              └──────────────┘
```

---

## 6. File Creation Order

```
Week 1 (MVP):
  src/
  ├── components/
  │   ├── charts/
  │   │   ├── VolumeTrendChart.jsx      (Step 4)
  │   │   ├── GymVolumeChart.jsx        (Step 5)
  │   │   ├── CategoryBalance.jsx       (Step 6)
  │   │   └── AdherenceChart.jsx        (Step 7)
  │   └── dashboard/
  │       ├── OverviewHero.jsx          (Step 2 — replace existing)
  │       ├── StreakDisplay.jsx         (Step 3)
  │       ├── PersonalRecords.jsx       (Steps 8, 9)
  │       └── CoachInsights.jsx         (Step 10)
  └── utils/
      ├── streak.js                     (Step 3)
      ├── adherence.js                  (Step 7)
      └── insights.js                   (Step 10)

Week 3-4 (Phase 2):
  src/
  ├── components/
  │   ├── charts/
  │   │   ├── PaceTrendChart.jsx
  │   │   ├── RunTypeSplit.jsx
  │   │   ├── SleepTrendChart.jsx
  │   │   ├── ReadinessGauge.jsx
  │   │   └── LongRunProgression.jsx
  │   └── dashboard/
  │       ├── Estimated1RMTable.jsx
  │       └── RpeTrendChart.jsx
  └── utils/
      ├── running.js
      ├── gym.js
      └── recovery.js

Week 5+ (Phase 3):
  src/
  ├── components/
  │   ├── charts/
  │   │   ├── HRZoneDistribution.jsx
  │   │   ├── BodyWeightChart.jsx
  │   │   ├── Heatmap.jsx
  │   │   └── PRTimeline.jsx
  │   └── dashboard/
  │       ├── PlanVsActual.jsx
  │       └── RecentPRs.jsx
  └── utils/
      ├── consistency.js
      └── doms.js
```

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Recharts bundle size too large | Low | Medium | Use dynamic import + code splitting |
| Computation slow for users with 500+ workouts | Medium | Medium | Limit to last 200 workouts, use Web Worker if needed |
| Plan data missing for adherence calculation | Medium | High | Default to 100% if no plan exists |
| Recovery data too sparse for meaningful charts | High | Low | Show "Start logging recovery" CTA instead of empty chart |
| HR/cadence data adoption low | High | Low | Deprioritize HR/cadence widgets to Tier 3 |
| Chart responsiveness on mobile | Low | Medium | Recharts is responsive by default, test on 375px viewport |

---

## 8. Success Criteria for MVP

| Criterion | Measurement | Target |
|---|---|---|
| MVP ships within 3 days | Calendar days | ≤ 3 |
| All MVP widgets render without errors | Console errors | 0 |
| Dashboard load time | Lighthouse | < 500ms |
| User can see streak at a glance | Visual confirmation | Streak visible above fold |
| User can see PRs without navigating to another tab | Visual confirmation | PRs visible on scroll |
| Coach Insights show at least 1 insight | Data-driven | ≥ 1 insight for users with >5 workouts |
| No regression in existing functionality | Manual test | All existing tabs work |
