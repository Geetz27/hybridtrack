# HybridTrack Testing Assets

## Training Block Session Matching

### Purpose

Regression test for Training Block session completion.

### Expected Training Block

1. Push
2. Easy Run
3. Pull
4. Easy Run
5. Legs
6. Rest

### Manual Test Procedure

1. Import the JSON.
2. Verify every session starts as Pending.
3. Log workouts in this order:

   - Legs
   - Push
   - Easy Run
   - Pull
   - Easy Run

### Expected Result

| Workout    | Expected Status |
|------------|-----------------|
| Legs       | completed       |
| Push       | completed       |
| Easy Run 1 | completed       |
| Pull       | completed       |
| Easy Run 2 | completed       |

### Completion Algorithm

The completion algorithm must:

- **Priority 1:** Match workout category/title.
- **Priority 2:** Match normalized title.
- **Priority 3:** Fallback to earliest pending session.

This file exists to prevent regressions of the session matching algorithm.
