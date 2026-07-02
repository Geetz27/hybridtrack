/**
 * ------------------------------------------------------------------
 * Planning Engine
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Centralizes all workout planning logic.
 *
 * Current Source:
 * WeeklyPlan
 *
 * Future Source:
 * Training Blocks
 *
 * Consumers:
 * - Dashboard
 * - Quick Input
 * - Coach Report
 *
 * Owner:
 * HybridTrack
 *
 * ------------------------------------------------------------------
 */

const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

/**
 * Get the planned session for a given date.
 *
 * @param {object} weeklyPlan - The current weekly plan object
 * @param {Date}   date       - A Date object (time is ignored, only date matters)
 * @returns {object|null} The planned session for that day, or null if none exists
 */
export function getPlannedSession(weeklyPlan, date) {
  if (!weeklyPlan || !weeklyPlan.days || !date) return null;
  const dayKey = DAY_KEYS[date.getDay()];
  return weeklyPlan.days[dayKey] ?? null;
}

/**
 * Format a Date to 'YYYY-MM-DD' string.
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a 'YYYY-MM-DD' string to a local Date at midnight.
 *
 * @param {string} dateStr
 * @returns {Date|null}
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Determine the next upcoming planned session that has not yet been completed.
 *
 * Iterates day-by-day from currentDate (or the plan's weekStart, whichever is
 * later) through the plan's weekEnd. Returns the first non-Rest session that
 * does not have a matching workout in the completedWorkouts array.
 *
 * Accepts a single options object so the public interface remains stable when
 * the internal data source changes (e.g. WeeklyPlan → Training Blocks).
 *
 * @param {object}  options
 * @param {object}  options.weeklyPlan        - The current weekly plan object
 * @param {Array}   options.completedWorkouts - Array of workout objects, each with { date, type }
 * @param {Date}    options.currentDate       - The date to start searching from (typically today)
 * @returns {{ dayKey: string, session: object } | null}
 *   - dayKey:  day key (e.g. 'monday', 'tuesday')
 *   - session: the planned session object from weeklyPlan.days[dayKey]
 *   Returns null if no upcoming session is found.
 */
export function getNextSession({ weeklyPlan, completedWorkouts, currentDate }) {
  if (!weeklyPlan || !weeklyPlan.days || !Array.isArray(completedWorkouts)) return null;

  const weekStart = parseLocalDate(weeklyPlan.weekStart);
  const weekEnd = parseLocalDate(weeklyPlan.weekEnd);
  if (!weekStart || !weekEnd) return null;

  // Normalise the search start date
  const start = new Date(currentDate || new Date());
  start.setHours(0, 0, 0, 0);
  const cursor = start > weekStart ? start : new Date(weekStart);

  // End of search: end of weekEnd day
  const end = new Date(weekEnd);
  end.setHours(23, 59, 59, 999);

  // Build a Set of completed date+type keys for O(1) lookup
  const completedSet = new Set();
  completedWorkouts.forEach(w => {
    if (w.date && w.type) {
      completedSet.add(`${w.date}|${w.type}`);
    }
  });

  // Walk day by day
  const current = new Date(cursor);
  while (current <= end) {
    const session = getPlannedSession(weeklyPlan, current);
    if (session && session.type !== 'Rest') {
      const dateKey = formatDateKey(current);
      // Map plan type to workout type (Run -> Lari, Gym -> Gym)
      const expectedType = session.type === 'Run' ? 'Lari' : session.type;
      if (!completedSet.has(`${dateKey}|${expectedType}`)) {
        const dayKey = DAY_KEYS[current.getDay()];
        return { dayKey, session };
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return null;
}
