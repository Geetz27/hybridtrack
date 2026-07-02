/**
 * ------------------------------------------------------------------
 * Training Block Playground
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Developer utility for end-to-end testing of the Training Block pipeline.
 *
 * Chains all existing engines together:
 *   Knowledge Snapshot → Coach Report → AI Request
 *
 * Does NOT call any AI.
 * Does NOT validate.
 * Does NOT import.
 *
 * Owner:
 * HybridTrack (developer tooling)
 *
 * ------------------------------------------------------------------
 */

import { generateKnowledgeSnapshot } from './knowledge.js';
import { buildCoachReport } from './coachReport.js';
import { buildDeepSeekRequest } from './aiAdapter.js';

/**
 * Run the full Training Block pipeline end-to-end.
 *
 * Pure function. No side effects. Same inputs always produce the same output.
 * Does NOT call any AI, validate, or import.
 *
 * @param {object}  options
 * @param {object}  options.athleteBrain  - Athlete profile: { goals, limitations, preferences, experience, notes }
 * @param {Array}   options.workouts      - Array of workout objects
 * @param {Array}   options.weightHistory - Array of { date, weight } objects
 * @param {object}  options.weeklyPlan    - The current weekly plan object
 * @param {Date}    options.currentDate   - The reference date (typically today)
 * @returns {{ knowledge: object, coachReport: string, aiRequest: { systemPrompt: string, userPrompt: string } }}
 */
export function runTrainingPipeline({
  athleteBrain = {},
  workouts = [],
  weightHistory = [],
  weeklyPlan = null,
  currentDate = new Date(),
} = {}) {
  // Step 1: Generate Knowledge Snapshot
  const knowledge = generateKnowledgeSnapshot({
    workouts,
    weightHistory,
    weeklyPlan,
    currentDate,
  });

  // Step 2: Build Coach Report
  const coachReport = buildCoachReport({
    knowledge,
    athlete: athleteBrain,
    currentDate,
  });

  // Step 3: Build AI Request
  const aiRequest = buildDeepSeekRequest({
    athleteBrain,
    knowledge,
    coachReport,
  });

  return {
    knowledge,
    coachReport,
    aiRequest,
  };
}
