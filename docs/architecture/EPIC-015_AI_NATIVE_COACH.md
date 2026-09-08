# EPIC-015 — AI Native Coach

## Complete Technical Design Document

> **Status:** Design Phase — Do Not Implement
> **Owner:** HybridTrack
> **Version:** 1.0

---

## Table of Contents

1. [Overall Architecture](#1-overall-architecture)
2. [Firestore Schema](#2-firestore-schema)
3. [Folder Structure](#3-folder-structure)
4. [React Component Changes](#4-react-component-changes)
5. [Data Flow Diagram](#5-data-flow-diagram)
6. [API Flow Diagram](#6-api-flow-diagram)
7. [AI Adapter Design](#7-ai-adapter-design)
8. [Athlete Profile Design](#8-athlete-profile-design)
9. [Prompt Builder Design](#9-prompt-builder-design)
10. [Training Block Generation Flow](#10-training-block-generation-flow)
11. [Security Considerations](#11-security-considerations)
12. [Migration Strategy](#12-migration-strategy)
13. [Risks](#13-risks)
14. [Future Extensibility](#14-future-extensibility)
15. [Recommended Implementation Phases](#15-recommended-implementation-phases)

---

## 1. Overall Architecture

### Current Architecture (Before EPIC-015)

```
User → HybridTrack UI → Manual Copy Prompt → DeepSeek (external) → Manual Import JSON
```

The user must leave HybridTrack every week to generate a new Training Block.

### Target Architecture (After EPIC-015)

```
User → HybridTrack UI
         ↓
    Coach Workspace
         ↓
    "Generate Next Block"
         ↓
    Prompt Builder (auto-assembles Athlete Profile + Knowledge + Coach Report)
         ↓
    AI Adapter Layer
         ↓
    DeepSeek API (or any provider)
         ↓
    Parser (extracts JSON from response)
         ↓
    Validator (existing)
         ↓
    Normalizer (existing)
         ↓
    Preview (new UI component)
         ↓
    Approve → Auto-activate Training Block
```

The user never leaves HybridTrack.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Adapter pattern** for AI providers | UI never calls DeepSeek directly. Swap providers without changing UI code. |
| **Athlete Profile as structured Firestore data** | Not a markdown prompt. Enables deterministic queries, future features, and schema evolution. |
| **Existing Validator + Normalizer reused** | No duplicate business logic. The same gatekeepers used for manual imports also protect AI-generated blocks. |
| **Preview step before activation** | User retains control. AI output is reviewed, validated, and approved before it becomes active. |
| **API key stored in localStorage** | Pragmatic for frontend-only MVP. Documented security tradeoffs. Backend migration path described. |

---

## 2. Firestore Schema

### 2.1 Athlete Profile

**Collection:** `users/{userId}/profile/athlete`

Single document per user.

```javascript
{
  // ─── Identity ───
  name: "Athlete Name",           // string, required
  primaryGoal: "Fat Loss",        // string enum: "Fat Loss" | "Muscle Gain" | "Endurance" | "General Fitness" | "Race Preparation"
  targetRace: "BayRun 10K",       // string, optional
  targetRaceDate: "2026-09-15",   // ISO date string, optional

  // ─── Experience & Availability ───
  experienceLevel: "Intermediate", // string enum: "Beginner" | "Intermediate" | "Advanced"
  weeklyAvailability: 5,           // number, sessions per week (1-7)

  // ─── Preferences ───
  preferredGymSplit: "Push/Pull/Legs",  // string enum: "Push/Pull/Legs" | "Upper/Lower" | "Full Body" | "Custom"
  preferredRunningStructure: "3 runs/week", // string, free text

  // ─── Coaching Philosophy ───
  coachingPhilosophy: "Progressive overload with deload every 4th week", // string, free text
  progressionRules: "Increase weight when 3×12 is achieved with good form", // string, free text
  recoveryRules: "Deload if RPE > 8 for 2 consecutive sessions", // string, free text

  // ─── AI Configuration ───
  aiProvider: "deepseek",          // string enum: "deepseek" | "openai" | "gemini" | "claude"
  aiModel: "deepseek-chat",        // string, model name

  // ─── Metadata ───
  createdAt: Timestamp,            // Firestore server timestamp
  updatedAt: Timestamp,            // Firestore server timestamp
  schemaVersion: 1                 // number, for future migrations
}
```

**Design rationale:**
- Single document avoids subcollection complexity.
- `schemaVersion` enables future field additions without breaking existing documents.
- Enums are stored as strings for readability in Firestore console.
- Optional fields (`targetRace`, `targetRaceDate`) are nullable — no breaking change when set later.

### 2.2 AI Settings (Embedded in Athlete Profile)

The `aiProvider` and `aiModel` fields live inside the Athlete Profile document.

The API key is **not** stored in Firestore (see [Security Considerations](#11-security-considerations)).

### 2.3 No Other Schema Changes

- `trainingBlocks` collection — unchanged.
- `workouts` collection — unchanged.
- `plan` document — unchanged.
- No new collections needed.

---

## 3. Folder Structure

### New Files

```
src/
  services/
    ai/
      adapter.js          ← Unified interface: generateTrainingBlock()
      deepseek.js         ← DeepSeek API client (fetch wrapper)
      promptBuilder.js    ← Assembles Athlete Profile + Knowledge + Coach Report into prompt
      parser.js           ← Extracts JSON from LLM response (handles markdown fences, extra text)
      validator.js        ← Thin wrapper around existing trainingBlockValidator.js
  components/
    coach/
      AthleteProfileModal.jsx   ← Edit Athlete Profile form
      TrainingBlockPreview.jsx  ← Preview + Approve generated block
      AiSettingsModal.jsx       ← Provider, model, API key, test connection
```

### Modified Files

```
src/App.jsx                     ← Add Athlete Profile fetch, wire "Generate Next Block" flow
src/utils/aiAdapter.js          ← Deprecated — logic moves to services/ai/promptBuilder.js
```

### Files That Stay Unchanged

```
src/utils/trainingBlockValidator.js   ← Reused as-is
src/utils/trainingBlockNormalizer.js  ← Reused as-is
src/utils/knowledge.js                ← Reused as-is
src/utils/coachReport.js              ← Reused as-is
src/utils/coachInsight.js             ← Reused as-is
src/utils/planning.js                 ← Reused as-is
src/utils/trainingPlayground.js       ← Unchanged
```

---

## 4. React Component Changes

### 4.1 App.jsx Changes

**Add:**
- Fetch Athlete Profile from `users/{uid}/profile/athlete` via `onSnapshot`.
- Pass `athleteProfile` and `aiSettings` (from localStorage) to `CoachWorkspace`.
- Wire `handleGenerateBlock` callback that orchestrates the generation flow.

**Remove:**
- The "Copy AI Prompt" button in Advanced Tools (replaced by "Generate Next Block").

**No changes to:**
- Dashboard, QuickInput, History, WeeklyPlanTab, WeeklyTrainingBlock.

### 4.2 CoachWorkspace Changes

**Insight Tab — reorder sections to:**

1. **Today's Recommendation** (existing, unchanged)
2. **Current Training Block** (existing, unchanged)
3. **Weekly Progress** (existing, unchanged — inside WeeklyTrainingBlock)
4. **Coach Insight** (existing, unchanged — Knowledge Snapshot metrics)
5. **Alerts** (existing, unchanged)
6. **Weekly Review** (existing, unchanged)
7. **Generate Next Block** (existing, unchanged)
8. **Advanced Tools** (existing, collapsed, unchanged)

**Add to Insight Tab:**
- "Generate Next Block" section now has a primary CTA button that opens the generation flow (instead of just linking to Pipeline tab).

**Pipeline Tab — replace with Generation Flow:**
- Remove the current Pipeline tab content (Knowledge Snapshot → Coach Report → AI Request steps).
- Replace with a single "Generate Next Block" flow that shows:
  1. Loading state (building prompt, calling API, parsing response, validating)
  2. TrainingBlockPreview component (if generation succeeds)
  3. Error state (if generation fails, with retry button)

**Add new sub-components:**
- `AthleteProfileModal` — slide-up modal for editing profile.
- `AiSettingsModal` — slide-up modal for API key, provider, model.
- `TrainingBlockPreview` — shows generated block with Approve/Reject buttons.

### 4.3 New Component: AthleteProfileModal

- Slide-up modal (reuse existing modal pattern from ImportTrainingBlockModal).
- Form fields matching the Athlete Profile schema.
- Save to Firestore `users/{uid}/profile/athlete`.
- Validation: required fields, enum values, number ranges.

### 4.4 New Component: AiSettingsModal

- Fields: Provider (dropdown), Model (text input), API Key (password input), Test Connection button.
- API key stored in `localStorage` key: `hybridtrack_ai_api_key`.
- Provider + Model stored in Athlete Profile (Firestore).
- Test Connection: calls a lightweight endpoint (e.g., list models) to verify the key works.

### 4.5 New Component: TrainingBlockPreview

- Renders the generated Training Block in a read-only view.
- Shows validation errors (if any) with inline highlighting.
- "Approve" button → normalizes + saves to Firestore as active block.
- "Reject" button → discards, returns to Coach Workspace.
- "Regenerate" button → retries with same inputs.

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Coach Workspace                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ Insight Tab   │    │ Pipeline Tab     │    │ Settings         │  │
│  │ (default)     │    │ (generation      │    │ (Profile + AI)   │  │
│  │               │    │  flow)           │    │                  │  │
│  │ • Recommend   │    │                  │    │ • Edit Profile   │  │
│  │ • Block       │    │ 1. Build Prompt  │    │ • AI Settings    │  │
│  │ • Progress    │    │ 2. Call API      │    │                  │  │
│  │ • Insight     │    │ 3. Parse         │    └──────────────────┘  │
│  │ • Alerts      │    │ 4. Validate      │                          │
│  │ • Review      │    │ 5. Preview       │                          │
│  │ • Generate    │    │ 6. Approve       │                          │
│  │ • Advanced    │    └──────────────────┘                          │
│  └──────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│ Knowledge Engine │    │   AI Adapter Layer   │
│ (existing)       │    │                      │
│                  │    │ promptBuilder.js     │
│ knowledge.js     │    │ deepseek.js          │
│ coachReport.js   │    │ parser.js            │
│ coachInsight.js  │    │ validator.js         │
└─────────────────┘    └──────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────────┐
│   Firestore     │    │   DeepSeek API       │
│                  │    │   (external)         │
│ workouts        │    │                      │
│ trainingBlocks  │    │ POST /chat/completions│
│ profile/athlete │    └──────────────────────┘
└─────────────────┘
```

---

## 6. API Flow Diagram

```
User clicks "Generate Next Block"
         │
         ▼
[1] Build Prompt
    ├── Read Athlete Profile (Firestore)
    ├── Generate Knowledge Snapshot (existing)
    ├── Build Coach Report (existing)
    ├── Read Current Training Block (if any)
    ├── Read Recent Workouts (last 2 weeks)
    └── Assemble into structured prompt
         │
         ▼
[2] Call AI API
    ├── Read API key from localStorage
    ├── Read provider/model from Athlete Profile
    ├── POST to provider endpoint
    └── Receive raw response
         │
         ▼
[3] Parse Response
    ├── Strip markdown code fences
    ├── Extract JSON object
    └── Handle errors (invalid JSON, empty response, API error)
         │
         ▼
[4] Validate (existing validator)
    ├── If invalid → show errors to user, offer retry
    └── If valid → continue
         │
         ▼
[5] Normalize (existing normalizer)
    └── Apply defaults, canonicalize enums
         │
         ▼
[6] Preview
    ├── Show TrainingBlockPreview component
    ├── User reviews sessions, exercises, distances
    └── User clicks Approve or Reject
         │
         ▼
[7] Approve → Save to Firestore
    ├── Set status: "active"
    ├── Set importedAt: serverTimestamp()
    ├── Save to users/{uid}/trainingBlocks/{blockId}
    └── Coach Workspace refreshes → new block visible
```

---

## 7. AI Adapter Design

### 7.1 Unified Interface

```javascript
// src/services/ai/adapter.js

/**
 * Generate a Training Block using the configured AI provider.
 *
 * @param {object} options
 * @param {object} options.athleteProfile  - Athlete Profile from Firestore
 * @param {object} options.knowledge       - Knowledge Snapshot from generateKnowledgeSnapshot()
 * @param {string} options.coachReport     - Markdown coach report from buildCoachReport()
 * @param {object} [options.currentBlock]  - Current active Training Block (for progressive coaching)
 * @param {Array}  [options.recentWorkouts]- Last 14 days of workouts
 * @param {string} options.apiKey          - API key from localStorage
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function generateTrainingBlock(options) {
  // 1. Build prompt
  const prompt = buildPrompt(options);

  // 2. Call provider
  const provider = options.athleteProfile.aiProvider || 'deepseek';
  const model = options.athleteProfile.aiModel || 'deepseek-chat';
  const rawResponse = await callProvider(provider, model, prompt, options.apiKey);

  // 3. Parse
  const parsed = parseResponse(rawResponse);
  if (!parsed.success) return parsed;

  // 4. Validate (existing)
  const validation = validateTrainingBlock(parsed.data);
  if (!validation.valid) {
    return { success: false, error: `Validation failed: ${validation.errors.join('; ')}` };
  }

  // 5. Normalize (existing)
  const normalized = normalizeTrainingBlock(parsed.data);

  return { success: true, data: normalized };
}
```

### 7.2 Provider Implementation

```javascript
// src/services/ai/deepseek.js

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

export async function callDeepSeek(messages, apiKey, model = 'deepseek-chat') {
  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,  // Low temperature for consistent JSON output
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 7.3 Provider Registry

```javascript
// Inside adapter.js

const PROVIDERS = {
  deepseek: callDeepSeek,
  // Future:
  // openai: callOpenAI,
  // gemini: callGemini,
  // claude: callClaude,
};

async function callProvider(provider, model, messages, apiKey) {
  const handler = PROVIDERS[provider];
  if (!handler) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }
  return handler(messages, apiKey, model);
}
```

---

## 8. Athlete Profile Design

### 8.1 Schema (Firestore Document)

See [Section 2.1](#21-athlete-profile).

### 8.2 UI Form

The Athlete Profile modal should have these sections:

**Section 1: Identity**
- Name (text input)
- Primary Goal (dropdown: Fat Loss, Muscle Gain, Endurance, General Fitness, Race Preparation)
- Target Race (text input, optional)
- Target Race Date (date picker, optional)

**Section 2: Experience & Availability**
- Experience Level (dropdown: Beginner, Intermediate, Advanced)
- Weekly Availability (number input, 1-7)

**Section 3: Preferences**
- Preferred Gym Split (dropdown: Push/Pull/Legs, Upper/Lower, Full Body, Custom)
- Preferred Running Structure (text input, e.g., "3 runs/week")

**Section 4: Coaching Philosophy**
- Coaching Philosophy (textarea)
- Progression Rules (textarea)
- Recovery Rules (textarea)

### 8.3 Validation Rules

- `name`: required, non-empty, max 100 chars.
- `primaryGoal`: required, must be one of the enum values.
- `experienceLevel`: required, must be one of the enum values.
- `weeklyAvailability`: required, integer 1-7.
- `targetRaceDate`: if provided, must be a valid future date.
- All text fields: max 500 chars.

### 8.4 Progressive Coaching Data Flow

The Athlete Profile enables progressive coaching because:

1. **Long-term goal** (e.g., "BayRun 10K on 15 Sep") is stored as structured data.
2. **Every generated block** includes this goal in the prompt.
3. **Previous completion data** (from Knowledge Snapshot) shows what was done.
4. **Running/strength trends** show direction of progress.
5. **Coach insight** provides qualitative assessment.

The AI receives all of this context and can adjust volume, intensity, and exercise selection accordingly.

---

## 9. Prompt Builder Design

### 9.1 Architecture

```javascript
// src/services/ai/promptBuilder.js

/**
 * Build the complete prompt for Training Block generation.
 *
 * Pure function. No side effects.
 *
 * @param {object} options
 * @param {object} options.athleteProfile  - Athlete Profile from Firestore
 * @param {object} options.knowledge       - Knowledge Snapshot
 * @param {string} options.coachReport     - Markdown coach report
 * @param {object} [options.currentBlock]  - Current active Training Block (or null)
 * @param {Array}  [options.recentWorkouts]- Last 14 days of workouts
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildPrompt(options) {
  // ... see below for structure
}
```

### 9.2 Prompt Structure

**System Prompt** (static, defines AI behavior):

```
You are an expert running and strength coach AI assistant for HybridTrack.

Your role is to analyse athlete data and generate a personalised Training Block
in JSON format.

=== GUIDELINES ===
- Base all output strictly on the data provided.
- Acknowledge progress and be constructive about areas needing improvement.
- Never give medical advice.
- Use plain language for descriptions.
- When suggesting workout changes, be specific.

=== PROGRESSIVE COACHING ===
- Every generated block must continue from previous weeks.
- Consider: previous completion, running trend, strength trend, recovery,
  coach insight, athlete profile, target race.
- The athlete is working toward their target race date.
- Adjust volume and intensity based on long-term progression.

=== OUTPUT FORMAT ===
You MUST respond with valid JSON only. No markdown, no code fences,
no explanation outside the JSON.

[Schema definition — same as current aiAdapter.js]
```

**User Prompt** (dynamic, assembled from data):

```
=== ATHLETE PROFILE ===
Name: {name}
Primary Goal: {primaryGoal}
Target Race: {targetRace} ({targetRaceDate})
Experience Level: {experienceLevel}
Weekly Availability: {weeklyAvailability}
Preferred Gym Split: {preferredGymSplit}
Preferred Running Structure: {preferredRunningStructure}
Coaching Philosophy: {coachingPhilosophy}
Progression Rules: {progressionRules}
Recovery Rules: {recoveryRules}

=== CURRENT TRAINING BLOCK ===
{currentBlock JSON or "No active block"}

=== RECENT WORKOUTS (Last 14 Days) ===
{recentWorkouts formatted as table}

=== ATHLETE METRICS ===
{knowledge snapshot — same format as current aiAdapter.js}

=== WEEKLY COACH REPORT ===
{coachReport}

Generate a Training Block for the upcoming week.
Respond with valid JSON following the output format specified in the system prompt.
```

### 9.3 What Changes from Current aiAdapter.js

| Current | New |
|---------|-----|
| `buildDeepSeekRequest()` | `buildPrompt()` |
| Accepts `athleteBrain` (free-form object) | Accepts `athleteProfile` (structured Firestore data) |
| No current block context | Includes current Training Block for progressive coaching |
| No recent workouts | Includes last 14 days of workouts |
| Static system prompt | System prompt includes progressive coaching guidelines |

The old `aiAdapter.js` can be deprecated once the new `promptBuilder.js` is complete.

---

## 10. Training Block Generation Flow

### 10.1 User Journey

```
1. User opens Coach Workspace → Insight tab
2. User sees "Generate Next Block" section
3. User clicks "Generate Next Block" button
4. System checks:
   a. Is Athlete Profile complete? If not → prompt to complete
   b. Is API key configured? If not → prompt to configure
5. Generation starts:
   a. Loading state: "Building prompt..."
   b. Loading state: "Calling AI..."
   c. Loading state: "Parsing response..."
   d. Loading state: "Validating..."
6. Success → TrainingBlockPreview shown
   a. User reviews sessions
   b. User clicks "Approve" or "Reject"
7. Approve → block saved to Firestore, Coach Workspace refreshes
8. Reject → return to Coach Workspace, no changes
```

### 10.2 State Machine

```
IDLE → CHECKING_CONFIG → GENERATING → PARSING → VALIDATING → PREVIEW
  │                        │            │          │
  │                        │            │          └→ ERROR (show validation errors)
  │                        │            └→ ERROR (parse failed, retry)
  │                        └→ ERROR (API error, retry)
  └→ CONFIG_ERROR (prompt to complete profile/set API key)
```

### 10.3 Error Handling

| Error | User Experience |
|-------|----------------|
| API key missing | Show AiSettingsModal |
| Profile incomplete | Show AthleteProfileModal with missing fields highlighted |
| API call fails (network) | Show error with "Retry" button |
| API returns invalid JSON | Show error with "Retry" button |
| Validation fails | Show validation errors inline in TrainingBlockPreview |
| Rate limited | Show "Please wait 60 seconds" with countdown |

### 10.4 Loading States

Each step in the generation flow should show:
- A spinner or progress indicator
- A text label (e.g., "Calling AI...")
- Estimated time (for API call: "This usually takes 10-15 seconds")

---

## 11. Security Considerations

### 11.1 API Key Storage

**Frontend-only (Phase 1):**

Store the API key in `localStorage` under key `hybridtrack_ai_api_key`.

```javascript
// Save
localStorage.setItem('hybridtrack_ai_api_key', apiKey);

// Read
const apiKey = localStorage.getItem('hybridtrack_ai_api_key');

// Delete
localStorage.removeItem('hybridtrack_ai_api_key');
```

**Security tradeoffs:**

| Risk | Mitigation |
|------|------------|
| XSS attack could read localStorage | Sanitize all user input. Use Content Security Policy headers. |
| Physical access to device | API key is accessible to anyone with device access. Same as any other localStorage credential. |
| No encryption at rest | localStorage is not encrypted. Consider using `crypto.subtle` to encrypt before storing (adds complexity, still vulnerable to XSS). |
| Key visible in DevTools | Any user can open DevTools → Application → Local Storage and read the key. |

**Recommendation for Phase 1:**
- Accept the localStorage approach as pragmatic for a frontend-only MVP.
- Document clearly that the API key is visible in DevTools.
- Recommend users create a limited-scope API key (no billing access).

### 11.2 Backend Migration (Future)

When a backend is introduced:

1. API key moves to server-side environment variable.
2. Frontend sends generation requests to own backend endpoint.
3. Backend calls DeepSeek API with the server-side key.
4. User never sees or handles the API key.
5. Rate limiting and usage tracking become possible.

### 11.3 Firestore Security Rules

The Athlete Profile document should have the same security rules as existing user data:

```
match /users/{userId}/profile/athlete {
  allow read, write: if request.auth.uid == userId;
}
```

### 11.4 API Key Validation

The "Test Connection" button should:
1. Make a minimal API call (e.g., list models or a cheap completion).
2. Show success/failure immediately.
3. Never log the API key to console or Firestore.

---

## 12. Migration Strategy

### 12.1 What Changes for Existing Users

| Aspect | Current | After EPIC-015 |
|--------|---------|----------------|
| Athlete Profile | Not stored | Created on first visit to Coach Workspace (with defaults) |
| AI Settings | Not configured | Prompted on first "Generate Next Block" click |
| Training Blocks | Manual import | Auto-generated + preview |
| Coach Workspace | Pipeline tab shows steps | Pipeline tab replaced with generation flow |
| Advanced Tools | Copy AI Prompt button | Removed (replaced by generation flow) |

### 12.2 Backward Compatibility

- **Existing Training Blocks** remain active. No data migration needed.
- **Existing Weekly Plans** remain functional. No changes to plan schema.
- **Manual import** still works. The Import button in WeeklyPlanTab is unchanged.
- **Existing workouts** are unaffected.

### 12.3 Default Athlete Profile

For existing users who have never set up an Athlete Profile:

```javascript
const DEFAULT_ATHLETE_PROFILE = {
  name: user.displayName || 'Athlete',
  primaryGoal: 'General Fitness',
  experienceLevel: 'Intermediate',
  weeklyAvailability: 5,
  preferredGymSplit: 'Push/Pull/Legs',
  preferredRunningStructure: '3 runs/week',
  coachingPhilosophy: '',
  progressionRules: '',
  recoveryRules: '',
  aiProvider: 'deepseek',
  aiModel: 'deepseek-chat',
  schemaVersion: 1,
};
```

This is created automatically when the user first visits the Coach Workspace after EPIC-015 is deployed.

### 12.4 Feature Flag

Consider wrapping the generation flow behind a feature flag:

```javascript
const AI_GENERATION_ENABLED = true; // Toggle for gradual rollout
```

This allows:
- Testing on staging before production.
- Disabling generation if the AI provider has an outage.
- Gradual rollout to users.

---

## 13. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| DeepSeek API returns invalid JSON | Generation fails | Medium | Parser handles markdown fences, extra text, partial JSON. Retry button. |
| API key exposed via XSS | Key compromised | Low | CSP headers, input sanitization. User can revoke key. |
| AI generates unsafe workouts | User injury | Low | Validator checks session count (4-7), exercise structure. Preview step lets user reject. |
| API rate limiting | Generation delayed | Medium | Show user-friendly message. Retry after delay. |
| User closes tab during generation | Incomplete flow | Low | Generation is synchronous within the tab. No partial state persisted. |
| Athlete Profile not filled in | Poor generation quality | Medium | Prompt user to complete profile before first generation. Use defaults for missing fields. |
| Provider outage | Cannot generate | Low | Error message with "Try again later." No data loss. |

---

## 14. Future Extensibility

### 14.1 New AI Providers

Adding a new provider requires:
1. Create `src/services/ai/{provider}.js` with the API call function.
2. Add the provider to the registry in `adapter.js`.
3. Add the provider name to the dropdown in `AiSettingsModal`.

No UI changes beyond the dropdown.

### 14.2 Athlete Profile Extensions

New fields can be added to the Athlete Profile schema by:
1. Adding the field to the Firestore document (optional fields are backward-compatible).
2. Incrementing `schemaVersion`.
3. Adding the field to the prompt builder.
4. Adding the field to the AthleteProfileModal form.

### 14.3 Prompt Customization

Users can customize the coaching philosophy, progression rules, and recovery rules fields in their Athlete Profile. These are injected directly into the prompt, giving users control over the AI's coaching style without requiring code changes.

### 14.4 Multiple Training Block Drafts

Future enhancement: allow users to generate multiple drafts and compare them before approving one. This would require:
- Storing draft blocks with `status: 'draft'`.
- A draft comparison view.
- A "Promote to Active" action.

### 14.5 Scheduled Generation

Future enhancement: automatically generate the next Training Block on a schedule (e.g., every Sunday). This would require:
- A backend cron job or Firebase Cloud Function.
- Telegram/email notification when a new block is ready.
- The preview + approve flow still required before activation.

---

## 15. Recommended Implementation Phases

### Phase 1 — Foundation (Estimated: 3-5 days)

**Goal:** Athlete Profile + AI Settings + Prompt Builder (no API calls yet).

Files to create:
- `src/services/ai/promptBuilder.js`
- `src/components/coach/AthleteProfileModal.jsx`
- `src/components/coach/AiSettingsModal.jsx`

Files to modify:
- `src/App.jsx` (add Athlete Profile fetch, pass to CoachWorkspace)
- `src/App.jsx` (CoachWorkspace: add Settings button, profile check)

Deliverable:
- User can fill in Athlete Profile.
- User can configure AI provider + API key (stored in localStorage).
- Prompt Builder produces the same output as current `buildDeepSeekRequest()`.
- Old `aiAdapter.js` is deprecated but not removed.

### Phase 2 — API Integration (Estimated: 3-5 days)

**Goal:** Call DeepSeek API, parse response, validate, preview.

Files to create:
- `src/services/ai/adapter.js`
- `src/services/ai/deepseek.js`
- `src/services/ai/parser.js`
- `src/services/ai/validator.js` (thin wrapper)
- `src/components/coach/TrainingBlockPreview.jsx`

Files to modify:
- `src/App.jsx` (wire `handleGenerateBlock` flow)
- `src/App.jsx` (CoachWorkspace: replace Pipeline tab with generation flow)

Deliverable:
- User clicks "Generate Next Block" → sees loading states → sees preview.
- User can approve or reject.
- Approved block is saved to Firestore and becomes active.

### Phase 3 — Progressive Coaching (Estimated: 2-3 days)

**Goal:** Include current block + recent workouts in prompt for continuity.

Files to modify:
- `src/services/ai/promptBuilder.js` (add current block + recent workouts to prompt)
- `src/App.jsx` (pass current block and recent workouts to generation flow)

Deliverable:
- AI receives context about previous week's completion.
- Generated blocks show progression awareness.

### Phase 4 — Polish & Migration (Estimated: 2-3 days)

**Goal:** Handle edge cases, error states, migration for existing users.

Files to modify:
- `src/App.jsx` (default Athlete Profile creation for existing users)
- `src/components/coach/AthleteProfileModal.jsx` (validation, error states)
- `src/components/coach/AiSettingsModal.jsx` (test connection)
- `src/components/coach/TrainingBlockPreview.jsx` (validation error display)

Deliverable:
- Existing users get a default profile on first visit.
- All error states handled gracefully.
- "Test Connection" button works.
- Manual import still works alongside AI generation.

### Phase 5 — Future (Post-MVP)

- Add OpenAI, Gemini, Claude providers.
- Multiple draft comparison.
- Scheduled generation.
- Backend migration for API key security.
- Athlete Profile analytics (how does profile affect generation quality?).

---

## Appendix A: File Change Summary

### New Files (7)

| File | Purpose |
|------|---------|
| `src/services/ai/adapter.js` | Unified `generateTrainingBlock()` interface |
| `src/services/ai/deepseek.js` | DeepSeek API client |
| `src/services/ai/promptBuilder.js` | Assembles prompt from Athlete Profile + Knowledge + Coach Report |
| `src/services/ai/parser.js` | Extracts JSON from LLM response |
| `src/services/ai/validator.js` | Thin wrapper around existing `trainingBlockValidator.js` |
| `src/components/coach/AthleteProfileModal.jsx` | Edit Athlete Profile form |
| `src/components/coach/AiSettingsModal.jsx` | AI provider, model, API key configuration |
| `src/components/coach/TrainingBlockPreview.jsx` | Preview + Approve generated block |

### Modified Files (1)

| File | Changes |
|------|---------|
| `src/App.jsx` | Add Athlete Profile fetch, wire generation flow, update CoachWorkspace |

### Deprecated Files (1)

| File | Reason |
|------|--------|
| `src/utils/aiAdapter.js` | Logic moved to `services/ai/promptBuilder.js`. Keep for reference, remove in Phase 5. |

### Unchanged Files (10+)

`trainingBlockValidator.js`, `trainingBlockNormalizer.js`, `knowledge.js`, `coachReport.js`, `coachInsight.js`, `planning.js`, `trainingPlayground.js`, all dashboard components, all existing coach components.

---

## Appendix B: Key Design Decisions Log

| Decision | Date | Rationale |
|----------|------|-----------|
| Athlete Profile as single Firestore document | 2026-07-03 | Simpler than subcollections. Single read per session. Easy to cache. |
| API key in localStorage | 2026-07-03 | Pragmatic for frontend-only MVP. Backend migration path documented. |
| Reuse existing Validator + Normalizer | 2026-07-03 | Zero duplicate business logic. Same gatekeepers for manual and AI imports. |
| Preview step before activation | 2026-07-03 | User retains control. Catches AI errors before they affect training. |
| Provider registry pattern | 2026-07-03 | Adding new providers requires zero UI changes beyond a dropdown entry. |
| Progressive coaching via prompt context | 2026-07-03 | No new backend logic. The AI handles progression when given enough context. |
| Feature flag for generation | 2026-07-03 | Safe rollout. Can disable during provider outages without code deploy.