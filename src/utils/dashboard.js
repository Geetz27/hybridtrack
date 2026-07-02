// ─── STREAK COMPUTATION ──────────────────────────────────────────────────────

export function computeStreak(workouts) {
  if (!workouts || workouts.length === 0) return { current: 0, longest: 0 };

  // Get unique dates with workouts, sorted descending
  const dates = [...new Set(workouts.map(w => w.date))]
    .filter(d => d)
    .sort((a, b) => new Date(b) - new Date(a));

  if (dates.length === 0) return { current: 0, longest: 0 };

  // Current streak: count consecutive days from today backwards
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if the most recent workout is today or yesterday
  const mostRecent = new Date(dates[0]);
  mostRecent.setHours(0, 0, 0, 0);
  const diffFromToday = Math.round((today - mostRecent) / 86400000);

  // If most recent workout is more than 1 day ago, current streak = 0
  if (diffFromToday > 1) {
    // Still compute longest streak
    const longest = computeLongestStreak(dates);
    return { current: 0, longest };
  }

  // Count consecutive days from most recent
  let currentStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    prev.setHours(0, 0, 0, 0);
    curr.setHours(0, 0, 0, 0);
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  const longest = computeLongestStreak(dates);

  return { current: currentStreak, longest };
}

function computeLongestStreak(dates) {
  if (dates.length <= 1) return dates.length;

  let longest = 1;
  let current = 1;

  // Sort ascending for longest streak computation
  const sorted = [...dates].sort((a, b) => new Date(a) - new Date(b));

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    prev.setHours(0, 0, 0, 0);
    curr.setHours(0, 0, 0, 0);
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

// ─── WEEKLY VOLUME TREND ─────────────────────────────────────────────────────

export function getWeeklyVolume(workouts, weeks = 12) {
  const result = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (i * 7) + 1); // Monday

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekWorkouts = workouts.filter(w => {
      if (!w.date) return false;
      const d = new Date(w.date + 'T00:00:00');
      return d >= weekStart && d <= weekEnd;
    });

    const runKm = weekWorkouts
      .filter(w => w.type === 'Lari')
      .reduce((sum, w) => sum + (parseFloat(w.distance) || 0), 0);

    const gymVolume = weekWorkouts
      .filter(w => w.type === 'Gym')
      .reduce((sum, w) => {
        return sum + (w.exercises || []).reduce((exSum, ex) => {
          return exSum + (ex.sets || []).reduce((setSum, s) => {
            return setSum + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
          }, 0);
        }, 0);
      }, 0);

    const gymSessions = weekWorkouts.filter(w => w.type === 'Gym').length;
    const runSessions = weekWorkouts.filter(w => w.type === 'Lari').length;

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    result.push({
      week: label,
      weekStart: weekStart.toISOString().split('T')[0],
      runKm: Math.round(runKm * 10) / 10,
      gymVolume: Math.round(gymVolume),
      gymSessions,
      runSessions,
      totalSessions: gymSessions + runSessions,
    });
  }

  return result;
}

// ─── PACE TREND ──────────────────────────────────────────────────────────────

export function getPaceTrend(workouts, limit = 20) {
  const runs = workouts
    .filter(w => w.type === 'Lari' && w.date && (parseFloat(w.distance) || 0) > 0 && (parseFloat(w.duration) || 0) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-limit);

  return runs.map(w => {
    const distance = parseFloat(w.distance);
    const duration = parseFloat(w.duration);
    const paceSeconds = (duration * 60) / distance; // seconds per km
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = Math.round(paceSeconds % 60);
    return {
      date: w.date,
      pace: paceSeconds,
      paceFormatted: `${paceMin}:${String(paceSec).padStart(2, '0')}`,
      distance,
      category: w.category || 'Easy',
    };
  });
}

// ─── COMPLETION RATE ─────────────────────────────────────────────────────────

import { getPlannedSession } from './planning.js';

export function getCompletionRate(workouts, weeklyPlan) {
  if (!weeklyPlan || !weeklyPlan.days) {
    return { rate: null, completed: 0, planned: 0, message: 'No plan set' };
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Get planned non-rest days
  const plannedDays = DAY_KEYS.map((dayKey, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + index);
    return {
      date: dayDate,
      plan: getPlannedSession(weeklyPlan, dayDate),
    };
  }).filter(item => item.plan && item.plan.type !== 'Rest');

  // Count completed
  const completed = plannedDays.filter(item => {
    const dateKey = [
      item.date.getFullYear(),
      String(item.date.getMonth() + 1).padStart(2, '0'),
      String(item.date.getDate()).padStart(2, '0'),
    ].join('-');
    const expectedType = item.plan.type === 'Run' ? 'Lari' : item.plan.type;
    return workouts.some(w => w.date === dateKey && w.type === expectedType);
  }).length;

  const total = plannedDays.length;

  return {
    rate: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : null,
    completed,
    planned: total,
    message: total === 0 ? 'All rest days' : `${completed}/${total} sessions done`,
  };
}

// ─── GYM PRs ─────────────────────────────────────────────────────────────────

export function getGymPRs(workouts, limit = 5) {
  const exerciseMap = new Map();

  workouts
    .filter(w => w.type === 'Gym' && w.date)
    .forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        const name = (exercise.exercise || exercise.name || '').trim();
        if (!name) return;

        const bestSet = (exercise.sets || []).reduce((best, s) => {
          const volume = (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
          return volume > (best.volume || 0) ? { weight: s.weight, reps: s.reps, volume } : best;
        }, {});

        if (!bestSet.volume) return;

        const key = name.toLowerCase();
        const existing = exerciseMap.get(key);
        if (!existing || bestSet.volume > existing.volume) {
          exerciseMap.set(key, {
            exercise: name,
            weight: bestSet.weight,
            reps: bestSet.reps,
            volume: bestSet.volume,
            date: workout.date,
          });
        }
      });
    });

  return [...exerciseMap.values()]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

// ─── RUNNING PBs ─────────────────────────────────────────────────────────────

export function getRunningPBs(workouts) {
  const runs = workouts
    .filter(w => w.type === 'Lari' && w.date && (parseFloat(w.distance) || 0) > 0 && (parseFloat(w.duration) || 0) > 0);

  // 5K PB
  const fiveKRuns = runs.filter(w => {
    const d = parseFloat(w.distance);
    return d >= 4.9 && d <= 5.1;
  });
  let best5K = null;
  if (fiveKRuns.length > 0) {
    const best = fiveKRuns.reduce((best, w) => {
      const pace = (parseFloat(w.duration) * 60) / parseFloat(w.distance) * 5;
      return best === null || pace < best.pace ? { pace, date: w.date, duration: w.duration, distance: w.distance } : best;
    }, null);
    if (best) {
      const paceSeconds = best.pace / 5; // per km
      const min = Math.floor(paceSeconds / 60);
      const sec = Math.round(paceSeconds % 60);
      best5K = { ...best, paceFormatted: `${min}:${String(sec).padStart(2, '0')}/km` };
    }
  }

  // Longest run
  const longest = runs.reduce((best, w) => {
    const d = parseFloat(w.distance);
    return best === null || d > best.distance ? { distance: d, date: w.date } : best;
  }, null);

  // Best pace (any distance)
  let bestPace = null;
  if (runs.length > 0) {
    const best = runs.reduce((best, w) => {
      const pace = (parseFloat(w.duration) * 60) / parseFloat(w.distance);
      return best === null || pace < best.pace ? { pace, date: w.date, distance: w.distance } : best;
    }, null);
    if (best) {
      const min = Math.floor(best.pace / 60);
      const sec = Math.round(best.pace % 60);
      bestPace = { ...best, paceFormatted: `${min}:${String(sec).padStart(2, '0')}/km` };
    }
  }

  return { best5K, longest, bestPace };
}
