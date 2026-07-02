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

/**
 * Find the earliest pending Strength session in a Training Block.
 *
 * Scans all sessions and returns the first one where:
 *   - type === "Strength"
 *   - status !== "completed"
 *
 * This allows the user to complete sessions in any order (e.g. Run before Push)
 * without being blocked by sequential order.
 *
 * @param {object}  options
 * @param {object}  options.trainingBlock - Training Block object with { sessions: [...] }
 * @returns {{ session: object, index: number } | null}
 *   - session: the pending Strength session object
 *   - index:   the index of the session in the sessions array
 *   Returns null if no pending Strength session is found.
 */
export function findPendingStrengthSession({ trainingBlock }) {
  if (!trainingBlock?.sessions) return null;

  for (let i = 0; i < trainingBlock.sessions.length; i++) {
    const session = trainingBlock.sessions[i];
    if (session?.type === 'Strength' && session?.status !== 'completed') {
      return { session, index: i };
    }
  }

  return null;
}

/**
 * Find the earliest pending Run session in a Training Block.
 *
 * Scans all sessions and returns the first one where:
 *   - type === "Run"
 *   - status !== "completed"
 *
 * This allows the user to complete sessions in any order (e.g. Run before Push)
 * without being blocked by sequential order.
 *
 * @param {object}  options
 * @param {object}  options.trainingBlock - Training Block object with { sessions: [...] }
 * @returns {{ session: object, index: number } | null}
 *   - session: the pending Run session object
 *   - index:   the index of the session in the sessions array
 *   Returns null if no pending Run session is found.
 */
export function findPendingRunSession({ trainingBlock }) {
  if (!trainingBlock?.sessions) return null;

  for (let i = 0; i < trainingBlock.sessions.length; i++) {
    const session = trainingBlock.sessions[i];
    if (session?.type === 'Run' && session?.status !== 'completed') {
      return { session, index: i };
    }
  }

  return null;
}

/**
 * Determine the next session from a Training Block based on session order,
 * ignoring weekdays entirely.
 *
 * Iterates through trainingBlock.sessions[] in order. Returns the first
 * non-Rest session whose type does not have a matching completed workout.
 *
 * Matching logic:
 *   - Strength session → completed by a workout with type === 'Gym'
 *   - Run session      → completed by a workout with type === 'Lari'
 *   - Rest session     → skipped (never "next")
 *
 * NOTE: This function is kept for Dashboard display (showing the next session
 * to do in sequential order). For session completion logic, use
 * findPendingStrengthSession() or findPendingRunSession() instead.
 *
 * @param {object}  options
 * @param {object}  options.trainingBlock     - Training Block object with { sessions: [...] }
 * @param {Array}   options.completedWorkouts - Array of workout objects, each with { type }
 * @returns {{ session: object, index: number } | null}
 *   - session: the planned session object from trainingBlock.sessions[index]
 *   - index:   the index of the session in the sessions array
 *   Returns null if all sessions are completed or no block is provided.
 */
export function getNextSessionFromBlock({ trainingBlock, completedWorkouts }) {
  // NOTE: completedWorkouts is accepted for API compatibility but is NOT used.
  // Session completion is determined solely by session.status inside the Training Block,
  // which is persisted by EPIC-010 (handleAddData in App.jsx).
  if (!trainingBlock?.sessions) {
    console.log('[DEBUG getNextSessionFromBlock] EARLY RETURN null — trainingBlock?.sessions:', !!trainingBlock?.sessions);
    return null;
  }

  // Walk sessions in order
  for (let i = 0; i < trainingBlock.sessions.length; i++) {
    const session = trainingBlock.sessions[i];
    console.log(`[DEBUG getNextSessionFromBlock] Checking session index=${i} id=${session?.id || '(no id)'} title="${session?.title || '(no title)'}" status="${session?.status || '(no status)'}" type="${session?.type || '(no type)'}"`);

    if (!session) {
      console.log(`[DEBUG getNextSessionFromBlock]   → skipped because session is falsy`);
      continue;
    }
    if (session.type === 'Rest') {
      console.log(`[DEBUG getNextSessionFromBlock]   → skipped because type is Rest`);
      continue;
    }
    if (session.status === 'completed') {
      console.log(`[DEBUG getNextSessionFromBlock]   → skipped because status is "completed"`);
      continue;
    }

    console.log(`[DEBUG getNextSessionFromBlock]   → ACCEPTED — returning session index=${i}`);
    return { session, index: i };
  }

  console.log('[DEBUG getNextSessionFromBlock] RETURNING null — all non-Rest sessions are completed');
  return null;
}
