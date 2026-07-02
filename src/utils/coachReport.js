/**
 * ------------------------------------------------------------------
 * Weekly Coach Report Engine
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Converts a Knowledge Snapshot into a Markdown coach report.
 *
 * Source:
 * Knowledge Snapshot (from knowledge.js), athlete info, current date.
 *
 * Consumers:
 * - Telegram Reminder
 * - Coach Dashboard
 * - Export / Share
 *
 * Owner:
 * HybridTrack
 *
 * ------------------------------------------------------------------
 */

import { generateCoachInsight } from './coachInsight.js';

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Format a Date to 'YYYY-MM-DD'.
 */
function fmtDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format pace from seconds per km to 'M:SS /km'.
 */
function fmtPace(paceSeconds) {
  if (paceSeconds == null || paceSeconds <= 0) return '—';
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  return `${min}:${String(sec).padStart(2, '0')} /km`;
}

/**
 * Format a trend value to a human-readable string.
 */
function fmtTrend(trend) {
  switch (trend) {
    case 'up': return '📈 Improving';
    case 'down': return '📉 Declining';
    case 'stable': return '➡️ Stable';
    default: return '—';
  }
}

/**
 * Format weight change with sign.
 */
function fmtWeightChange(change) {
  if (change == null) return '—';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)} kg`;
}

/**
 * Get the Monday-to-Sunday date range string for a given date.
 */
function getWeekRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${fmtDate(start)} — ${fmtDate(end)}`;
}

/**
 * Build a deterministic recommendation based on the knowledge snapshot.
 */
function buildRecommendation(knowledge) {
  const parts = [];

  // Running recommendation
  if (knowledge.running) {
    if (knowledge.running.trend === 'down') {
      parts.push('- Your running pace is declining. Consider adding one easy run per week to rebuild aerobic base.');
    } else if (knowledge.running.trend === 'up') {
      parts.push('- Your running pace is improving. Maintain consistency — don\'t increase volume by more than 10% per week.');
    } else {
      parts.push('- Running performance is stable. Focus on consistency before chasing speed.');
    }
  }

  // Strength recommendation
  if (knowledge.strength) {
    if (knowledge.strength.trend === 'down') {
      parts.push('- Gym volume is declining. Review your program — consider a deload week followed by a fresh block.');
    } else if (knowledge.strength.trend === 'up') {
      parts.push('- Strength volume is trending up. Keep progressive overload steady — small increments, consistent form.');
    } else {
      parts.push('- Strength volume is stable. This is a good foundation to build on.');
    }
  }

  // Recovery recommendation
  if (knowledge.recovery) {
    if (knowledge.recovery.needsRecovery) {
      parts.push('- Recovery is flagged. Prioritise sleep (7-9h), hydration, and light mobility work.');
    }
    if (knowledge.recovery.lastWorkoutDays !== null && knowledge.recovery.lastWorkoutDays >= 3) {
      parts.push(`- It's been ${knowledge.recovery.lastWorkoutDays} days since your last workout. A light session today can rebuild momentum.`);
    }
  }

  // Compliance recommendation
  if (knowledge.compliance) {
    const pct = knowledge.compliance.percentage;
    if (pct !== null && pct < 50) {
      parts.push('- Plan compliance is below 50%. Review your weekly plan — are the sessions realistic for your current schedule?');
    } else if (pct !== null && pct >= 80) {
      parts.push('- Great compliance this week! Keep the momentum going into next week.');
    } else if (pct !== null) {
      parts.push('- Moderate compliance. Identify which sessions were missed and adjust the plan accordingly.');
    }
  }

  // Body weight recommendation
  if (knowledge.body) {
    const change30d = knowledge.body.change30d;
    if (change30d !== null && Math.abs(change30d) > 2) {
      const direction = change30d > 0 ? 'increased' : 'dropped';
      parts.push(`- Body weight has ${direction} by ${Math.abs(change30d).toFixed(1)} kg in 30 days. Monitor nutrition and hydration.`);
    }
  }

  if (parts.length === 0) {
    parts.push('- Keep showing up. Consistency is the foundation of all progress.');
  }

  return parts.join('\n');
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Build a Weekly Coach Report in Markdown format.
 *
 * Pure function. No side effects. Same inputs always produce the same output.
 *
 * @param {object}  options
 * @param {object}  options.knowledge   - Knowledge Snapshot from generateKnowledgeSnapshot()
 * @param {object}  options.athlete     - Athlete info: { name, streak }
 * @param {Date}    options.currentDate - The reference date (typically today)
 * @returns {string} Markdown report
 */
export function buildCoachReport({
  knowledge = {},
  athlete = {},
  currentDate = new Date(),
} = {}) {
  const weekRange = getWeekRange(currentDate);
  const athleteName = athlete.name || 'Athlete';
  const streak = athlete.streak != null ? athlete.streak : 0;

  // ─── Coach Insight ──────────────────────────────────────────────────────
  // Derive the context needed for generateCoachInsight from the knowledge snapshot
  const insight = generateCoachInsight({
    nextSession: null, // Weekly report doesn't target a specific session
    weeklyRunDistance: knowledge.running?.weeklyDistance || 0,
    weeklyGymSessions: knowledge.strength?.weeklySessions || 0,
    currentWeight: knowledge.body?.currentWeight || null,
    streak,
  });

  // ─── Build report ───────────────────────────────────────────────────────
  const lines = [];

  // Header
  lines.push('# Weekly Coach Report');
  lines.push('');
  lines.push(`**Period:** ${weekRange}`);
  lines.push('');

  // Athlete
  lines.push('## Athlete');
  lines.push('');
  lines.push(`- **Name:** ${athleteName}`);
  if (knowledge.body?.currentWeight != null) {
    lines.push(`- **Weight:** ${knowledge.body.currentWeight} kg`);
  }
  lines.push(`- **Streak:** ${streak} day${streak !== 1 ? 's' : ''}`);
  lines.push('');

  // Weekly Summary
  lines.push('## Weekly Summary');
  lines.push('');
  const totalSessions = (knowledge.running?.weeklyDistance > 0 ? 1 : 0) +
    (knowledge.strength?.weeklySessions || 0);
  lines.push(`- **Total Sessions:** ${totalSessions}`);
  if (knowledge.compliance?.percentage != null) {
    lines.push(`- **Plan Compliance:** ${knowledge.compliance.percentage}% (${knowledge.compliance.completed}/${knowledge.compliance.planned} sessions)`);
  } else {
    lines.push('- **Plan Compliance:** No active plan');
  }
  lines.push('');

  // Running
  lines.push('## Running');
  lines.push('');
  lines.push(`- **Weekly Distance:** ${knowledge.running?.weeklyDistance || 0} km`);
  lines.push(`- **Longest Run:** ${knowledge.running?.longestRun || 0} km`);
  lines.push(`- **Current Pace:** ${fmtPace(knowledge.running?.currentPace)}`);
  lines.push(`- **Trend:** ${fmtTrend(knowledge.running?.trend)}`);
  lines.push('');

  // Strength
  lines.push('## Strength');
  lines.push('');
  lines.push(`- **Weekly Sessions:** ${knowledge.strength?.weeklySessions || 0}`);
  if (knowledge.strength?.strongestExercise) {
    lines.push(`- **Strongest Exercise:** ${knowledge.strength.strongestExercise.name} (${knowledge.strength.strongestExercise.weight} kg × ${knowledge.strength.strongestExercise.reps})`);
  }
  if (knowledge.strength?.progress90d) {
    const prog = knowledge.strength.progress90d;
    const change = prog.improvement != null
      ? `${prog.improvement >= 0 ? '+' : ''}${prog.improvement} kg`
      : '—';
    lines.push(`- **90-Day Progress:** ${prog.exercise}: ${change}`);
  }
  lines.push(`- **Trend:** ${fmtTrend(knowledge.strength?.trend)}`);
  lines.push('');

  // Recovery
  lines.push('## Recovery');
  lines.push('');
  if (knowledge.recovery?.lastWorkoutDays != null) {
    lines.push(`- **Days Since Last Workout:** ${knowledge.recovery.lastWorkoutDays}`);
  } else {
    lines.push('- **Days Since Last Workout:** No workouts logged');
  }
  lines.push(`- **Consecutive Days:** ${knowledge.recovery?.consecutiveDays || 0}`);
  lines.push(`- **Needs Recovery:** ${knowledge.recovery?.needsRecovery ? '⚠️ Yes' : '✅ No'}`);
  lines.push('');

  // Coach Insight
  lines.push('## Coach Insight');
  lines.push('');
  lines.push(`> **${insight.title}**`);
  lines.push('>');
  lines.push(`> ${insight.message}`);
  lines.push('');

  // Recommendation
  lines.push('## Recommendation');
  lines.push('');
  lines.push(buildRecommendation(knowledge));
  lines.push('');

  return lines.join('\n');
}
