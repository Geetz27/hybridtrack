# Telegram Reminder System — Architecture Design

## 1. Overview

A serverless reminder system that sends daily Telegram messages to HybridTrack users with their scheduled workout for the day. The system reads from the existing `users/{uid}/plan/current` Firestore document and sends personalized reminders via a Telegram Bot.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram   │ ◄── │  Cloud Functions  │ ◄── │   Firestore     │
│  Bot API    │     │  (Node.js)        │     │  users/{uid}/   │
│             │     │                   │     │  plan/current   │
└─────────────┘     │  - scheduler      │     └─────────────────┘
                    │  - sender         │
                    │  - user mgmt      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Firestore       │
                    │  users/{uid}/    │
                    │  telegram        │
                    │  - chatId        │
                    │  - enabled       │
                    │  - remindTime    │
                    └──────────────────┘
```

---

## 2. Data Model

### New Collection: `users/{uid}/telegram`

```typescript
interface TelegramSettings {
  chatId: string;          // Telegram chat ID (numeric string)
  enabled: boolean;        // Opt-in/out
  remindTime: string;      // HH:mm in user's timezone (e.g., "07:00")
  timezone: string;        // IANA timezone (e.g., "Asia/Jakarta")
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Existing Document Used: `users/{uid}/plan/current`

The reminder system reads the `days` field to determine today's workout.

---

## 3. Architecture Components

### 3.1 Telegram Bot (Cloud Function — HTTP endpoint)

**Purpose:** Handle user interactions with the Telegram Bot.

**Endpoint:** `POST /telegram-webhook`

**Responsibilities:**
- Register user's `chatId` when they start the bot (`/start`)
- Handle commands:
  - `/start` — Register user, prompt for timezone
  - `/time HH:mm` — Set reminder time
  - `/timezone <IANA>` — Set timezone
  - `/on` — Enable reminders
  - `/off` — Disable reminders
  - `/status` — Show current settings + today's plan
  - `/plan` — Show today's workout plan
- Store `chatId` + settings in `users/{uid}/telegram`

**Authentication flow:**
1. User starts bot → receives a one-time link/code
2. User logs into HybridTrack web app → enters the code
3. Web app writes `chatId` to `users/{uid}/telegram`
4. Bot confirms pairing

**Alternative (simpler) flow:**
1. User starts bot → bot asks for their email
2. Bot looks up user by email in Firestore (requires email index)
3. If found, links `chatId` to that user

### 3.2 Scheduler (Cloud Function — Pub/Sub or Cron)

**Purpose:** Trigger reminder delivery at scheduled times.

**Trigger:** Cloud Scheduler → Pub/Sub topic (every minute)

**Implementation options:**

| Option | Pros | Cons |
|---|---|---|
| **Cloud Scheduler + Pub/Sub** (every 1 min) | Simple, native GCP | 1-min granularity, ~43k invocations/month |
| **Cloud Tasks** | Precise scheduling | More complex setup |
| **Firestore `onWrite` trigger** | Real-time | Only fires on data change, not time-based |

**Recommended: Cloud Scheduler → Pub/Sub (every 1 minute)**

### 3.3 Reminder Sender (Cloud Function — Pub/Sub subscriber)

**Purpose:** Check which users need reminders at the current minute and send them.

**Trigger:** Pub/Sub message from scheduler

**Logic:**
```
1. Get current UTC time
2. Query all users where:
   telegram.enabled == true
   telegram.remindTime == current HH:mm (converted from user's timezone)
3. For each matching user:
   a. Read users/{uid}/plan/current
   b. Determine today's day key (in user's timezone)
   c. Get today's workout from plan.days[todayKey]
   d. Format message
   e. Send via Telegram Bot API
```

**Optimization for scale:**
- Use a Firestore collection `reminderQueue` with documents keyed by `{userId}_{HHmm}` to avoid scanning all users
- Or maintain a `reminders` collection with documents `{ time: "07:00", timezone: "Asia/Jakarta", userIds: [...] }`

---

## 4. Message Templates

### Gym Day
```
🏋️ *Today's Workout: Push*

*Exercises:*
1. Smith Machine Bench Press — 3 sets
2. Smith Machine Incline Press — 3 sets
3. Machine Chest Fly — 3 sets
4. Tricep Pushdown — 3 sets
5. Lateral Raise — 3 sets

📝 *Notes:* Transisi beban: Set 1 adaptasi, Set 2-3 naik.

[Log workout →](https://hybridtrack.web.app)
```

### Run Day
```
🏃 *Today's Run: Easy Run*

📍 *Distance:* 3.5 km
⏱ *Target Pace:* 7:30/km
💪 *Effort:* Easy (RPE 3-4)

📝 *Notes:* Kalau napas mulai berat, selingi jalan 45–60 detik.

[Log workout →](https://hybridtrack.web.app)
```

### Rest Day
```
😴 *Today is a Rest Day*

Take time to recover. Focus on:
• Sleep quality
• Nutrition
• Mobility / stretching

See you tomorrow! 💪
```

### No Plan
```
📋 *No plan found for today.*

Your coach hasn't set a plan for this week yet.
Check the web app for updates.
```

---

## 5. Implementation Plan

### Phase 1 — Bot Setup (Week 1)
1. Create Telegram Bot via [@BotFather](https://t.me/botfather)
2. Store bot token in Firebase Secrets / Environment variables
3. Deploy webhook Cloud Function
4. Implement `/start` command with email-based pairing

### Phase 2 — Reminder Engine (Week 2)
1. Create Cloud Scheduler job (every 1 minute)
2. Create Pub/Sub topic
3. Deploy reminder sender Cloud Function
4. Implement timezone-aware scheduling logic
5. Test with manual Firestore entries

### Phase 3 — User Management (Week 3)
1. Add Telegram settings UI to HybridTrack web app
2. Implement `/time`, `/timezone`, `/on`, `/off`, `/status` commands
3. Add pairing flow (code-based or email-based)
4. Error handling and retry logic

### Phase 4 — Polish & Scale (Week 4)
1. Add message formatting with emoji and markdown
2. Implement rate limiting (max 1 reminder per user per day)
3. Add logging and monitoring (Cloud Logging)
4. Write Firestore security rules for `telegram` collection
5. Load test with simulated users

---

## 6. Firebase Services Required

| Service | Purpose | Estimated Cost |
|---|---|---|
| **Cloud Functions** (Node.js 20) | Webhook handler + reminder sender | ~$0 (free tier: 2M invocations/month) |
| **Cloud Scheduler** | Trigger every minute | ~$0 (free tier: 3 jobs) |
| **Pub/Sub** | Message queue between scheduler and function | ~$0 (free tier: 10GB messages) |
| **Firestore** | Store telegram settings + read plans | Already provisioned |
| **Firebase Secrets** | Store bot token securely | Free |

**Estimated total: $0/month** (within free tier limits for <100 users)

---

## 7. Security Considerations

### Bot Token
- Store in Firebase Secrets (not in code or config)
- Rotate periodically via BotFather

### User Data
- `chatId` is PII — ensure Firestore security rules restrict access
- Only the owning user and admin functions can read/write `telegram` settings

### Firestore Security Rules
```javascript
match /users/{userId}/telegram {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  // Cloud Functions use admin SDK (bypasses rules)
}
```

### Rate Limiting
- Max 1 reminder per user per day (enforced in sender function)
- Bot commands rate-limited to 30 messages/second (Telegram API limit)

---

## 8. Scalability Considerations

### Current scale (<100 users)
- Simple query: scan all users with `telegram.enabled == true`
- Process sequentially or with Promise.all (max 100 concurrent)

### Future scale (100–10,000 users)
- Use **sharded reminder queue**: `reminders/{time}_{timezone}` documents containing arrays of userIds
- Use **batch processing**: process users in chunks of 500
- Use **Cloud Tasks** for precise scheduling per user

### Future scale (10,000+ users)
- Move to **dedicated worker** (Cloud Run job) instead of Cloud Functions
- Use **Firestore collection group query** with composite indexes
- Implement **staggered delivery** to avoid Telegram API rate limits

---

## 9. Error Handling

| Scenario | Handling |
|---|---|
| User deleted bot | Catch 403 from Telegram API → disable reminders for that user |
| Firestore read failure | Retry 3 times with exponential backoff |
| Invalid timezone | Default to UTC |
| Plan document missing | Send "No plan" message |
| Rate limited by Telegram | Queue and retry after `retry_after` seconds |

---

## 10. Monitoring & Logging

- **Cloud Logging:** Structured logs for each reminder attempt
- **Metric:** `reminders_sent_total` (counter)
- **Metric:** `reminders_failed_total` (counter, with error type label)
- **Alert:** If failure rate > 5% in 1 hour
- **Dashboard:** Cloud Monitoring dashboard with:
  - Reminders sent per day
  - Active users
  - Error rate by type

---

## 11. Directory Structure

```
hybridtrack/
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # Export all functions
│   │   ├── telegram-webhook.ts   # Bot command handler
│   │   ├── reminder-sender.ts    # Pub/Sub subscriber
│   │   ├── utils/
│   │   │   ├── telegram.ts       # Telegram API client
│   │   │   ├── plan.ts           # Plan reading + formatting
│   │   │   ├── timezone.ts       # Timezone utilities
│   │   │   └── logger.ts         # Structured logging
│   │   └── types/
│   │       └── index.ts          # TypeScript interfaces
│   └── .env.example
├── TELEGRAM_REMINDER_ARCHITECTURE.md
```

---

## 12. Next Steps

1. ✅ Architecture design complete
2. ⬜ Create Telegram Bot via BotFather
3. ⬜ Initialize Firebase Functions project
4. ⬜ Implement webhook handler
5. ⬜ Implement reminder sender
6. ⬜ Add pairing UI to HybridTrack web app
7. ⬜ Deploy and test with real users
