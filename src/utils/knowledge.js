/**
 * ------------------------------------------------------------------
 * Knowledge Engine
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Converts workout history into a reusable Knowledge Snapshot.
 * This snapshot becomes the single source of truth for athlete status.
 *
 * Source:
 * Workout history, weight history, weekly plan, current date.
 *
 * Consumers:
 * - Dashboard
 * - Coach Engine
 * - Coach Report
 * - Telegram Reminder
 *
 * Owner:
 * HybridTrack
 *
 * ------------------------------------------------------------------
 */

import { getPlannedSession } from './planning.js';
import { getGymPRs, getRunningPBs, getCompletionRate } from './dashboard.js';

// ─── Internal helpers (not exported) ────────────────────────────────────────

/**
 * Parse a 'YYYY-MM-DD' string to a local Date at midnight.
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Get the current week's Monday-to-Sunday range.
 */
function getCurrentWeekRange(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Compute the trend direction for a series of numeric values.
 * Returns 'up', 'down', or 'stable'.
 */
function computeTrend(values) {
  if (values.length < 2) return 'stable';
  const recent = values.slice(-3);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  if (Math.abs(diff) < 0.05 * Math.max(Math.abs(first), 0.01)) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

/**
 * Compute the number of consecutive days with at least one workout.
 */
function computeConsecutiveDays(workouts) {
  if (!workouts || workouts.length === 0) return 0;

  const dates = [...new Set(workouts.map(w => w.date))]
    .filter(d => d)
    .sort((a, b) => new Date(b) - new Date(a));

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = new Date(dates[0]);
  mostRecent.setHours(0, 0, 0, 0);
  const diffFromToday = Math.round((today - mostRecent) / 86400000);

  // If most recent workout is more than 1 day ago, streak is broken
  if (diffFromToday > 1) return 0;

  let consecutive = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    prev.setHours(0, 0, 0, 0);
    curr.setHours(0, 0, 0, 0);
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive;
}

/**
 * Compute the number of days since the last workout.
 */
function daysSinceLastWorkout(workouts, currentDate) {
  if (!workouts || workouts.length === 0) return null;

  const dates = workouts
    .map(w => w.date)
    .filter(d => d)
    .sort((a, b) => new Date(b) - new Date(a));

  if (dates.length === 0) return null;

  const now = currentDate || new Date();
  now.setHours(0, 0, 0, 0);
  const last = new Date(dates[0]);
  last.setHours(0, 0, 0, 0);

  return Math.round((now - last) / 86400000);
}

/**
 * Compute weight change over a given number of days.
 */
function weightChange(weightHistory, days) {
  if (!weightHistory || weightHistory.length < 2) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recent = weightHistory
    .filter(w => w.date && parseLocalDate(w.date) >= cutoff && w.weight != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (recent.length < 2) return null;

  const first = parseFloat(recent[0].weight);
  const last = parseFloat(recent[recent.length - 1].weight);

  if (isNaN(first) || isNaN(last)) return null;

  return parseFloat((last - first).toFixed(1));
}

/**
 * Get the current (most recent) weight from weight history.
 */
function getCurrentWeight(weightHistory) {
  if (!weightHistory || weightHistory.length === 0) return null;

  const sorted = [...weightHistory]
    .filter(w => w.weight != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return sorted.length > 0 ? parseFloat(sorted[0].weight) : null;
}

/**
 * Compute the strongest exercise by volume from gym PRs.
 */
function getStrongestExercise(workouts) {
  const prs = getGymPRs(workouts, 1);
  return prs.length > 0
    ? { name: prs[0].exercise, weight: prs[0].weight, reps: prs[0].reps }
    : null;
}

/**
 * Compute 90-day progress for the strongest exercise.
 */
function getProgress90d(workouts) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 90);

  const exerciseMap = new Map();

  workouts
    .filter(w => w.type === 'Gym' && w.date && parseLocalDate(w.date) >= cutoff)
    .forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        const name = (exercise.exercise || exercise.name || '').trim();
        const bestWeight = Math.max(0, ...(exercise.sets || []).map(s => parseFloat(s.weight) || 0));
        if (!name || bestWeight <= 0) return;
        const key = name.toLowerCase();
        const entry = exerciseMap.get(key) || { exercise: name, points: [] };
        entry.points.push({
          timestamp: parseLocalDate(workout.date).getTime(),
          weight: bestWeight,
        });
        exerciseMap.set(key, entry);
      });
    });

  const results = [...exerciseMap.values()].map(entry => {
    const points = entry.points.sort((a, b) => a.timestamp - b.timestamp);
    const currentBest = Math.max(...points.map(p => p.weight));
    const improvement = points.length >= 2 ? currentBest - points[0].weight : null;
    return {
      exercise: entry.exercise,
      currentBest,
      improvement,
    };
  }).sort((a, b) =>
    (b.improvement ?? -Infinity) - (a.improvement ?? -Infinity) ||
    b.currentBest - a.currentBest
  );

  return results[0] || null;
}

/**
 * Compute running trend from recent pace data.
 */
function getRunningTrend(workouts) {
  const runs = workouts
    .filter(w => w.type === 'Lari' && w.date && (parseFloat(w.distance) || 0) > 0 && (parseFloat(w.duration) || 0) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-5);

  if (runs.length < 2) return 'stable';

  const paces = runs.map(w => (parseFloat(w.duration) * 60) / parseFloat(w.distance));
  return computeTrend(paces);
}

/**
 * Compute strength trend from recent gym volume.
 */
function getStrengthTrend(workouts) {
  const { start } = getCurrentWeekRange();

  // Get weekly volumes for the last 4 weeks
  const weeklyVolumes = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const volume = workouts
      .filter(w => w.type === 'Gym' && w.date && parseLocalDate(w.date) >= weekStart && parseLocalDate(w.date) <= weekEnd)
      .reduce((sum, w) => {
        return sum + (w.exercises || []).reduce((exSum, ex) => {
          return exSum + (ex.sets || []).reduce((setSum, s) => {
            return setSum + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
          }, 0);
        }, 0);
      }, 0);

    weeklyVolumes.push(volume);
  }

  return computeTrend(weeklyVolumes);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a Knowledge Snapshot — the canonical summary of athlete status.
 *
 * Pure function. No side effects. Same inputs always produce the same output.
 *
 * @param {object}  options
 * @param {Array}   options.workouts       - Array of workout objects
 * @param {Array}   options.weightHistory  - Array of { date, weight } objects
 * @param {object}  options.weeklyPlan     - The current weekly plan object
 * @param {Date}    options.currentDate    - The reference date (typically today)
 * @returns {object} Knowledge Snapshot
 */
export function generateKnowledgeSnapshot({
  workouts = [],
  weightHistory = [],
  weeklyPlan = null,
  currentDate = new Date(),
} = {}) {
  // ─── Running ────────────────────────────────────────────────────────────
  const { start, end } = getCurrentWeekRange(currentDate);

  const thisWeekRuns = workouts.filter(w => {
    if (w.type !== 'Lari' || !w.date) return false;
    const d = parseLocalDate(w.date);
    return d && d >= start && d <= end;
  });

  const weeklyDistance = parseFloat(
    thisWeekRuns.reduce((sum, w) => sum + (parseFloat(w.distance) || 0), 0).toFixed(1)
  );

  const allRuns = workouts
    .filter(w => w.type === 'Lari' && w.date && (parseFloat(w.distance) || 0) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const longestRun = allRuns.length > 0
    ? Math.max(...allRuns.map(w => parseFloat(w.distance) || 0))
    : 0;

  const validRuns = allRuns.filter(w => (parseFloat(w.duration) || 0) > 0);
  const currentPace = validRuns.length > 0
    ? parseFloat(
        (validRuns[validRuns.length - 1].duration * 60) /
        parseFloat(validRuns[validRuns.length - 1].distance)
      )
    : null;

  const runningTrend = getRunningTrend(workouts);

  // ─── Strength ───────────────────────────────────────────────────────────
  const thisWeekGym = workouts.filter(w => {
    if (w.type !== 'Gym' || !w.date) return false;
    const d = parseLocalDate(w.date);
    return d && d >= start && d <= end;
  });

  const weeklySessions = thisWeekGym.length;

  const strongestExercise = getStrongestExercise(workouts);
  const progress90d = getProgress90d(workouts);
  const strengthTrend = getStrengthTrend(workouts);

  // ─── Recovery ───────────────────────────────────────────────────────────
  const lastWorkoutDays = daysSinceLastWorkout(workouts, currentDate);
  const consecutiveDays = computeConsecutiveDays(workouts);

  // Needs recovery if: no workout in 2+ days, or 5+ consecutive days
  const needsRecovery = (lastWorkoutDays !== null && lastWorkoutDays >= 2) || consecutiveDays >= 5;

  // ─── Body ───────────────────────────────────────────────────────────────
  const currentWeight = getCurrentWeight(weightHistory);
  const change30d = weightChange(weightHistory, 30);
  const change90d = weightChange(weightHistory, 90);

  // ─── Compliance ─────────────────────────────────────────────────────────
  const completion = getCompletionRate(workouts, weeklyPlan);

  // ─── Assemble snapshot ──────────────────────────────────────────────────
  return {
    running: {
      weeklyDistance,
      longestRun,
      currentPace,
      trend: runningTrend,
    },
    strength: {
      weeklySessions,
      strongestExercise,
      progress90d,
      trend: strengthTrend,
    },
    recovery: {
      lastWorkoutDays,
      consecutiveDays,
      needsRecovery,
    },
    body: {
      currentWeight,
      change30d,
      change90d,
    },
    compliance: {
      completed: completion.completed,
      planned: completion.planned,
      percentage: completion.rate,
    },
  };
}
