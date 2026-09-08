/**
 * ------------------------------------------------------------------
 * Training Block Normalizer
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Normalizes a validated Training Block JSON before it is stored
 * in Firestore. Applies defaults, canonicalizes enums, trims
 * strings, and sorts sessions.
 *
 * This normalizer is the final step before persistence.
 *
 * Source:
 * A Training Block JSON that has already passed validation.
 *
 * Consumers:
 * - Import / Sync pipeline
 * - Any code that persists training data
 *
 * Owner:
 * HybridTrack
 *
 * ------------------------------------------------------------------
 */

// ─── Enum maps ──────────────────────────────────────────────────────────────

const SESSION_TYPE_MAP = {
  strength: 'Strength',
  Strength: 'Strength',
  STRENGTH: 'Strength',
  run: 'Run',
  Run: 'Run',
  rest: 'Rest',
  Rest: 'Rest',
};

const RUN_INTENSITY_MAP = {
  easy: 'Easy',
  Easy: 'Easy',
  EASY: 'Easy',
  tempo: 'Tempo',
  Tempo: 'Tempo',
  interval: 'Interval',
  Interval: 'Interval',
  long: 'Long',
  Long: 'Long',
  recovery: 'Recovery',
  Recovery: 'Recovery',
  race: 'Race',
  Race: 'Race',
};

const PRESCRIPTION_TYPE_MAP = {
  strength: 'strength',
  run: 'run',
  rest: 'rest',
};

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Deep clone a value using JSON round-trip.
 * This is safe for validated Training Block JSON (no functions, no undefined).
 */
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Recursively trim all string values in an object or array.
 * Mutates the input in place (caller must clone first).
 */
function trimStrings(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = trimStrings(item);
    });
    return value;
  }
  if (value !== null && typeof value === 'object') {
    Object.keys(value).forEach(key => {
      value[key] = trimStrings(value[key]);
    });
    return value;
  }
  return value;
}

/**
 * Normalize a session type to its canonical form.
 * Returns the canonical value, or the original if unrecognized.
 */
function normalizeSessionType(type) {
  if (type == null) return type;
  return SESSION_TYPE_MAP[type] || type;
}

/**
 * Normalize a run intensity to its canonical form.
 * Returns the canonical value, or the original if unrecognized.
 */
function normalizeRunIntensity(intensity) {
  if (intensity == null) return intensity;
  return RUN_INTENSITY_MAP[intensity] || intensity;
}

/**
 * Normalize a prescription type to its canonical form.
 * Returns the canonical value, or the original if unrecognized.
 */
function normalizePrescriptionType(type) {
  if (type == null) return type;
  return PRESCRIPTION_TYPE_MAP[type] || type;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Normalize a validated Training Block JSON.
 *
 * Pure function. No side effects. Never mutates the original object.
 *
 * @param {object} trainingBlockJson - The complete JSON that has passed validation.
 * @returns {object} A normalized deep copy.
 */
export function normalizeTrainingBlock(trainingBlockJson) {
  // Guard: if input is not an object, return as-is (validator catches this)
  if (trainingBlockJson === null || typeof trainingBlockJson !== 'object' || Array.isArray(trainingBlockJson)) {
    return trainingBlockJson;
  }

  // Deep clone to avoid mutating the original
  const normalized = deepClone(trainingBlockJson);

  // Trim all strings at the top level
  trimStrings(normalized);

  // Normalize trainingBlock
  if (normalized.trainingBlock && typeof normalized.trainingBlock === 'object' && !Array.isArray(normalized.trainingBlock)) {
    const block = normalized.trainingBlock;

    // Trim strings inside trainingBlock
    trimStrings(block);

    // Normalize sessions
    if (Array.isArray(block.sessions)) {
      // Sort sessions by order ascending
      block.sessions.sort((a, b) => (a.order || 0) - (b.order || 0));

      block.sessions.forEach((session, idx) => {
        // Trim string fields
        if (typeof session.title === 'string') session.title = session.title.trim();
        if (typeof session.description === 'string') session.description = session.description.trim();
        if (typeof session.coachNotes === 'string') session.coachNotes = session.coachNotes.trim();
        if (typeof session.scheduledDate === 'string') session.scheduledDate = session.scheduledDate.trim();

        // Apply defaults
        if (session.order == null) session.order = idx + 1;
        if (session.status == null) session.status = 'pending';
        if (session.priority == null) session.priority = 'medium';
        if (session.isOptional == null) session.isOptional = false;
        if (session.coachNotes == null) session.coachNotes = '';
        if (session.completedAt == null) session.completedAt = null;
        if (session.completedWorkoutId == null) session.completedWorkoutId = null;

        // Normalize session type
        session.type = normalizeSessionType(session.type);

        // Normalize prescription
        if (session.prescription && typeof session.prescription === 'object' && !Array.isArray(session.prescription)) {
          // Only set prescription.type if it exists and is recognized
          if (session.prescription.type != null) {
            session.prescription.type = normalizePrescriptionType(session.prescription.type);
          } else {
            // Remove undefined/null type to prevent Firestore errors
            delete session.prescription.type;
          }

          // Normalize run intensity
          if (session.type === 'Run' && session.prescription.intensity != null) {
            session.prescription.intensity = normalizeRunIntensity(session.prescription.intensity);
          } else if (session.type === 'Run') {
            // Remove undefined/null intensity to prevent Firestore errors
            delete session.prescription.intensity;
          }
        }
      });
    }
  }

  return normalized;
}
