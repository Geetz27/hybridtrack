/**
 * ------------------------------------------------------------------
 * Coach Insight Engine
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Generates contextual coaching messages using deterministic rules.
 *
 * Source:
 * Deterministic rules based on nextSession type and athlete context.
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

/**
 * Coaching message templates keyed by session type.
 * Each entry provides a function that receives the full input context
 * and returns { title, message, priority }.
 *
 * Priority levels:
 *   'high'   – important coaching cue (e.g. form reminder, pacing)
 *   'normal' – standard encouragement / tip
 *   'low'    – general observation
 */
const COACHING_RULES = {
  Push: ({ weeklyGymSessions, streak }) => ({
    title: 'Push Day — Chest & Shoulders',
    message: weeklyGymSessions >= 3
      ? 'Heavy week. Control the negative on every rep — don\'t chase numbers.'
      : 'Focus on mind-muscle connection. Squeeze at the top of each press.',
    priority: 'normal',
  }),

  Pull: ({ weeklyGymSessions, streak }) => ({
    title: 'Pull Day — Back & Biceps',
    message: weeklyGymSessions >= 3
      ? 'Volume is high. Keep your scapula retracted throughout each row.'
      : 'Lead with your elbows, not your hands. Feel the lats working.',
    priority: 'normal',
  }),

  Legs: ({ weeklyGymSessions, currentWeight, streak }) => ({
    title: 'Leg Day — Lower Body',
    message: currentWeight
      ? `Stay braced on every rep. At ${currentWeight}kg, form is everything.`
      : 'Don\'t rush the descent. Controlled negatives build more strength.',
    priority: 'high',
  }),

  'Easy Run': ({ weeklyRunDistance, streak }) => ({
    title: 'Easy Run — Zone 2',
    message: weeklyRunDistance >= 15
      ? `Weekly volume at ${weeklyRunDistance}km. Keep this run truly easy — no heroics.`
      : 'Run at conversational pace. If you can\'t speak in full sentences, slow down.',
    priority: 'normal',
  }),

  'Long Run': ({ weeklyRunDistance, streak }) => ({
    title: 'Long Run — Endurance',
    message: weeklyRunDistance >= 20
      ? `Big week (${weeklyRunDistance}km). Start slow, finish strong. Fuel before you\'re hungry.`
      : 'Focus on time on feet, not speed. Hydrate early and often.',
    priority: 'high',
  }),

  Rest: ({ streak }) => ({
    title: 'Rest Day — Recover',
    message: streak >= 5
      ? `${streak}-day streak! Your body earned this rest. Prioritise sleep and protein.`
      : 'Active recovery: light walk, stretch, or foam rolling. Your next session starts here.',
    priority: 'low',
  }),
};

/**
 * Generate a contextual coaching message based on the next planned session
 * and the athlete's current context.
 *
 * Pure function. No side effects. Same inputs always produce the same output.
 *
 * @param {object}  options
 * @param {object|null}  options.nextSession        - Result from getNextSession(), or null
 * @param {number}       options.weeklyRunDistance   - Total run distance this week (km)
 * @param {number}       options.weeklyGymSessions   - Number of gym sessions completed this week
 * @param {number|null}  options.currentWeight       - Athlete's current body weight (kg), or null
 * @param {number}       options.streak              - Current workout streak (consecutive days)
 * @returns {{ title: string, message: string, priority: string }}
 *   - title:    Short coaching headline
 *   - message:  Concise coaching message (max 2 sentences)
 *   - priority: 'high' | 'normal' | 'low'
 */
export function generateCoachInsight({
  nextSession,
  weeklyRunDistance = 0,
  weeklyGymSessions = 0,
  currentWeight = null,
  streak = 0,
} = {}) {
  // If there is no next session, return a generic fallback
  if (!nextSession || !nextSession.session) {
    return {
      title: 'No Upcoming Session',
      message: 'Plan your next workout to keep the momentum going.',
      priority: 'low',
    };
  }

  const sessionType = nextSession.session.sessionName || nextSession.session.type;
  const rule = COACHING_RULES[sessionType];

  if (rule) {
    return rule({ weeklyRunDistance, weeklyGymSessions, currentWeight, streak });
  }

  // Fallback for unknown session types
  return {
    title: `${sessionType} — Ready to Go`,
    message: 'Stay consistent. Show up and give your best effort today.',
    priority: 'normal',
  };
}
