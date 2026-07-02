/**
 * ------------------------------------------------------------------
 * AI Adapter
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Prepares all information required by an LLM into structured prompts.
 *
 * It does NOT call any API.
 * It only builds prompts.
 *
 * Source:
 * Athlete brain, Knowledge Snapshot, Coach Report.
 *
 * Consumers:
 * - DeepSeek API caller (future)
 * - Any future LLM integration
 *
 * Owner:
 * HybridTrack
 *
 * ------------------------------------------------------------------
 */

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Format the knowledge snapshot into a concise structured text block.
 * This is NOT the coach report — it's a raw data summary for the LLM.
 */
function formatKnowledgeSnapshot(knowledge) {
  const lines = [];

  lines.push('=== ATHLETE METRICS ===');

  // Running
  lines.push('');
  lines.push('--- Running ---');
  if (knowledge.running) {
    lines.push(`Weekly Distance: ${knowledge.running.weeklyDistance ?? 0} km`);
    lines.push(`Longest Run: ${knowledge.running.longestRun ?? 0} km`);
    lines.push(`Current Pace: ${knowledge.running.currentPace != null ? knowledge.running.currentPace.toFixed(1) + ' sec/km' : '—'}`);
    lines.push(`Trend: ${knowledge.running.trend ?? 'stable'}`);
  }

  // Strength
  lines.push('');
  lines.push('--- Strength ---');
  if (knowledge.strength) {
    lines.push(`Weekly Sessions: ${knowledge.strength.weeklySessions ?? 0}`);
    if (knowledge.strength.strongestExercise) {
      lines.push(`Strongest Exercise: ${knowledge.strength.strongestExercise.name} (${knowledge.strength.strongestExercise.weight} kg × ${knowledge.strength.strongestExercise.reps})`);
    }
    if (knowledge.strength.progress90d) {
      const prog = knowledge.strength.progress90d;
      const change = prog.improvement != null
        ? `${prog.improvement >= 0 ? '+' : ''}${prog.improvement} kg`
        : '—';
      lines.push(`90-Day Progress: ${prog.exercise}: ${change}`);
    }
    lines.push(`Trend: ${knowledge.strength.trend ?? 'stable'}`);
  }

  // Recovery
  lines.push('');
  lines.push('--- Recovery ---');
  if (knowledge.recovery) {
    lines.push(`Days Since Last Workout: ${knowledge.recovery.lastWorkoutDays ?? '—'}`);
    lines.push(`Consecutive Days: ${knowledge.recovery.consecutiveDays ?? 0}`);
    lines.push(`Needs Recovery: ${knowledge.recovery.needsRecovery ? 'Yes' : 'No'}`);
  }

  // Body
  lines.push('');
  lines.push('--- Body ---');
  if (knowledge.body) {
    lines.push(`Current Weight: ${knowledge.body.currentWeight != null ? knowledge.body.currentWeight + ' kg' : '—'}`);
    lines.push(`30-Day Change: ${knowledge.body.change30d != null ? (knowledge.body.change30d >= 0 ? '+' : '') + knowledge.body.change30d + ' kg' : '—'}`);
    lines.push(`90-Day Change: ${knowledge.body.change90d != null ? (knowledge.body.change90d >= 0 ? '+' : '') + knowledge.body.change90d + ' kg' : '—'}`);
  }

  // Compliance
  lines.push('');
  lines.push('--- Compliance ---');
  if (knowledge.compliance) {
    lines.push(`Completed: ${knowledge.compliance.completed ?? 0}`);
    lines.push(`Planned: ${knowledge.compliance.planned ?? 0}`);
    lines.push(`Percentage: ${knowledge.compliance.percentage != null ? knowledge.compliance.percentage + '%' : '—'}`);
  }

  return lines.join('\n');
}

/**
 * Format the athlete brain into a structured text block.
 */
function formatAthleteBrain(athleteBrain) {
  if (!athleteBrain) return 'No athlete brain data available.';

  const lines = [];

  lines.push('=== ATHLETE PROFILE ===');

  if (athleteBrain.goals) {
    lines.push('');
    lines.push('--- Goals ---');
    if (Array.isArray(athleteBrain.goals)) {
      athleteBrain.goals.forEach(g => lines.push(`- ${g}`));
    } else {
      lines.push(`- ${athleteBrain.goals}`);
    }
  }

  if (athleteBrain.limitations) {
    lines.push('');
    lines.push('--- Limitations / Injuries ---');
    if (Array.isArray(athleteBrain.limitations)) {
      athleteBrain.limitations.forEach(l => lines.push(`- ${l}`));
    } else {
      lines.push(`- ${athleteBrain.limitations}`);
    }
  }

  if (athleteBrain.preferences) {
    lines.push('');
    lines.push('--- Preferences ---');
    if (Array.isArray(athleteBrain.preferences)) {
      athleteBrain.preferences.forEach(p => lines.push(`- ${p}`));
    } else {
      lines.push(`- ${athleteBrain.preferences}`);
    }
  }

  if (athleteBrain.experience) {
    lines.push('');
    lines.push(`Experience Level: ${athleteBrain.experience}`);
  }

  if (athleteBrain.notes) {
    lines.push('');
    lines.push('--- Additional Notes ---');
    lines.push(athleteBrain.notes);
  }

  return lines.join('\n');
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Build a structured request object ready for DeepSeek (or any LLM).
 *
 * Pure function. No side effects. Same inputs always produce the same output.
 * Does NOT call any API.
 *
 * @param {object}  options
 * @param {object}  options.athleteBrain - Athlete profile: { goals, limitations, preferences, experience, notes }
 * @param {object}  options.knowledge    - Knowledge Snapshot from generateKnowledgeSnapshot()
 * @param {string}  options.coachReport  - Markdown coach report from buildCoachReport()
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildDeepSeekRequest({
  athleteBrain = {},
  knowledge = {},
  coachReport = '',
} = {}) {
  // ─── System Prompt ──────────────────────────────────────────────────────
  const systemPrompt = [
    'You are an expert running and strength coach AI assistant for HybridTrack.',
    '',
    'Your role is to analyse athlete data and generate a personalised Training Block in JSON format.',
    '',
    '=== GUIDELINES ===',
    '',
    '- Base all output strictly on the data provided. Do not invent metrics.',
    '- Acknowledge progress and be constructive about areas needing improvement.',
    '- Never give medical advice. If an issue sounds medical, recommend consulting a professional.',
    '- Use plain language for descriptions. Avoid jargon unless explaining it.',
    '- When suggesting workout changes, be specific (e.g. "add one 30-min easy run" not "run more").',
    '',
    '=== INPUT STRUCTURE ===',
    '',
    'You will receive:',
    '1. Athlete Profile — goals, limitations, preferences, experience.',
    '2. Athlete Metrics — raw performance data (running, strength, recovery, body, compliance).',
    '3. Weekly Coach Report — a pre-generated Markdown summary with coaching insights.',
    '',
    '=== OUTPUT FORMAT ===',
    '',
    'You MUST respond with valid JSON only. No markdown, no code fences, no explanation outside the JSON.',
    '',
    'The JSON must follow this exact structure:',
    JSON.stringify({
      schemaVersion: 1,
      generatedBy: 'DeepSeek',
      generatedAt: '2026-07-06T00:00:00.000Z',
      trainingBlock: {
        name: 'Training block name (e.g. "BayRun Base Week 3")',
        goal: 'One-sentence goal for this block',
        week: {
          start: '2026-07-06',
          end: '2026-07-12',
        },
        sessions: [
          {
            id: 'session-001',
            status: 'pending',
            type: 'Strength',
            title: 'Push',
            description: 'Brief coaching description for this session',
            prescription: {
              exercises: [
                {
                  name: 'Exercise name',
                  sets: 3,
                  reps: '8-12',
                  weight: null,
                  notes: 'Form cue or instruction',
                },
              ],
            },
          },
          {
            id: 'session-002',
            status: 'pending',
            type: 'Run',
            title: 'Easy Run',
            description: 'Brief coaching description for this session',
            prescription: {
              distance: null,
              duration: null,
              intensity: 'Easy | Moderate | Hard',
              notes: 'Pacing or route guidance',
            },
          },
          {
            id: 'session-003',
            status: 'pending',
            type: 'Rest',
            title: 'Rest Day',
            description: 'Brief coaching description for this session',
            prescription: {},
          },
        ],
      },
    }, null, 2),
    '',
    'Generate 4-7 sessions for the upcoming week. Include at least one Rest day if the athlete needs recovery.',
    'Use the data to determine appropriate exercise selection, sets, reps, distances, and intensities.',
    'Assign sequential session IDs (session-001, session-002, ...).',
    'Set generatedAt to the current date/time in ISO 8601 format.',
    'Set week.start and week.end based on the Monday-to-Sunday range of the upcoming week.',
  ].join('\n');

  // ─── User Prompt ────────────────────────────────────────────────────────
  const userPrompt = [
    'Analyse the following athlete data and generate a Training Block for the upcoming week.',
    '',
    formatAthleteBrain(athleteBrain),
    '',
    formatKnowledgeSnapshot(knowledge),
    '',
    '=== WEEKLY COACH REPORT ===',
    '',
    coachReport,
    '',
    '---',
    '',
    'Respond with valid JSON following the output format specified in the system prompt.',
  ].join('\n');

  return { systemPrompt, userPrompt };
}
