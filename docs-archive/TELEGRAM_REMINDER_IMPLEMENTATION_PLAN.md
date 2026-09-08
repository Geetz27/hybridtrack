# Telegram Reminder System — Implementation Plan

## Overview

This document provides a step-by-step implementation plan for the Telegram reminder system. It covers Firestore collections, Telegram bot flow, user onboarding, Cloud Functions design, scheduler design, security, and deployment.

---

## 1. Firestore Collections

### 1.1 `users/{uid}/telegram`

Stores each user's Telegram bot settings.

```typescript
// Document ID: "settings" (singleton per user)
interface TelegramSettings {
  chatId: string;          // Telegram chat ID (e.g., "123456789")
  enabled: boolean;        // true = send reminders
  remindTime: string;      // HH:mm in user's timezone (e.g., "07:00")
  timezone: string;        // IANA timezone (e.g., "Asia/Jakarta")
  lastRemindedDate: string; // YYYY-MM-DD — prevents duplicate reminders
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Security rules:**
```javascript
match /users/{userId}/telegram/{document} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### 1.2 `users/{uid}/plan/current` (existing)

Read by the reminder sender to determine today's workout.

### 1.3 `reminderLogs/{logId}` (optional, for monitoring)

```typescript
interface ReminderLog {
  userId: string;
  chatId: string;
  date: string;            // YYYY-MM-DD
  sentAt: Timestamp;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
  messageType: 'gym' | 'run' | 'rest' | 'no_plan';
}
```

---

## 2. Telegram Bot Flow

### 2.1 Bot Creation

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow prompts:
   - Bot name: `HybridTrack Reminder`
   - Username: `hybridtrack_reminder_bot`
3. Save the API token: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`
4. Enable inline mode (optional)
5. Set bot profile picture and description

### 2.2 Webhook Registration

```bash
# Register webhook URL
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://us-central1-hybrid-track.cloudfunctions.net/telegramWebhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### 2.3 Bot Commands

| Command | Description | Handler Logic |
|---|---|---|
| `/start` | Begin registration | Check if user exists → prompt for email or send pairing code |
| `/help` | Show available commands | Send list of commands |
| `/time HH:mm` | Set reminder time | Validate format → update Firestore |
| `/timezone <IANA>` | Set timezone | Validate IANA string → update Firestore |
| `/on` | Enable reminders | Set `enabled: true` in Firestore |
| `/off` | Disable reminders | Set `enabled: false` in Firestore |
| `/status` | Show current settings | Read Firestore → format response |
| `/plan` | Show today's workout | Read plan → format message |
| `/unlink` | Unlink Telegram from account | Delete `telegram` document |

### 2.4 Command Handler Pseudocode

```typescript
// telegram-webhook.ts
export const telegramWebhook = onRequest(async (req, res) => {
  const update = req.body;
  if (!update.message) { res.sendStatus(200); return; }

  const { chat, text } = update.message;
  const chatId = chat.id.toString();
  const command = text.split(' ')[0];
  const args = text.split(' ').slice(1).join(' ');

  switch (command) {
    case '/start':
      await handleStart(chatId);
      break;
    case '/time':
      await handleSetTime(chatId, args);
      break;
    case '/timezone':
      await handleSetTimezone(chatId, args);
      break;
    case '/on':
      await handleEnable(chatId);
      break;
    case '/off':
      await handleDisable(chatId);
      break;
    case '/status':
      await handleStatus(chatId);
      break;
    case '/plan':
      await handlePlan(chatId);
      break;
    case '/unlink':
      await handleUnlink(chatId);
      break;
    default:
      await sendMessage(chatId, 'Unknown command. Send /help for available commands.');
  }

  res.sendStatus(200);
});
```

---

## 3. User Onboarding

### 3.1 Flow Diagram

```
User opens Telegram bot
        │
        ▼
  Sends /start
        │
        ▼
  Bot replies:
  "Welcome to HybridTrack Reminders!
   To link your account, please enter your
   registered email address:"
        │
        ▼
  User sends email (e.g., "user@example.com")
        │
        ▼
  Bot queries Firestore:
  - Find user by email (requires email index)
  - If found: write chatId to users/{uid}/telegram
  - If not found: reply "Email not found. Please use the email you registered with."
        │
        ▼
  Bot replies:
  "✅ Account linked successfully!
   Your default reminder time is 07:00.
   Use /time HH:mm to change it.
   Use /timezone Asia/Jakarta to set your timezone.
   Use /on to enable reminders."
```

### 3.2 Firestore Index Required

```javascript
// Composite index on users collection for email lookup
// Collection: users
// Fields: email (Ascending)
```

### 3.3 Alternative: Code-Based Pairing

If email lookup is not desired:

1. User clicks "Link Telegram" button in HybridTrack web app
2. Web app generates a 6-digit code, stores it in `pairingCodes/{code}` with `userId` and `expiresAt`
3. User sends `/start <CODE>` to the bot
4. Bot looks up the code in Firestore, links the account
5. Code expires after 5 minutes

---

## 4. Cloud Functions Design

### 4.1 Function: `telegramWebhook`

| Property | Value |
|---|---|
| **Type** | `onRequest` (HTTP) |
| **Trigger** | POST from Telegram API |
| **Runtime** | Node.js 20 |
| **Memory** | 256 MB |
| **Timeout** | 30 seconds |
| **Environment variables** | `TELEGRAM_BOT_TOKEN` (from Firebase Secrets) |

**Responsibilities:**
- Parse incoming Telegram updates
- Route commands to handlers
- Send responses via Telegram API
- Log all interactions

### 4.2 Function: `sendReminders`

| Property | Value |
|---|---|
| **Type** | `onMessagePublished` (Pub/Sub) |
| **Trigger** | Topic: `reminder-tick` |
| **Runtime** | Node.js 20 |
| **Memory** | 512 MB |
| **Timeout** | 540 seconds (9 minutes) |
| **Environment variables** | `TELEGRAM_BOT_TOKEN` |

**Responsibilities:**
- Get current UTC time
- Query all `users/{uid}/telegram` where `enabled == true`
- For each user, check if `remindTime` matches current time in their timezone
- Read `users/{uid}/plan/current`
- Format and send message
- Update `lastRemindedDate`
- Log result to `reminderLogs`

### 4.3 Function: `createDefaultSettings` (optional)

| Property | Value |
|---|---|
| **Type** | `onDocumentCreated` |
| **Trigger** | Firestore: `users/{uid}/telegram` (on create) |
| **Runtime** | Node.js 20 |
| **Memory** | 128 MB |
| **Timeout** | 60 seconds |

**Responsibilities:**
- When a new `telegram` document is created, set default values if not provided
- Send a welcome message to the user

### 4.4 Package Dependencies

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "telegraf": "^4.16.0",
    "moment-timezone": "^0.5.45"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

---

## 5. Scheduler Design

### 5.1 Cloud Scheduler Job

```bash
# Create Pub/Sub topic
gcloud pubsub topics create reminder-tick

# Create Cloud Scheduler job (every 1 minute)
gcloud scheduler jobs create pubsub reminder-every-minute \
  --schedule="* * * * *" \
  --topic=reminder-tick \
  --message-body="{}" \
  --time-zone="UTC" \
  --location=us-central1
```

### 5.2 Reminder Sender Logic (Detailed)

```typescript
export const sendReminders = onMessagePublished(
  { topic: 'reminder-tick', memory: '512MB', timeoutSeconds: 540 },
  async (event) => {
    const now = new Date();
    const utcHours = now.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0');
    const utcTime = `${utcHours}:${utcMinutes}`;
    const todayDate = now.toISOString().split('T')[0];

    // Get all users with telegram enabled
    const usersSnapshot = await admin.firestore()
      .collectionGroup('telegram')
      .where('enabled', '==', true)
      .get();

    const promises: Promise<void>[] = [];

    usersSnapshot.forEach((doc) => {
      const settings = doc.data() as TelegramSettings;
      const userId = doc.ref.path.split('/')[1];

      // Skip if already reminded today
      if (settings.lastRemindedDate === todayDate) return;

      // Convert user's remindTime to UTC
      const userTime = moment.tz(settings.remindTime, 'HH:mm', settings.timezone);
      const utcRemindTime = userTime.clone().utc();
      const utcRemindStr = utcRemindTime.format('HH:mm');

      // Check if current UTC time matches user's remind time
      if (utcTime !== utcRemindStr) return;

      // Send reminder
      promises.push(sendReminderForUser(userId, settings, todayDate));
    });

    await Promise.allSettled(promises);
  }
);
```

### 5.3 Timezone Matching

The scheduler runs every minute in UTC. For each user:

1. Take the user's `remindTime` (e.g., "07:00") and `timezone` (e.g., "Asia/Jakarta")
2. Convert "07:00 Asia/Jakarta" to UTC using `moment-timezone`
3. If the resulting UTC time matches the current UTC minute, send the reminder

**Example:**
- User in Jakarta (UTC+7) sets remindTime to "07:00"
- UTC equivalent: "00:00"
- Scheduler at 00:00 UTC matches → sends reminder

---

## 6. Security Considerations

### 6.1 Bot Token Protection

```bash
# Store token in Firebase Secrets
firebase functions:secrets:set TELEGRAM_BOT_TOKEN

# Access in code
const { getSecret } = require('firebase-functions/secrets');
const botToken = process.env.TELEGRAM_BOT_TOKEN;
```

### 6.2 Webhook Verification

```typescript
// Verify that requests come from Telegram
// Telegram sends requests from known IP ranges:
// 149.154.160.0/20, 91.108.4.0/22, 91.108.56.0/22
// Optionally: use secret_token for additional verification

export const telegramWebhook = onRequest({
  // Set webhook with secret_token
  // Verify X-Telegram-Bot-Api-Secret-Token header
}, async (req, res) => {
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  if (secretToken !== process.env.WEBHOOK_SECRET) {
    res.status(403).send('Forbidden');
    return;
  }
  // ... handle update
});
```

### 6.3 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Telegram settings: only the owning user can read/write
    match /users/{userId}/telegram/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Reminder logs: only the owning user can read
    match /users/{userId}/reminderLogs/{logId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions (admin SDK) can write
    }

    // Plan: only the owning user can read
    match /users/{userId}/plan/{document} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6.4 Rate Limiting

```typescript
// In-memory rate limiter for bot commands
const rateLimit = new Map<string, number>();

function checkRateLimit(chatId: string): boolean {
  const now = Date.now();
  const lastCommand = rateLimit.get(chatId) || 0;
  if (now - lastCommand < 1000) return false; // Max 1 command per second
  rateLimit.set(chatId, now);
  return true;
}
```

---

## 7. Deployment Steps

### Step 1: Initialize Firebase Functions

```bash
# Navigate to project root
cd d:\Project Devara\hybridtrack

# Initialize Firebase Functions
firebase init functions

# Select TypeScript
# Install dependencies
cd functions
npm install telegraf moment-timezone firebase-admin firebase-functions
npm install -D typescript @types/node
```

### Step 2: Configure Environment

```bash
# Set bot token
firebase functions:secrets:set TELEGRAM_BOT_TOKEN

# Set webhook secret (optional)
firebase functions:secrets:set TELEGRAM_WEBHOOK_SECRET
```

### Step 3: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy individually
firebase deploy --only functions:telegramWebhook
firebase deploy --only functions:sendReminders
```

### Step 4: Register Webhook

```bash
# After deployment, get the function URL
# URL format: https://us-central1-<PROJECT_ID>.cloudfunctions.net/telegramWebhook

# Register webhook with Telegram
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://us-central1-hybrid-track.cloudfunctions.net/telegramWebhook",
    "secret_token": "<WEBHOOK_SECRET>",
    "allowed_updates": ["message"]
  }'
```

### Step 5: Create Scheduler

```bash
# Create Pub/Sub topic
gcloud pubsub topics create reminder-tick

# Create scheduler job
gcloud scheduler jobs create pubsub reminder-every-minute \
  --schedule="* * * * *" \
  --topic=reminder-tick \
  --message-body="{}" \
  --time-zone="UTC"
```

### Step 6: Set Bot Commands (via BotFather)

Send these commands to @BotFather:

```
/setcommands
start - Link your HybridTrack account
help - Show available commands
time - Set reminder time (e.g., /time 07:00)
timezone - Set your timezone (e.g., /timezone Asia/Jakarta)
on - Enable daily reminders
off - Disable daily reminders
status - Show your current settings
plan - Show today's workout plan
unlink - Unlink Telegram from your account
```

### Step 7: Test the System

```bash
# Test 1: Bot responds to /start
# Open Telegram, find @hybridtrack_reminder_bot, send /start

# Test 2: Link account
# Send registered email address

# Test 3: Configure settings
# Send /time 07:00
# Send /timezone Asia/Jakarta
# Send /on

# Test 4: Check status
# Send /status

# Test 5: View plan
# Send /plan

# Test 6: Verify reminder delivery
# Wait for scheduled time, check Telegram
```

### Step 8: Monitor

```bash
# View function logs
firebase functions:log

# View Cloud Scheduler logs
gcloud scheduler jobs describe reminder-every-minute

# View Pub/Sub metrics
gcloud pubsub topics list-messages reminder-tick
```

---

## 8. File Structure

```
hybridtrack/
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                    # Export all functions
│   │   ├── telegram-webhook.ts         # /start, /time, /timezone, etc.
│   │   ├── send-reminders.ts           # Pub/Sub subscriber
│   │   ├── utils/
│   │   │   ├── telegram.ts             # sendMessage(), formatMessage()
│   │   │   ├── plan-formatter.ts       # Format plan into Telegram message
│   │   │   ├── timezone.ts             # Timezone conversion utilities
│   │   │   ├── rate-limiter.ts         # Rate limiting logic
│   │   │   └── logger.ts              # Structured logging
│   │   └── types/
│   │       └── index.ts                # TypeScript interfaces
│   └── .env.example
├── TELEGRAM_REMINDER_ARCHITECTURE.md
├── TELEGRAM_REMINDER_IMPLEMENTATION_PLAN.md
```

---

## 9. Rollback Plan

If issues arise after deployment:

```bash
# Disable scheduler temporarily
gcloud scheduler jobs pause reminder-every-minute

# Remove webhook (stops bot from receiving commands)
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Rollback to previous function version
firebase deploy --only functions --except telegramWebhook,sendReminders
```

---

## 10. Success Criteria

| Criterion | Measurement |
|---|---|
| Bot responds to commands | Response time < 2 seconds |
| User can link account | Success rate > 95% |
| Reminders sent on time | Within 1 minute of scheduled time |
| No duplicate reminders | Zero duplicate sends per user per day |
| Error rate | < 1% of all reminder attempts |
| Cold start latency | < 5 seconds for webhook |
