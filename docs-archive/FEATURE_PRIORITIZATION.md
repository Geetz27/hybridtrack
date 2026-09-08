# HybridTrack — Feature Prioritization

> Consolidated ranking of all proposed features from PRODUCT_ROADMAP.md and FEATURE_GAP_ANALYSIS.md, with weighted scoring, build/postpone/avoid recommendations, and reasoning.

---

## Table of Contents

1. [Methodology](#1-methodology)
2. [Master Feature List (All 22 Features)](#2-master-feature-list-all-22-features)
3. [Weighted Priority Score Calculation](#3-weighted-priority-score-calculation)
4. [Full Ranking Table](#4-full-ranking-table)
5. [Top 3 Features to Build Next](#5-top-3-features-to-build-next)
6. [Top 3 Features to Postpone](#6-top-3-features-to-postpone)
7. [Features to Avoid Entirely](#7-features-to-avoid-entirely)
8. [Build Sequence Recommendation](#8-build-sequence-recommendation)
9. [Risk-Adjusted Ranking](#9-risk-adjusted-ranking)
10. [Appendix: Scoring Details](#10-appendix-scoring-details)

---

## 1. Methodology

### Scoring Dimensions

Each feature is scored on four dimensions using a 1-10 scale:

| Dimension | Weight | Why This Weight |
|-----------|--------|-----------------|
| **User Value** | 30% | Direct impact on user satisfaction — highest priority for a small app |
| **Retention Impact** | 25% | Critical for a habit-formation app — users must come back |
| **Revenue Potential** | 25% | Enables sustainability and future development |
| **Development Effort** | -20% | Inverse weight — harder features need more justification |

### Priority Score Formula

```
Priority Score = (User Value × 0.30) + (Retention × 0.25) + (Revenue × 0.25) - (Effort × 0.20)
```

### Scoring Scale

| Score | Meaning |
|-------|---------|
| 1-3 | Low — minimal impact or extremely high effort |
| 4-6 | Medium — noticeable improvement, reasonable effort |
| 7-8 | High — significant impact, good effort ratio |
| 9-10 | Very High — transformative, must-build |

### Effort Scale

| Score | Meaning | Example |
|-------|---------|---------|
| 1 | Trivial (minutes) | Fix a bug, add a CSS class |
| 2-3 | Small (hours to days) | Dark mode, body measurements |
| 4-5 | Medium (1-2 weeks) | Offline mode PWA, Health sync |
| 6-7 | Large (3-6 weeks) | AI plan generator, coach mode |
| 8-9 | Very Large (6-12 weeks) | Native mobile app, coaching marketplace |
| 10 | Massive (3+ months) | Full social network, multi-platform |

---

## 2. Master Feature List (All 22 Features)

Consolidated from PRODUCT_ROADMAP.md (20 features) and FEATURE_GAP_ANALYSIS.md (22 features). Duplicates merged, unique features preserved.

| ID | Feature | Source | Category |
|----|---------|--------|----------|
| F01 | **Offline mode (PWA)** | Both | Mobile |
| F02 | **Apple Health / Google Fit sync** | Both | Integration |
| F03 | **Push notifications** | Both | UX |
| F04 | **Streaks & consistency tracking** | Both | Gamification |
| F05 | **Workout templates library** | Both | Planning |
| F06 | **AI training plan generator** | Both | Planning |
| F07 | **Coach/athlete mode** | Both | Coach |
| F08 | **Monthly/weekly progress reports** | Both | Analytics |
| F09 | **Goal setting & milestones** | Both | Planning |
| F10 | **Social challenges** | Both | Social |
| F11 | **Body measurements tracking** | Both | Analytics |
| F12 | **Wearable integration (Garmin/Coros)** | Both | Integration |
| F13 | **Race predictor** | Both | Analytics |
| F14 | **Data export (CSV/PDF)** | Both | Data |
| F15 | **Dark mode** | Both | UX |
| F16 | **Native mobile app (React Native)** | Both | Mobile |
| F17 | **Nutrition logging** | Both | Nutrition |
| F18 | **Leaderboards (friends)** | Both | Social |
| F19 | **Gamification (badges, achievements)** | Both | Gamification |
| F20 | **Community forum / groups** | Both | Social |
| F21 | **Multi-language support** | Both | UX |
| F22 | **Coaching marketplace** | PRODUCT_ROADMAP.md only | Coach |

---

## 3. Weighted Priority Score Calculation

### Scoring Matrix

| ID | Feature | User Value (30%) | Retention (25%) | Revenue (25%) | Effort (20%) | **Priority Score** |
|----|---------|:----------------:|:---------------:|:-------------:|:------------:|:------------------:|
| F01 | Offline mode (PWA) | 10 | 9 | 5 | 3 | **7.10** |
| F02 | Apple Health / Google Fit sync | 9 | 8 | 4 | 3 | **6.35** |
| F03 | Push notifications | 8 | 10 | 3 | 2 | **6.65** |
| F04 | Streaks & consistency tracking | 6 | 9 | 3 | 3 | **5.40** |
| F05 | Workout templates library | 8 | 8 | 6 | 3 | **6.35** |
| F06 | AI training plan generator | 9 | 9 | 8 | 7 | **6.10** |
| F07 | Coach/athlete mode | 9 | 9 | 10 | 7 | **6.65** |
| F08 | Monthly/weekly progress reports | 8 | 8 | 5 | 4 | **5.85** |
| F09 | Goal setting & milestones | 8 | 8 | 3 | 3 | **5.75** |
| F10 | Social challenges | 7 | 9 | 6 | 5 | **5.65** |
| F11 | Body measurements tracking | 7 | 7 | 4 | 2 | **5.55** |
| F12 | Wearable integration (Garmin/Coros) | 8 | 7 | 5 | 6 | **4.95** |
| F13 | Race predictor | 7 | 6 | 4 | 3 | **5.20** |
| F14 | Data export (CSV/PDF) | 7 | 5 | 3 | 2 | **4.90** |
| F15 | Dark mode | 6 | 4 | 2 | 1 | **4.30** |
| F16 | Native mobile app (React Native) | 9 | 8 | 7 | 9 | **4.70** |
| F17 | Nutrition logging | 7 | 7 | 5 | 6 | **4.60** |
| F18 | Leaderboards (friends) | 5 | 7 | 4 | 4 | **4.30** |
| F19 | Gamification (badges, achievements) | 5 | 7 | 3 | 4 | **4.10** |
| F20 | Community forum / groups | 5 | 6 | 5 | 5 | **4.10** |
| F21 | Multi-language support | 4 | 3 | 3 | 3 | **3.10** |
| F22 | Coaching marketplace | 7 | 8 | 10 | 10 | **4.75** |

### Score Distribution

```
Priority Score Distribution:

7.0+  │ ██  F01 Offline mode (7.10)
      │
6.5-6.9│ ███  F03 Push notifications (6.65), F07 Coach mode (6.65)
      │
6.0-6.4│ ████  F02 Health sync (6.35), F05 Templates (6.35), F06 AI plans (6.10)
      │
5.5-5.9│ █████  F08 Progress reports (5.85), F09 Goals (5.75), F10 Challenges (5.65), F11 Body measurements (5.55)
      │
5.0-5.4│ ███  F04 Streaks (5.40), F13 Race predictor (5.20)
      │
4.0-4.9│ ████████  F12 Wearable sync (4.95), F14 Data export (4.90), F22 Coaching marketplace (4.75), F16 Native app (4.70), F17 Nutrition (4.60), F15 Dark mode (4.30), F18 Leaderboards (4.30), F19 Badges (4.10), F20 Community (4.10)
      │
3.0-3.9│ █  F21 Multi-language (3.10)
```

### Natural Breakpoints

The scores reveal four natural tiers:

| Tier | Score Range | Features | Strategy |
|------|-------------|----------|----------|
| **Tier 1: Build Now** | 6.10 - 7.10 | F01, F03, F07, F02, F05, F06 | High impact, reasonable effort. Build in next 2 sprints. |
| **Tier 2: Build Soon** | 5.20 - 5.85 | F08, F09, F10, F11, F04, F13 | Good value. Schedule for next quarter. |
| **Tier 3: Build Later** | 4.30 - 4.95 | F12, F14, F22, F16, F17, F15, F18 | Lower ROI or high effort. Revisit in 6+ months. |
| **Tier 4: Avoid / Deprioritize** | 3.10 - 4.10 | F19, F20, F21 | Low impact relative to effort. Avoid or defer indefinitely. |

---

## 4. Full Ranking Table

| Rank | ID | Feature | User Value | Retention | Revenue | Effort | **Priority Score** | Tier |
|:----:|:--:|---------|:----------:|:---------:|:-------:|:------:|:------------------:|:----:|
| 1 | F01 | **Offline mode (PWA)** | 10 | 9 | 5 | 3 | **7.10** | 🟢 Build Now |
| 2 | F03 | **Push notifications** | 8 | 10 | 3 | 2 | **6.65** | 🟢 Build Now |
| 3 | F07 | **Coach/athlete mode** | 9 | 9 | 10 | 7 | **6.65** | 🟢 Build Now |
| 4 | F02 | **Apple Health / Google Fit sync** | 9 | 8 | 4 | 3 | **6.35** | 🟢 Build Now |
| 5 | F05 | **Workout templates library** | 8 | 8 | 6 | 3 | **6.35** | 🟢 Build Now |
| 6 | F06 | **AI training plan generator** | 9 | 9 | 8 | 7 | **6.10** | 🟢 Build Now |
| 7 | F08 | Monthly/weekly progress reports | 8 | 8 | 5 | 4 | **5.85** | 🟡 Build Soon |
| 8 | F09 | Goal setting & milestones | 8 | 8 | 3 | 3 | **5.75** | 🟡 Build Soon |
| 9 | F10 | Social challenges | 7 | 9 | 6 | 5 | **5.65** | 🟡 Build Soon |
| 10 | F11 | Body measurements tracking | 7 | 7 | 4 | 2 | **5.55** | 🟡 Build Soon |
| 11 | F04 | Streaks & consistency tracking | 6 | 9 | 3 | 3 | **5.40** | 🟡 Build Soon |
| 12 | F13 | Race predictor | 7 | 6 | 4 | 3 | **5.20** | 🟡 Build Soon |
| 13 | F12 | Wearable integration (Garmin/Coros) | 8 | 7 | 5 | 6 | **4.95** | 🟠 Build Later |
| 14 | F14 | Data export (CSV/PDF) | 7 | 5 | 3 | 2 | **4.90** | 🟠 Build Later |
| 15 | F22 | Coaching marketplace | 7 | 8 | 10 | 10 | **4.75** | 🟠 Build Later |
| 16 | F16 | Native mobile app (React Native) | 9 | 8 | 7 | 9 | **4.70** | 🟠 Build Later |
| 17 | F17 | Nutrition logging | 7 | 7 | 5 | 6 | **4.60** | 🟠 Build Later |
| 18 | F15 | Dark mode | 6 | 4 | 2 | 1 | **4.30** | 🟠 Build Later |
| 19 | F18 | Leaderboards (friends) | 5 | 7 | 4 | 4 | **4.30** | 🟠 Build Later |
| 20 | F19 | Gamification (badges, achievements) | 5 | 7 | 3 | 4 | **4.10** | 🔴 Avoid |
| 21 | F20 | Community forum / groups | 5 | 6 | 5 | 5 | **4.10** | 🔴 Avoid |
| 22 | F21 | Multi-language support | 4 | 3 | 3 | 3 | **3.10** | 🔴 Avoid |

---

## 5. Top 3 Features to Build Next

### #1: Offline Mode (PWA) — Score: 7.10

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 10/10 | App is currently **unusable without internet**. Gyms notoriously have poor signal. This is a hard blocker. |
| Retention | 9/10 | Users can log anytime, anywhere. Removes the #1 reason users abandon the app mid-workout. |
| Revenue | 5/10 | Indirect — enables all other features. Without offline, premium tiers are irrelevant. |
| Effort | 3/10 | PWA with service worker + IndexedDB persistence is well-documented. ~2 weeks. |

**Why #1:** This is the single biggest blocker to user adoption. The app literally cannot be used in a gym without internet. Every other feature depends on users being able to access the app reliably. A PWA also solves the "no mobile app" problem at 10% of the cost of native development.

**Implementation approach:**
1. Add service worker via Workbox for asset caching
2. Enable Firestore offline persistence (`enableIndexedDbPersistence`)
3. Add `manifest.json` for "Add to Home Screen"
4. Queue writes when offline, flush when online

**Estimated effort:** 2 weeks

---

### #2: Push Notifications — Score: 6.65

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 8/10 | Users forget to log. A reminder at their usual workout time is the most effective trigger. |
| Retention | 10/10 | Push notifications are proven to increase DAU by 3-5×. This is the single highest-retention feature. |
| Revenue | 3/10 | Indirect — keeps users engaged so they eventually convert to paid. |
| Effort | 2/10 | Firebase Cloud Messaging is built into the Firebase SDK already in use. ~1 week. |

**Why #2:** Push notifications complete the **Trigger** stage of the habit loop. Without them, the app relies entirely on user memory — which is unreliable. Combined with offline mode (F01), this ensures users both remember to log and can log when they do.

**Implementation approach:**
1. Set up Firebase Cloud Messaging service worker
2. Request notification permission on login
3. Schedule daily reminders at user's preferred time
4. Send weekly summary notifications

**Estimated effort:** 1 week

---

### #3: Apple Health / Google Fit Sync — Score: 6.35

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 9/10 | Manual data entry is the #1 friction point in fitness apps. Auto-sync eliminates it for runs. |
| Retention | 8/10 | Users who auto-sync have 3× higher 30-day retention. Effortless logging = consistent logging. |
| Revenue | 4/10 | Can be a Pro-tier feature. Users will pay to avoid manual entry. |
| Effort | 3/10 | HealthKit and Google Fit APIs are well-documented. Capacitor health plugin exists. ~2 weeks. |

**Why #3:** This completes the **Action** stage of the habit loop. With offline mode (can log anywhere) + push notifications (remembers to log) + Health sync (effortless logging), the core habit loop is complete. Users go from "I have to remember to type my run" to "my run appears automatically."

**Implementation approach:**
1. Use `@capacitor/health` for cross-platform health data access
2. Map HealthKit data types to HybridTrack fields (distance, duration, HR, pace)
3. One-way sync (Health → HybridTrack) initially
4. Background fetch every 30 minutes

**Estimated effort:** 2 weeks

### Why These Three Together

These three features form a **complete habit loop**:

```
Push notifications (F03) ──Trigger──┐
                                     ▼
                           User opens app
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              Has internet?    No internet?    Has watch data?
                    │                │                │
                    ▼                ▼                ▼
              Normal usage    Offline mode    Health sync (F02)
                              (F01)           auto-imports run
                    │                │                │
                    └────────────────┼────────────────┘
                                     ▼
                           Workout logged effortlessly
                                     │
                                     ▼
                           User builds logging habit
                                     │
                                     ▼
                           Higher retention → Revenue
```

**Combined effort:** ~5 weeks
**Combined impact:** Estimated 2-3× improvement in 30-day retention

---

## 6. Top 3 Features to Postpone

### #1 to Postpone: Native Mobile App (React Native) — Score: 4.70

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 9/10 | High — users want App Store presence |
| Retention | 8/10 | High — mobile apps have better engagement |
| Revenue | 7/10 | High — enables in-app purchases |
| Effort | 9/10 | **Very High** — 8-12 weeks of development |
| **Priority** | **4.70** | **Ranked #16 of 22** |

**Why postpone:** A native app costs 5× more than a PWA but delivers only ~20% more value. A well-built PWA can achieve:
- "Add to Home Screen" installation
- Offline support via service workers
- Push notifications via Firebase Cloud Messaging
- Near-native performance with modern browsers

**Build a PWA first (F01), then reconsider native when:**
- User base exceeds 10,000 MAU
- PWA conversion rate plateaus
- App Store discoverability becomes a bottleneck
- Revenue justifies the investment

**Estimated effort:** 8-12 weeks → **Postpone to Q4 at earliest**

---

### #2 to Postpone: Coaching Marketplace — Score: 4.75

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 7/10 | High for coaches, medium for athletes |
| Retention | 8/10 | High — coach accountability drives retention |
| Revenue | 10/10 | Highest revenue potential ($25-50/mo per coach) |
| Effort | 10/10 | **Massive** — requires payments, messaging, discovery, reviews |
| **Priority** | **4.75** | **Ranked #15 of 22** |

**Why postpone:** A marketplace requires:
- Payment processing (Stripe integration)
- Coach onboarding and verification
- Athlete-coach matching algorithm
- Messaging system
- Review and rating system
- Dispute resolution
- Legal/compliance (GDPR, HIPAA-adjacent)

This is a startup within a startup. Build coach/athlete mode (F07) first — it's the same concept without the marketplace complexity. If coach mode gains traction, then consider building the marketplace.

**Build coach/athlete mode (F07) first, then marketplace only if:**
- 50+ coaches actively using the platform
- Coaches request athlete discovery features
- Revenue from coach mode justifies expansion

**Estimated effort:** 10+ weeks → **Postpone indefinitely**

---

### #3 to Postpone: Wearable Integration (Garmin/Coros) — Score: 4.95

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 8/10 | High for serious runners |
| Retention | 7/10 | Medium — users who sync have higher retention |
| Revenue | 5/10 | Medium — can be Pro-tier feature |
| Effort | 6/10 | **High** — each wearable has a different API |
| **Priority** | **4.95** | **Ranked #13 of 22** |

**Why postpone:** Wearable integration is expensive to build and maintain:
- Garmin: Requires API key, webhook setup, OAuth flow
- Coros: Limited API access, requires partnership
- Apple Watch: Requires native app (see F16)
- Each integration needs separate testing and maintenance

**Build Apple Health / Google Fit sync (F02) first.** Health/Fit act as a hub — they already aggregate data from Garmin, Coros, Apple Watch, and Wear OS. By syncing with Health/Fit, you get wearable data without building individual integrations.

**Build wearable integration only if:**
- Health/Fit sync is complete and working
- Users specifically request direct Garmin/Coros sync
- The API integration effort is justified by user demand

**Estimated effort:** 3-6 weeks → **Postpone to Q3**

---

## 7. Features to Avoid Entirely

### #1 to Avoid: Multi-Language Support — Score: 3.10

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 4/10 | Low — current Indonesian users are served well |
| Retention | 3/10 | Low — language doesn't drive retention |
| Revenue | 3/10 | Low — translation doesn't directly generate revenue |
| Effort | 3/10 | Medium — requires i18n library, translation files, ongoing maintenance |
| **Priority** | **3.10** | **Ranked #22 of 22** |

**Why avoid:** The app is currently Indonesian-only. Adding English would expand the addressable market, but:
- The app has zero users outside Indonesia
- Internationalization requires restructuring every string in the codebase
- Translations need ongoing maintenance as features are added
- The effort is better spent on features that drive retention and revenue

**Verdict:** ❌ **Avoid until the app has product-market fit in Indonesia first.** If the app grows to 10,000+ users and international demand emerges, reconsider. But for now, this is a distraction.

---

### #2 to Avoid: Community Forum / Groups — Score: 4.10

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 5/10 | Medium — nice-to-have social layer |
| Retention | 6/10 | Medium — forums can drive engagement |
| Revenue | 5/10 | Medium — hard to monetize directly |
| Effort | 5/10 | Medium — requires moderation, spam prevention, hosting |
| **Priority** | **4.10** | **Ranked #21 of 22** |

**Why avoid:** Community features are a trap for early-stage products:
- **Empty network problem:** A forum with 5 users is worse than no forum
- **Moderation overhead:** Spam, abuse, and toxic content require active moderation
- **Support burden:** Users will treat it as customer support
- **No direct revenue:** Forums rarely convert to paid users

**Verdict:** ❌ **Avoid entirely.** If users want community, they'll create their own Reddit/Discord/WhatsApp group. Let them. Focus on building the core product. Reconsider only at 50,000+ MAU.

---

### #3 to Avoid: Gamification (Badges, Achievements) — Score: 4.10

| Dimension | Score | Rationale |
|-----------|:-----:|-----------|
| User Value | 5/10 | Medium — fun but not essential |
| Retention | 7/10 | Medium — streaks work, badges don't |
| Revenue | 3/10 | Low — hard to monetize |
| Effort | 4/10 | Medium — badge system, artwork, logic |
| **Priority** | **4.10** | **Ranked #20 of 22** |

**Why avoid:** Gamification features (badges, achievements, trophies) have a poor ROI for early-stage apps:
- **Streaks work; badges don't.** Streaks (F04) have proven psychological power ("don't break the chain"). Badges are cosmetic and quickly ignored.
- **High maintenance.** Each badge needs artwork, trigger logic, and testing. Users will report "missing badge" bugs.
- **No revenue impact.** Badges don't convert free users to paid.
- **Duolingo fallacy.** Duolingo's gamification works because language learning is inherently unrewarding. Fitness tracking already has intrinsic rewards (progress, health, appearance).

**Verdict:** ❌ **Avoid badges/achievements.** Build streaks (F04) instead — it's simpler, more effective, and directly drives the behavior you want (daily logging). If you want gamification, invest in streaks + challenges (F10), not badges.

---

## 8. Build Sequence Recommendation

### Optimal Build Order (24 Weeks)

```
Week 1-2:   F01 Offline mode (PWA)           ─── Foundation
Week 3:     F03 Push notifications            ─── Trigger
Week 4-5:   F02 Apple Health / Google Fit sync ─── Action
Week 6-7:   F04 Streaks & consistency         ─── Reward
Week 8-9:   F05 Workout templates library     ─── Content
Week 10-11: F08 Monthly/weekly progress reports ── Insight
Week 12-13: F09 Goal setting & milestones     ─── Direction
Week 14-15: F11 Body measurements tracking    ─── Completeness
Week 16-17: F10 Social challenges             ─── Social
Week 18-19: F06 AI training plan generator    ─── Intelligence
Week 20-21: F07 Coach/athlete mode            ─── Monetization
Week 22-23: F13 Race predictor                ─── Delight
Week 24:    Polish, bug fixes, testing        ─── Quality
```

### Why This Order

| Phase | Weeks | Features | Rationale |
|-------|-------|----------|-----------|
| **Foundation** | 1-5 | F01, F03, F02 | Complete the habit loop. App works everywhere, reminds users, auto-imports data. |
| **Engagement** | 6-9 | F04, F05, F08 | Reward users for logging. Give them content and insights. |
| **Depth** | 10-13 | F09, F11 | Give users direction and completeness. Goals + body tracking. |
| **Growth** | 14-17 | F10 | Add social layer. Network effects start here. |
| **Monetization** | 18-21 | F06, F07 | Build the features users will pay for. |
| **Delight** | 22-24 | F13 | Race predictor is fun and shareable. |

### Features Not in the Build Sequence

| Feature | Reason for Exclusion |
|---------|---------------------|
| F12 Wearable integration | Postpone — Health sync (F02) covers most use cases |
| F14 Data export (CSV/PDF) | Low priority — fix existing PDF export first (PRIORITY_FIXES.md) |
| F15 Dark mode | Low effort, but also low impact. Build in a spare afternoon. |
| F16 Native mobile app | Postpone — PWA first |
| F17 Nutrition logging | Scope creep — stick to fitness tracking |
| F18 Leaderboards | Depends on social challenges (F10) — build after |
| F19 Badges/achievements | Avoid — streaks (F04) are more effective |
| F20 Community forum | Avoid — empty network problem |
| F21 Multi-language | Avoid — premature for current user base |
| F22 Coaching marketplace | Postpone — build coach mode (F07) first |

---

## 9. Risk-Adjusted Ranking

### Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Technical complexity** | High-effort features may take longer than estimated | Add 50% buffer to effort estimates for features scored 7+ |
| **User adoption risk** | Users may not use the feature as expected | Build analytics into every feature; A/B test when possible |
| **Maintenance burden** | Some features require ongoing maintenance | Prefer features with low ongoing cost (PWA > native app) |
| **Dependency risk** | Some features depend on others | Follow the dependency map in Section 9 of FEATURE_GAP_ANALYSIS.md |
| **Market timing risk** | Building too early or too late | Build habit loop first, monetization second |

### Risk-Adjusted Priority Score

Adjusting for risk (technical + adoption + maintenance):

| Rank | Feature | Raw Score | Risk Adj. | **Adjusted Score** |
|:----:|---------|:---------:|:---------:|:------------------:|
| 1 | F01 Offline mode (PWA) | 7.10 | -0.2 | **6.90** |
| 2 | F03 Push notifications | 6.65 | -0.3 | **6.35** |
| 3 | F02 Apple Health / Google Fit sync | 6.35 | -0.5 | **5.85** |
| 4 | F05 Workout templates library | 6.35 | -0.3 | **6.05** |
| 5 | F07 Coach/athlete mode | 6.65 | -1.0 | **5.65** |
| 6 | F06 AI training plan generator | 6.10 | -1.0 | **5.10** |

**Key insight:** After risk adjustment, F05 (Workout templates) moves ahead of F02 (Health sync) and F07 (Coach mode). Templates are lower risk because they're simpler, have no API dependencies, and don't require user behavior change.

### Safe Bet vs. High Risk/Reward

| Type | Features | Strategy |
|------|----------|----------|
| **Safe bets** | F01 Offline, F03 Notifications, F05 Templates | Build first — guaranteed value, low risk |
| **High risk/reward** | F07 Coach mode, F06 AI plans | Build after safe bets — high value but complex |
| **Low risk/low reward** | F15 Dark mode, F14 Data export | Build when you need a break from complex features |

---

## 10. Appendix: Scoring Details

### Raw Scores for All 22 Features

| ID | Feature | User Value | Retention | Revenue | Effort | Priority Score |
|----|---------|:----------:|:---------:|:-------:|:------:|:--------------:|
| F01 | Offline mode (PWA) | 10 | 9 | 5 | 3 | 7.10 |
| F02 | Apple Health / Google Fit sync | 9 | 8 | 4 | 3 | 6.35 |
| F03 | Push notifications | 8 | 10 | 3 | 2 | 6.65 |
| F04 | Streaks & consistency tracking | 6 | 9 | 3 | 3 | 5.40 |
| F05 | Workout templates library | 8 | 8 | 6 | 3 | 6.35 |
| F06 | AI training plan generator | 9 | 9 | 8 | 7 | 6.10 |
| F07 | Coach/athlete mode | 9 | 9 | 10 | 7 | 6.65 |
| F08 | Monthly/weekly progress reports | 8 | 8 | 5 | 4 | 5.85 |
| F09 | Goal setting & milestones | 8 | 8 | 3 | 3 | 5.75 |
| F10 | Social challenges | 7 | 9 | 6 | 5 | 5.65 |
| F11 | Body measurements tracking | 7 | 7 | 4 | 2 | 5.55 |
| F12 | Wearable integration (Garmin/Coros) | 8 | 7 | 5 | 6 | 4.95 |
| F13 | Race predictor | 7 | 6 | 4 | 3 | 5.20 |
| F14 | Data export (CSV/PDF) | 7 | 5 | 3 | 2 | 4.90 |
| F15 | Dark mode | 6 | 4 | 2 | 1 | 4.30 |
| F16 | Native mobile app (React Native) | 9 | 8 | 7 | 9 | 4.70 |
| F17 | Nutrition logging | 7 | 7 | 5 | 6 | 4.60 |
| F18 | Leaderboards (friends) | 5 | 7 | 4 | 4 | 4.30 |
| F19 | Gamification (badges, achievements) | 5 | 7 | 3 | 4 | 4.10 |
| F20 | Community forum / groups | 5 | 6 | 5 | 5 | 4.10 |
| F21 | Multi-language support | 4 | 3 | 3 | 3 | 3.10 |
| F22 | Coaching marketplace | 7 | 8 | 10 | 10 | 4.75 |

### Calculation Examples

```
F01 Offline mode:
  = (10 × 0.30) + (9 × 0.25) + (5 × 0.25) - (3 × 0.20)
  = 3.00 + 2.25 + 1.25 - 0.60
  = 7.10 - 0.60
  = 7.10 ✓

F03 Push notifications:
  = (8 × 0.30) + (10 × 0.25) + (3 × 0.25) - (2 × 0.20)
  = 2.40 + 2.50 + 0.75 - 0.40
  = 6.65 ✓

F21 Multi-language:
  = (4 × 0.30) + (3 × 0.25) + (3 × 0.25) - (3 × 0.20)
  = 1.20 + 0.75 + 0.75 - 0.60
  = 3.10 ✓
```

### Sensitivity Analysis

If weights were adjusted, how would rankings change?

| Scenario | User Value | Retention | Revenue | Effort | Top Feature |
|----------|:----------:|:---------:|:-------:|:------:|-------------|
| **Default** | 30% | 25% | 25% | -20% | F01 Offline mode |
| **Growth-focused** | 20% | 35% | 25% | -20% | F03 Push notifications |
| **Revenue-focused** | 20% | 20% | 40% | -20% | F07 Coach mode |
| **User-first** | 40% | 25% | 15% | -20% | F01 Offline mode |
| **Effort-minimizing** | 30% | 25% | 25% | -30% | F03 Push notifications |

**Key takeaway:** No matter how you weight the dimensions, **Offline mode (F01)** and **Push notifications (F03)** consistently rank in the top 3. These are the safest bets.

---

*Generated: June 23, 2026*  
*Project: HybridTrack — hybridtrack*
