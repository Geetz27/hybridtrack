# HybridTrack — Product Roadmap

> 20 features ranked by ROI, with impact scores, development effort, and revenue potential.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Current State Assessment](#2-current-state-assessment)
3. [Feature Ranking Methodology](#3-feature-ranking-methodology)
4. [The 20 Features (Ranked by ROI)](#4-the-20-features-ranked-by-roi)
5. [Feature Details](#5-feature-details)
6. [Revenue Model](#6-revenue-model)
7. [Competitive Landscape](#7-competitive-landscape)
8. [Quarterly Roadmap](#8-quarterly-roadmap)
9. [Risk Analysis](#9-risk-analysis)
10. [Success Metrics](#10-success-metrics)

---

## 1. Product Vision

### Mission Statement

> *"Make hybrid training (running + gym) effortless to track, insightful to analyze, and satisfying to improve."*

### Target Audience

| Segment | Description | Size (est.) | Willingness to Pay |
|---------|-------------|-------------|-------------------|
| **Hybrid athletes** | Runners who also lift, triathletes, CrossFitters | ~5M globally | High |
| **Recreational runners** | Casual runners who do occasional gym work | ~20M globally | Medium |
| **Gym-goers** | Lifters who do occasional cardio | ~15M globally | Low-Medium |
| **Coaches** | Personal trainers managing multiple athletes | ~500K globally | High |

### Current Positioning

- **Strengths:** Clean UI, hybrid-specific (not just running OR gym), Indonesian localization, coach alerts
- **Weaknesses:** Single-user only, no social features, no offline mode, no data export (PDF is broken), no mobile app
- **Opportunities:** Growing hybrid training trend, underserved market (most apps are running-only or gym-only)
- **Threats:** Strava (running), Hevy/Strong (gym), TrainingPeaks (coaching), Apple Health (aggregation)

---

## 2. Current State Assessment

### What Works Well

- ✅ Clean, modern UI with Tailwind CSS
- ✅ Real-time Firestore sync
- ✅ Google Sign-In (easy onboarding)
- ✅ Hybrid-specific (run + gym + recovery in one app)
- ✅ Weekly plan with auto-fill
- ✅ Coach alerts (basic AI-driven insights)
- ✅ Indonesian language support
- ✅ Exercise PR tracking
- ✅ Performance ticker (Run Pulse chart)

### What's Missing or Broken

| # | Gap | Severity | User Impact |
|---|-----|----------|-------------|
| 1 | **No mobile app** (PWA or native) | 🔴 Critical | Mobile users = 80% of fitness app users |
| 2 | **No offline mode** | 🔴 Critical | Gym has poor signal; app is unusable offline |
| 3 | **No data export** (PDF export is broken) | 🟡 High | Users can't share progress with coaches |
| 4 | **No social features** | 🟡 High | No leaderboards, challenges, or sharing |
| 5 | **No coach/athlete mode** | 🟡 Medium | Can't work with a personal trainer |
| 6 | **No body measurements tracking** | 🟡 Medium | Weight tracking is basic; no body fat, photos |
| 7 | **No nutrition tracking** | 🟡 Medium | Can't log meals alongside workouts |
| 8 | **No Apple Health / Google Fit sync** | 🟡 Medium | Manual data entry is tedious |
| 9 | **No wearable integration** | 🟡 Medium | No Garmin, Coros, Apple Watch, or Whoop sync |
| 10 | **No workout templates/sharing** | 🟢 Low | Can't share workout plans with friends |

---

## 3. Feature Ranking Methodology

### Scoring Rubric

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **User Value** | 30% | How much does this improve the user's experience? |
| **Retention Impact** | 20% | Will this make users come back more often? |
| **Acquisition Potential** | 15% | Will this attract new users? |
| **Revenue Potential** | 15% | Can this be monetized directly or indirectly? |
| **Development Effort** | -20% | How hard is this to build? (inverse weight) |

### Scoring Scale

| Score | Meaning |
|-------|---------|
| 10 | Game-changing feature |
| 8-9 | Major improvement |
| 5-7 | Meaningful improvement |
| 3-4 | Nice-to-have |
| 1-2 | Minor polish |

### ROI Calculation

```
ROI = (User Value × 0.30) + (Retention × 0.20) + (Acquisition × 0.15) + (Revenue × 0.15) - (Effort × 0.20)
```

---

## 4. The 20 Features (Ranked by ROI)

| Rank | Feature | User Value | Retention | Acquisition | Revenue | Effort | **ROI Score** | Timeline |
|------|---------|-----------|-----------|-------------|---------|--------|---------------|----------|
| 1 | **Offline Mode (PWA)** | 9 | 9 | 7 | 5 | 3 | **6.50** | Q1 |
| 2 | **Apple Health / Google Fit Sync** | 9 | 8 | 8 | 4 | 3 | **6.35** | Q1 |
| 3 | **Workout Templates Library** | 8 | 8 | 7 | 6 | 3 | **6.20** | Q1 |
| 4 | **Coach/Athlete Mode** | 9 | 9 | 8 | 10 | 7 | **5.95** | Q2 |
| 5 | **Body Measurements Tracking** | 7 | 7 | 5 | 4 | 2 | **5.55** | Q1 |
| 6 | **Data Export (CSV/PDF)** | 7 | 5 | 4 | 3 | 2 | **5.00** | Q1 |
| 7 | **Monthly/Weekly Progress Reports** | 8 | 8 | 5 | 5 | 4 | **5.00** | Q2 |
| 8 | **Social Challenges** | 7 | 9 | 9 | 6 | 7 | **4.95** | Q3 |
| 9 | **Wearable Integration (Garmin/Coros)** | 8 | 7 | 7 | 5 | 6 | **4.70** | Q2 |
| 10 | **AI Training Plan Generator** | 9 | 9 | 9 | 8 | 9 | **4.65** | Q3 |
| 11 | **Nutrition Logging** | 7 | 7 | 6 | 5 | 6 | **4.35** | Q3 |
| 12 | **Native Mobile App (React Native)** | 9 | 8 | 8 | 7 | 9 | **4.30** | Q4 |
| 13 | **Dark Mode** | 6 | 4 | 3 | 2 | 1 | **4.25** | Q1 |
| 14 | **Leaderboards (Friends)** | 5 | 7 | 7 | 4 | 5 | **4.10** | Q3 |
| 15 | **In-App Coaching Marketplace** | 7 | 8 | 9 | 10 | 10 | **3.95** | Q4 |
| 16 | **Race Predictor (based on training data)** | 7 | 6 | 6 | 4 | 5 | **3.90** | Q2 |
| 17 | **Goal Setting & Milestones** | 6 | 7 | 4 | 3 | 4 | **3.85** | Q2 |
| 18 | **Community Forum / Groups** | 5 | 6 | 7 | 5 | 6 | **3.70** | Q3 |
| 19 | **Gamification (Badges, Streaks)** | 5 | 7 | 4 | 3 | 5 | **3.50** | Q2 |
| 20 | **Multi-Language Support** | 4 | 3 | 6 | 3 | 4 | **3.20** | Q4 |

---

## 5. Feature Details

### #1 — Offline Mode (PWA)

| Field | Value |
|-------|-------|
| **ROI Score** | 6.50 |
| **User Value** | 9/10 |
| **Effort** | 3/10 (moderate) |
| **Revenue** | 5/10 (retention-driven) |

**Description:** Convert the web app into a Progressive Web App (PWA) with service worker caching. Users can log workouts offline, and data syncs when connectivity returns.

**Why #1:**
- 80% of fitness tracking happens on mobile
- Gyms notoriously have poor cellular signal
- Users currently cannot open the app without internet
- PWA is ~10× cheaper than a native app

**Implementation:**
- Add service worker with Workbox
- Cache Firestore data locally using `enableIndexedDbPersistence`
- Queue writes when offline, flush when online
- Add `manifest.json` for "Add to Home Screen"
- ~2 weeks of development

**Revenue Impact:** Indirect — increases daily active users by ~40%, which enables premium subscription upsells.

---

### #2 — Apple Health / Google Fit Sync

| Field | Value |
|-------|-------|
| **ROI Score** | 6.35 |
| **User Value** | 9/10 |
| **Effort** | 3/10 |
| **Revenue** | 4/10 |

**Description:** Automatically import runs, heart rate, steps, and body weight from Apple Health (iOS) and Google Fit (Android). Eliminate manual data entry for runs.

**Why #2:**
- Manual data entry is the #1 reason fitness apps fail
- Most users already track runs with Apple Watch or Wear OS
- Auto-sync creates a "set it and forget it" experience
- Significantly reduces friction for daily logging

**Implementation:**
- Use `@capacitor/health` for cross-platform health data access
- Map HealthKit data types to HybridTrack fields
- One-way sync (Health → HybridTrack) initially
- Background fetch every 30 minutes
- ~2 weeks of development

**Revenue Impact:** High retention feature. Users who auto-sync have 3× higher 30-day retention.

---

### #3 — Workout Templates Library

| Field | Value |
|-------|-------|
| **ROI Score** | 6.20 |
| **User Value** | 8/10 |
| **Effort** | 3/10 |
| **Revenue** | 6/10 |

**Description:** Curated library of hybrid training templates (e.g., "5K Training + Push/Pull/Legs", "Marathon Base + Full Body"). Users can browse, save, and apply templates to their weekly plan.

**Why #3:**
- New users don't know how to structure hybrid training
- Templates reduce the "blank page" problem
- Creates a content moat (hard for competitors to replicate)
- Can be monetized as premium templates

**Implementation:**
- Create template schema in Firestore
- Build template browser with categories (Beginner, Intermediate, Advanced)
- "Apply to my plan" button copies template into user's weekly plan
- Allow community-submitted templates (moderated)
- ~2 weeks of development

**Revenue Impact:** 20% of users will pay for premium templates. $2.99/template or $4.99/month for unlimited.

---

### #4 — Coach/Athlete Mode

| Field | Value |
|-------|-------|
| **ROI Score** | 5.95 |
| **User Value** | 9/10 |
| **Effort** | 7/10 |
| **Revenue** | 10/10 |

**Description:** Coaches can create training plans, assign workouts, and monitor athlete compliance. Athletes see their coach's plan and log workouts that the coach can review.

**Why #4:**
- Highest revenue potential (coaches will pay $20-50/month)
- Creates a B2B revenue stream alongside B2C
- Coaches bring 10-50 athletes each (network effect)
- TrainingPeaks charges $13/month for athletes + $25/month for coaches

**Implementation:**
- Multi-tenant Firestore structure: `coaches/{coachId}/athletes/{athleteId}`
- Coach dashboard with compliance view
- Athlete invitation system (email + code)
- Workout approval/rejection flow
- Messaging between coach and athlete
- ~6-8 weeks of development

**Revenue Impact:** $25/month per coach + $8/month per athlete. Target: 100 coaches × $25 + 500 athletes × $8 = **$6,500/month MRR**.

---

### #5 — Body Measurements Tracking

| Field | Value |
|-------|-------|
| **ROI Score** | 5.55 |
| **User Value** | 7/10 |
| **Effort** | 2/10 |
| **Revenue** | 4/10 |

**Description:** Track weight, body fat %, waist/hip/chest measurements, and progress photos. View trends over time with charts.

**Why #5:**
- Natural companion to workout tracking
- Users want to see body composition changes, not just performance
- Very low effort to implement
- Progress photos are highly shareable (viral potential)

**Implementation:**
- Extend existing Recovery form with measurement fields
- Add measurement history chart (reuse MiniTrend component)
- Progress photo gallery with side-by-side comparison
- ~1 week of development

**Revenue Impact:** Feature that justifies premium tier. Lock progress photos behind subscription.

---

### #6 — Data Export (CSV/PDF)

| Field | Value |
|-------|-------|
| **ROI Score** | 5.00 |
| **User Value** | 7/10 |
| **Effort** | 2/10 |
| **Revenue** | 3/10 |

**Description:** Export all workout data to CSV (for analysis) or PDF (for sharing with coaches/doctors). Fix the currently broken PDF export.

**Why #6:**
- Currently broken (see PRIORITY_FIXES.md)
- Users need data portability for trust
- Coaches require export to review athlete progress
- Low effort, high trust-building value

**Implementation:**
- Fix existing ExportModal component
- Add CSV export using `papaparse` or manual CSV generation
- Add PDF export using `jspdf` or browser print-to-PDF
- Date range filter for exports
- ~3-5 days of development

**Revenue Impact:** Trust feature. Not directly monetizable, but essential for premium tier credibility.

---

### #7 — Monthly/Weekly Progress Reports

| Field | Value |
|-------|-------|
| **ROI Score** | 5.00 |
| **User Value** | 8/10 |
| **Effort** | 4/10 |
| **Revenue** | 5/10 |

**Description:** Auto-generated weekly and monthly training reports with key metrics: total volume, total distance, PRs, consistency score, and trend analysis.

**Why #7:**
- Users love seeing their progress summarized
- Shareable reports drive word-of-mouth acquisition
- "Consistency score" is a unique metric (gamification)
- Can be delivered via email (re-engagement)

**Implementation:**
- Build report generation engine (aggregate workouts by period)
- Create report template with charts and key metrics
- Email delivery via Firebase Extensions (Trigger Email)
- In-app report viewer
- ~3-4 weeks of development

**Revenue Impact:** Premium feature. $4.99/month for detailed reports + email delivery.

---

### #8 — Social Challenges

| Field | Value |
|-------|-------|
| **ROI Score** | 4.95 |
| **User Value** | 7/10 |
| **Effort** | 7/10 |
| **Revenue** | 6/10 |

**Description:** Create or join challenges (e.g., "Run 100km in April", "10 gym sessions this month"). Compete with friends on leaderboards.

**Why #8:**
- Challenges drive daily engagement (FOMO)
- Social features create network effects
- Strava's challenges are their most engaging feature
- Can be sponsored by brands (revenue opportunity)

**Implementation:**
- Challenge creation flow (name, goal type, duration, invite)
- Real-time progress tracking during challenge
- Push notifications for milestones
- Leaderboard with friends and global
- ~6-8 weeks of development

**Revenue Impact:** Brand-sponsored challenges (Nike, Adidas) = $5K-20K per campaign. Premium challenges for subscribers.

---

### #9 — Wearable Integration (Garmin/Coros)

| Field | Value |
|-------|-------|
| **ROI Score** | 4.70 |
| **User Value** | 8/10 |
| **Effort** | 6/10 |
| **Revenue** | 5/10 |

**Description:** Sync runs from Garmin Connect, Coros, and Suunto watches. Import GPS data, heart rate, cadence, and elevation.

**Why #9:**
- Serious runners use Garmin/Coros, not phone apps
- Auto-import eliminates manual run entry
- Richer data (GPS maps, elevation, HR zones)
- Competitive advantage over gym-only apps

**Implementation:**
- Use each platform's API (Garmin Health API, Coros API)
- OAuth flow for each platform
- Background sync every 60 minutes
- Map view for imported runs
- ~4-6 weeks of development

**Revenue Impact:** Premium feature. $5.99/month for wearable sync.

---

### #10 — AI Training Plan Generator

| Field | Value |
|-------|-------|
| **ROI Score** | 4.65 |
| **User Value** | 9/10 |
| **Effort** | 9/10 |
| **Revenue** | 8/10 |

**Description:** Users input their goal (e.g., "sub-20 5K", "100kg bench press"), current fitness level, and available days. AI generates a personalized 4-12 week training plan.

**Why #10:**
- Highest user value — solves "what should I do today?"
- Personalization at scale (no human coach needed)
- Strong differentiator from competitors
- High willingness to pay for personalized plans

**Implementation:**
- Define training plan schema (phases, weeks, days, workouts)
- Build plan generation algorithm (rule-based initially, ML later)
- User onboarding flow (goal, level, equipment, days)
- Plan adjustment based on user feedback
- Integration with weekly plan tab
- ~8-10 weeks of development

**Revenue Impact:** $9.99/plan or $7.99/month subscription. Target: 5% conversion rate.

---

### #11 — Nutrition Logging

| Field | Value |
|-------|-------|
| **ROI Score** | 4.35 |
| **User Value** | 7/10 |
| **Effort** | 6/10 |
| **Revenue** | 5/10 |

**Description:** Log meals, track macros (protein/carbs/fat), and see daily calorie totals alongside workout data.

**Why #11:**
- Nutrition is 70% of fitness results
- Users want a single app for all fitness tracking
- MyFitnessPal is bloated and ad-heavy
- Opportunity for a clean, simple nutrition tracker

**Implementation:**
- Food database (USDA API or Open Food Facts)
- Barcode scanner for packaged foods
- Meal templates (save frequent meals)
- Macro goals and daily progress
- ~6-8 weeks of development

**Revenue Impact:** Premium feature. $4.99/month for macro tracking + barcode scanner.

---

### #12 — Native Mobile App (React Native)

| Field | Value |
|-------|-------|
| **ROI Score** | 4.30 |
| **User Value** | 9/10 |
| **Effort** | 9/10 |
| **Revenue** | 7/10 |

**Description:** Full native mobile app for iOS and Android built with React Native. Push notifications, background sync, widget support.

**Why #12:**
- PWA has limitations (no push notifications on iOS, no widgets)
- Native app feels more premium
- App Store visibility drives organic acquisition
- Enables monetization via in-app purchases

**Implementation:**
- Port existing React code to React Native
- Reuse all utility functions and Firebase logic
- Build native UI components (replacing Tailwind)
- App Store and Play Store deployment
- ~10-12 weeks of development

**Revenue Impact:** $2.99/month subscription via in-app purchase. App Store visibility = 30% more downloads.

---

### #13 — Dark Mode

| Field | Value |
|-------|-------|
| **ROI Score** | 4.25 |
| **User Value** | 6/10 |
| **Effort** | 1/10 |
| **Revenue** | 2/10 |

**Description:** System-aware dark mode toggle. All UI components have dark variants.

**Why #13:**
- Very low effort (Tailwind has built-in dark mode support)
- Users expect it in 2026
- Better for gym use (bright screens in dark gyms are annoying)
- Quick win with high visibility

**Implementation:**
- Add `darkMode: 'class'` to tailwind.config.js
- Add `dark:` variants to all Tailwind classes
- Theme toggle in settings
- Persist preference in localStorage
- ~3-5 days of development

**Revenue Impact:** Minimal. But essential for premium feel.

---

### #14 — Leaderboards (Friends)

| Field | Value |
|-------|-------|
| **ROI Score** | 4.10 |
| **User Value** | 5/10 |
| **Effort** | 5/10 |
| **Revenue** | 4/10 |

**Description:** Friend-based leaderboards for weekly distance, volume, and consistency. See how you rank among your friends.

**Why #14:**
- Friendly competition drives engagement
- Friend invites drive acquisition
- Low effort relative to full social features

**Implementation:**
- Friend system (search by email, request/accept)
- Weekly leaderboard computation
- In-app notifications for leaderboard changes
- ~3-4 weeks of development

**Revenue Impact:** Engagement feature. Increases DAU by ~20%.

---

### #15 — In-App Coaching Marketplace

| Field | Value |
|-------|-------|
| **ROI Score** | 3.95 |
| **User Value** | 7/10 |
| **Effort** | 10/10 |
| **Revenue** | 10/10 |

**Description:** Marketplace where certified coaches can list their services. Users browse coaches, read reviews, and purchase coaching plans.

**Why #15:**
- Highest revenue potential (30% commission on coaching)
- Creates a two-sided marketplace
- Coaches bring their own clients
- Scalable revenue without proportional support costs

**Implementation:**
- Coach onboarding and verification
- Coach profile pages with reviews
- Payment processing (Stripe Connect)
- Messaging and session scheduling
- Commission tracking and payouts
- ~12-16 weeks of development

**Revenue Impact:** 30% commission on $50-200/month coaching plans. Target: 50 coaches × 10 athletes × $100 avg × 30% = **$15,000/month MRR**.

---

### #16 — Race Predictor

| Field | Value |
|-------|-------|
| **ROI Score** | 3.90 |
| **User Value** | 7/10 |
| **Effort** | 5/10 |
| **Revenue** | 4/10 |

**Description:** Based on recent training data, predict race times for common distances (5K, 10K, half marathon, marathon). Show probability of achieving goal time.

**Why #16:**
- Highly engaging for runners
- Uses existing data (no extra input needed)
- Unique feature (most predictors require manual input)
- Drives goal-setting behavior

**Implementation:**
- Implement VDOT or similar running performance model
- Use recent race efforts and training paces as input
- Show predicted times with confidence intervals
- "What if" scenarios (what if I train 4×/week instead of 3×?)
- ~3-4 weeks of development

**Revenue Impact:** Premium feature. $2.99/month for race predictor + training paces.

---

### #17 — Goal Setting & Milestones

| Field | Value |
|-------|-------|
| **ROI Score** | 3.85 |
| **User Value** | 6/10 |
| **Effort** | 4/10 |
| **Revenue** | 3/10 |

**Description:** Set specific goals (e.g., "Run 500km this year", "Bench press 80kg by June"). Track progress with milestone celebrations.

**Why #17:**
- Goals drive long-term engagement
- Milestone celebrations are highly shareable
- Creates a "reason to come back"

**Implementation:**
- Goal creation flow (type, target, deadline)
- Progress bar for each goal
- Push notification on milestone achievement
- Shareable achievement cards
- ~2-3 weeks of development

**Revenue Impact:** Engagement feature. Increases 90-day retention by ~15%.

---

### #18 — Community Forum / Groups

| Field | Value |
|-------|-------|
| **ROI Score** | 3.70 |
| **User Value** | 5/10 |
| **Effort** | 6/10 |
| **Revenue** | 5/10 |

**Description:** Topic-based forums and private groups for hybrid athletes. Share workouts, ask questions, and find training partners.

**Why #18:**
- Community creates stickiness
- User-generated content improves SEO
- Groups can be monetized (premium groups)

**Implementation:**
- Forum categories (Training, Nutrition, Gear, etc.)
- Thread creation and replies
- Private groups with invite
- Content moderation tools
- ~5-6 weeks of development

**Revenue Impact:** Premium groups ($4.99/month for exclusive content). Community increases overall retention.

---

### #19 — Gamification (Badges, Streaks)

| Field | Value |
|-------|-------|
| **ROI Score** | 3.50 |
| **User Value** | 5/10 |
| **Effort** | 5/10 |
| **Revenue** | 3/10 |

**Description:** Badges for achievements (e.g., "7-day streak", "100km month", "First PR"). Streak tracking with recovery days.

**Why #19:**
- Streaks are proven to drive daily engagement (Duolingo)
- Badges create shareable moments
- Low effort relative to engagement impact

**Implementation:**
- Badge definitions and trigger logic
- Streak computation (allow recovery days)
- Badge display on profile
- Push notification for streak milestones
- ~3-4 weeks of development

**Revenue Impact:** Engagement feature. Streaks increase DAU by ~25%.

---

### #20 — Multi-Language Support

| Field | Value |
|-------|-------|
| **ROI Score** | 3.20 |
| **User Value** | 4/10 |
| **Effort** | 4/10 |
| **Revenue** | 3/10 |

**Description:** Support for English, Indonesian (current), and additional languages. i18n framework for easy translation.

**Why #20:**
- Opens new markets (English-speaking countries = 10× larger market)
- Indonesian market is currently served well
- English version needed for global growth

**Implementation:**
- Add `react-i18next` for internationalization
- Extract all strings to translation files
- English translation (complete rewrite of current Indonesian UI)
- Language switcher in settings
- ~3-4 weeks of development

**Revenue Impact:** Enables global expansion. English version could 5× the addressable market.

---

## 6. Revenue Model

### Tiered Subscription

| Tier | Price | Features | Target Conversion |
|------|-------|----------|-------------------|
| **Free** | $0 | Basic tracking, weekly plan, basic analytics | 100% |
| **Premium** | $4.99/month | Progress reports, data export, dark mode, body measurements, goal setting | 8-12% |
| **Pro** | $9.99/month | AI plan generator, race predictor, wearable sync, nutrition logging, challenges | 3-5% |
| **Coach** | $24.99/month | Coach dashboard, athlete management, plan creation, messaging | 0.5-1% |

### Revenue Projections

| Year | Users | Free | Premium (10%) | Pro (4%) | Coach (0.5%) | **Monthly Revenue** | **Annual Revenue** |
|------|-------|------|---------------|----------|--------------|---------------------|--------------------|
| 1 | 5,000 | 4,275 | 500 | 200 | 25 | **$5,750** | **$69,000** |
| 2 | 25,000 | 21,375 | 2,500 | 1,000 | 125 | **$28,750** | **$345,000** |
| 3 | 100,000 | 85,500 | 10,000 | 4,000 | 500 | **$115,000** | **$1,380,000** |

### Additional Revenue Streams

| Stream | Description | Est. Monthly |
|--------|-------------|-------------|
| **Premium templates** | $2.99/template or $4.99/month unlimited | $500-2,000 |
| **Branded challenges** | Nike/Adidas sponsored challenges | $5,000-20,000 |
| **Coaching marketplace** | 30% commission on coaching plans | $5,000-50,000 |
| **Affiliate partnerships** | Gear recommendations (commission) | $500-2,000 |

---

## 7. Competitive Landscape

### Direct Competitors

| App | Strengths | Weaknesses | HybridTrack Advantage |
|-----|-----------|------------|----------------------|
| **Strava** | Massive community, segments, challenges | Running-focused, weak gym tracking | Better hybrid support |
| **TrainingPeaks** | Best coaching platform, structured plans | Expensive, dated UI, no gym tracking | Modern UI, hybrid focus |
| **Hevy** | Best gym tracking UI, social features | No running, no plans | Running + gym in one app |
| **Strong** | Simple gym tracking, Apple Watch app | No running, no plans, stagnant | Active development, hybrid |
| **MyFitnessPal** | Nutrition database, barcode scanner | Bloated, ads, no workout tracking | Clean, focused experience |

### Market Positioning

```
                    GYM-FOCUSED
                        │
                        │
              Hevy ●    │    ● Strong
                        │
                        │
    RUNNING-FOCUSED ────┼──── HYBRID
                        │
              Strava ●  │    ● HybridTrack (target)
                        │
                        │
              Garmin ●  │    ● TrainingPeaks
                        │
                        │
                   COACH-FOCUSED
```

**HybridTrack's unique position:** The only app that serves both runners and gym-goers equally, with a modern UI and coach-friendly features.

---

## 8. Quarterly Roadmap

### Q1 2026 (Current Quarter) — Foundation

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|-------------|
| P0 | 🔴 Fix `formatDateID()` crash bug | 1 day | None |
| P0 | 🔴 Deploy Firestore Security Rules | 1 day | None |
| P1 | 🟡 Offline Mode (PWA) | 2 weeks | None |
| P1 | 🟡 Apple Health / Google Fit Sync | 2 weeks | PWA |
| P1 | 🟡 Workout Templates Library | 2 weeks | None |
| P2 | 🟢 Body Measurements Tracking | 1 week | None |
| P2 | 🟢 Data Export (CSV/PDF) | 1 week | None |
| P2 | 🟢 Dark Mode | 1 week | None |

**Q1 Goal:** Fix critical bugs, enable offline usage, reduce data entry friction.

### Q2 2026 — Engagement

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|-------------|
| P1 | 🟡 Monthly/Weekly Progress Reports | 3 weeks | Q1 templates |
| P1 | 🟡 Wearable Integration (Garmin/Coros) | 5 weeks | Q1 Health sync |
| P1 | 🟡 Goal Setting & Milestones | 2 weeks | None |
| P2 | 🟢 Race Predictor | 3 weeks | Q1 Health sync |
| P2 | 🟢 Gamification (Badges, Streaks) | 3 weeks | None |

**Q2 Goal:** Increase retention with progress reports, goals, and gamification.

### Q3 2026 — Growth

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|-------------|
| P1 | 🟡 AI Training Plan Generator | 8 weeks | Q2 reports |
| P1 | 🟡 Social Challenges | 6 weeks | None |
| P2 | 🟢 Leaderboards (Friends) | 3 weeks | Q3 challenges |
| P2 | 🟢 Nutrition Logging | 6 weeks | None |
| P2 | 🟢 Community Forum / Groups | 5 weeks | None |

**Q3 Goal:** Drive acquisition with AI plans, social features, and community.

### Q4 2026 — Monetization

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|-------------|
| P1 | 🟡 Coach/Athlete Mode | 7 weeks | Q3 AI plans |
| P1 | 🟡 Native Mobile App (React Native) | 10 weeks | All previous |
| P2 | 🟢 In-App Coaching Marketplace | 12 weeks | Q4 coach mode |
| P2 | 🟢 Multi-Language Support | 3 weeks | None |

**Q4 Goal:** Launch monetization with coach mode, native app, and marketplace.

---

## 9. Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PWA limitations on iOS | High | Medium | Fallback to native app in Q4 |
| Health API changes (Apple/Google) | Medium | High | Abstract health sync layer |
| Firestore costs at scale | Medium | Medium | Implement caching + pagination (see FIREBASE_AUDIT.md) |
| AI plan quality issues | Medium | High | Start with rule-based, iterate to ML |

### Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Strava adds gym tracking | Low | High | Focus on hybrid integration, not just tracking |
| TrainingPeaks modernizes UI | Medium | Medium | Compete on price and simplicity |
| Low conversion to paid | Medium | High | A/B test pricing, offer annual discount |
| Coach marketplace chicken-and-egg | High | Medium | Recruit beta coaches, offer free first month |

### Execution Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Feature creep | High | Medium | Strict prioritization by ROI score |
| Developer burnout | Medium | High | Realistic timelines, no crunch |
| Single point of failure (1 developer) | High | High | Document everything, simplify codebase |

---

## 10. Success Metrics

### Key Performance Indicators

| Metric | Current | Q1 Target | Q2 Target | Q3 Target | Q4 Target |
|--------|---------|-----------|-----------|-----------|-----------|
| **Daily Active Users (DAU)** | ~10 | 50 | 200 | 1,000 | 5,000 |
| **Monthly Active Users (MAU)** | ~30 | 150 | 600 | 3,000 | 15,000 |
| **DAU/MAU Ratio** | ~33% | 33% | 35% | 40% | 45% |
| **7-Day Retention** | ~40% | 50% | 60% | 65% | 70% |
| **30-Day Retention** | ~20% | 30% | 40% | 45% | 50% |
| **Workouts Logged/Day** | ~5 | 25 | 100 | 500 | 2,500 |
| **Premium Conversion** | 0% | 5% | 8% | 10% | 12% |
| **Monthly Revenue** | $0 | $0 | $500 | $2,000 | $10,000 |
| **Customer Acquisition Cost** | — | $0 (organic) | $0 (organic) | $2 (referral) | $5 (paid) |
| **Lifetime Value (LTV)** | — | $0 | $30 | $60 | $120 |
| **Net Promoter Score (NPS)** | — | — | 40 | 50 | 60 |

### North Star Metric

**"Workouts logged per day"** — This single metric correlates with all others:
- More workouts = more engagement = higher retention
- More workouts = more data = better insights = more value
- More workouts = more reasons to upgrade to premium

**Target:** 1 workout per user per day (DAU/Workout ratio = 1:1)

---

## Appendix: Feature Scoring Details

### Raw Scores

| Feature | User Value (30%) | Retention (20%) | Acquisition (15%) | Revenue (15%) | Effort (20%) | **ROI** |
|---------|:----------------:|:----------------:|:-----------------:|:-------------:|:------------:|:-------:|
| Offline Mode (PWA) | 9 × 0.30 = 2.70 | 9 × 0.20 = 1.80 | 7 × 0.15 = 1.05 | 5 × 0.15 = 0.75 | 3 × 0.20 = 0.60 | **6.50** |
| Apple Health / Google Fit Sync | 9 × 0.30 = 2.70 | 8 × 0.20 = 1.60 | 8 × 0.15 = 1.20 | 4 × 0.15 = 0.60 | 3 × 0.20 = 0.60 | **6.35** |
| Workout Templates Library | 8 × 0.30 = 2.40 | 8 × 0.20 = 1.60 | 7 × 0.15 = 1.05 | 6 × 0.15 = 0.90 | 3 × 0.20 = 0.60 | **6.20** |
| Coach/Athlete Mode | 9 × 0.30 = 2.70 | 9 × 0.20 = 1.80 | 8 × 0.15 = 1.20 | 10 × 0.15 = 1.50 | 7 × 0.20 = 1.40 | **5.95** |
| Body Measurements Tracking | 7 × 0.30 = 2.10 | 7 × 0.20 = 1.40 | 5 × 0.15 = 0.75 | 4 × 0.15 = 0.60 | 2 × 0.20 = 0.40 | **5.55** |
| Data Export (CSV/PDF) | 7 × 0.30 = 2.10 | 5 × 0.20 = 1.00 | 4 × 0.15 = 0.60 | 3 × 0.15 = 0.45 | 2 × 0.20 = 0.40 | **5.00** |
| Monthly/Weekly Progress Reports | 8 × 0.30 = 2.40 | 8 × 0.20 = 1.60 | 5 × 0.15 = 0.75 | 5 × 0.15 = 0.75 | 4 × 0.20 = 0.80 | **5.00** |
| Social Challenges | 7 × 0.30 = 2.10 | 9 × 0.20 = 1.80 | 9 × 0.15 = 1.35 | 6 × 0.15 = 0.90 | 7 × 0.20 = 1.40 | **4.95** |
| Wearable Integration (Garmin/Coros) | 8 × 0.30 = 2.40 | 7 × 0.20 = 1.40 | 7 × 0.15 = 1.05 | 5 × 0.15 = 0.75 | 6 × 0.20 = 1.20 | **4.70** |
| AI Training Plan Generator | 9 × 0.30 = 2.70 | 9 × 0.20 = 1.80 | 9 × 0.15 = 1.35 | 8 × 0.15 = 1.20 | 9 × 0.20 = 1.80 | **4.65** |
| Nutrition Logging | 7 × 0.30 = 2.10 | 7 × 0.20 = 1.40 | 6 × 0.15 = 0.90 | 5 × 0.15 = 0.75 | 6 × 0.20 = 1.20 | **4.35** |
| Native Mobile App (React Native) | 9 × 0.30 = 2.70 | 8 × 0.20 = 1.60 | 8 × 0.15 = 1.20 | 7 × 0.15 = 1.05 | 9 × 0.20 = 1.80 | **4.30** |
| Dark Mode | 6 × 0.30 = 1.80 | 4 × 0.20 = 0.80 | 3 × 0.15 = 0.45 | 2 × 0.15 = 0.30 | 1 × 0.20 = 0.20 | **4.25** |
| Leaderboards (Friends) | 5 × 0.30 = 1.50 | 7 × 0.20 = 1.40 | 7 × 0.15 = 1.05 | 4 × 0.15 = 0.60 | 5 × 0.20 = 1.00 | **4.10** |
| In-App Coaching Marketplace | 7 × 0.30 = 2.10 | 8 × 0.20 = 1.60 | 9 × 0.15 = 1.35 | 10 × 0.15 = 1.50 | 10 × 0.20 = 2.00 | **3.95** |
| Race Predictor | 7 × 0.30 = 2.10 | 6 × 0.20 = 1.20 | 6 × 0.15 = 0.90 | 4 × 0.15 = 0.60 | 5 × 0.20 = 1.00 | **3.90** |
| Goal Setting & Milestones | 6 × 0.30 = 1.80 | 7 × 0.20 = 1.40 | 4 × 0.15 = 0.60 | 3 × 0.15 = 0.45 | 4 × 0.20 = 0.80 | **3.85** |
| Community Forum / Groups | 5 × 0.30 = 1.50 | 6 × 0.20 = 1.20 | 7 × 0.15 = 1.05 | 5 × 0.15 = 0.75 | 6 × 0.20 = 1.20 | **3.70** |
| Gamification (Badges, Streaks) | 5 × 0.30 = 1.50 | 7 × 0.20 = 1.40 | 4 × 0.15 = 0.60 | 3 × 0.15 = 0.45 | 5 × 0.20 = 1.00 | **3.50** |
| Multi-Language Support | 4 × 0.30 = 1.20 | 3 × 0.20 = 0.60 | 6 × 0.15 = 0.90 | 3 × 0.15 = 0.45 | 4 × 0.20 = 0.80 | **3.20** |

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*
