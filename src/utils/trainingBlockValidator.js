/**
 * ------------------------------------------------------------------
 * Training Block Validator
 * ------------------------------------------------------------------
 *
 * Purpose:
 * Validates an AI-generated Training Block JSON before it can be
 * imported into HybridTrack.
 *
 * This validator is the gatekeeper between AI and Firestore.
 *
 * Source:
 * AI-generated Training Block JSON (from DeepSeek or any LLM).
 *
 * Consumers:
 * - Import / Sync pipeline
 * - Any code that receives AI-generated training data
 *
 * Owner:
 * HybridTrack
 *
 * ------------------------------------------------------------------
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const ALLOWED_SCHEMA_VERSION = 1;

const ALLOWED_STATUSES = ['pending', 'completed', 'skipped'];

const ALLOWED_PRIORITIES = ['high', 'medium', 'low'];

const ALLOWED_SESSION_TYPES = ['Strength', 'Run', 'Rest'];

const ALLOWED_RUN_INTENSITIES = ['Easy', 'Tempo', 'Interval', 'Long', 'Recovery', 'Race'];

const SESSION_REQUIRED_FIELDS = [
  'id',
  'type',
  'title',
  'description',
  'prescription',
];

const STRENGTH_EXERCISE_REQUIRED_FIELDS = ['name', 'sets', 'reps', 'weight', 'notes'];

const MIN_SESSIONS = 4;
const MAX_SESSIONS = 7;

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Check if a value is a non-null object (not an array).
 */
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if a value is a non-empty string.
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid ISO 8601 date string.
 */
function isValidISODate(value) {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !isNaN(d.getTime()) && value === d.toISOString();
}

/**
 * Check if a value is a number.
 */
function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if a value is a boolean.
 */
function isBoolean(value) {
  return typeof value === 'boolean';
}

/**
 * Collect unknown fields from an object against a known set.
 * Returns an array of warning strings.
 */
function collectUnknownFields(obj, knownFields, prefix) {
  const warnings = [];
  if (!isObject(obj)) return warnings;
  Object.keys(obj).forEach(key => {
    if (!knownFields.includes(key)) {
      warnings.push(`Unknown field '${prefix}.${key}' ignored`);
    }
  });
  return warnings;
}

// ─── Validation layers ──────────────────────────────────────────────────────

/**
 * Validate the top-level structure.
 */
function validateTopLevel(data, errors, warnings) {
  // schemaVersion
  if (data.schemaVersion == null) {
    errors.push('schemaVersion is required');
  } else if (data.schemaVersion !== ALLOWED_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${ALLOWED_SCHEMA_VERSION}, got ${data.schemaVersion}`);
  }

  // generatedBy
  if (data.generatedBy == null) {
    errors.push('generatedBy is required');
  } else if (!isNonEmptyString(data.generatedBy)) {
    errors.push('generatedBy must be a non-empty string');
  }

  // generatedAt
  if (data.generatedAt == null) {
    errors.push('generatedAt is required');
  } else if (!isValidISODate(data.generatedAt)) {
    errors.push('generatedAt must be a valid ISO 8601 date string');
  }

  // trainingBlock
  if (data.trainingBlock == null) {
    errors.push('trainingBlock is required');
  } else if (!isObject(data.trainingBlock)) {
    errors.push('trainingBlock must be an object');
  }

  // Unknown top-level fields
  const topLevelKnown = ['schemaVersion', 'generatedBy', 'generatedAt', 'trainingBlock'];
  warnings.push(...collectUnknownFields(data, topLevelKnown, ''));
}

/**
 * Validate the trainingBlock object.
 */
function validateTrainingBlockObject(trainingBlock, errors, warnings) {
  if (!isObject(trainingBlock)) return;

  // name
  if (trainingBlock.name == null) {
    errors.push('trainingBlock.name is required');
  } else if (!isNonEmptyString(trainingBlock.name)) {
    errors.push('trainingBlock.name must be a non-empty string');
  }

  // goal
  if (trainingBlock.goal == null) {
    errors.push('trainingBlock.goal is required');
  } else if (!isNonEmptyString(trainingBlock.goal)) {
    errors.push('trainingBlock.goal must be a non-empty string');
  }

  // sessions
  if (trainingBlock.sessions == null) {
    errors.push('trainingBlock.sessions is required');
  } else if (!Array.isArray(trainingBlock.sessions)) {
    errors.push('trainingBlock.sessions must be an array');
  } else {
    if (trainingBlock.sessions.length < MIN_SESSIONS) {
      errors.push(`trainingBlock.sessions must have at least ${MIN_SESSIONS} sessions, got ${trainingBlock.sessions.length}`);
    }
    if (trainingBlock.sessions.length > MAX_SESSIONS) {
      errors.push(`trainingBlock.sessions must have at most ${MAX_SESSIONS} sessions, got ${trainingBlock.sessions.length}`);
    }
  }

  // Unknown trainingBlock fields
  const tbKnown = ['name', 'goal', 'week', 'sessions'];
  warnings.push(...collectUnknownFields(trainingBlock, tbKnown, 'trainingBlock'));
}

/**
 * Validate all sessions.
 */
function validateSessions(sessions, errors, warnings) {
  if (!Array.isArray(sessions)) return;

  const seenIds = new Set();
  const seenOrders = new Set();

  sessions.forEach((session, index) => {
    const prefix = `Session ${index + 1}`;

    // Required fields
    SESSION_REQUIRED_FIELDS.forEach(field => {
      if (session[field] === undefined || session[field] === null) {
        errors.push(`${prefix} is missing '${field}'`);
      }
    });

    // id
    if (session.id != null) {
      if (seenIds.has(session.id)) {
        errors.push(`${prefix} has duplicate id '${session.id}'`);
      }
      seenIds.add(session.id);
    }

    // order
    if (session.order != null) {
      if (!isNumber(session.order)) {
        errors.push(`${prefix}.order must be a number`);
      } else if (session.order < 1) {
        errors.push(`${prefix}.order must start at 1, got ${session.order}`);
      } else if (seenOrders.has(session.order)) {
        errors.push(`${prefix} has duplicate order value ${session.order}`);
      }
      seenOrders.add(session.order);
    }

    // status
    if (session.status != null && !ALLOWED_STATUSES.includes(session.status)) {
      errors.push(`${prefix}.status must be one of: ${ALLOWED_STATUSES.join(', ')}, got '${session.status}'`);
    }

    // priority
    if (session.priority != null && !ALLOWED_PRIORITIES.includes(session.priority)) {
      errors.push(`${prefix}.priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}, got '${session.priority}'`);
    }

    // type
    if (session.type != null && !ALLOWED_SESSION_TYPES.includes(session.type)) {
      errors.push(`${prefix}.type must be one of: ${ALLOWED_SESSION_TYPES.join(', ')}, got '${session.type}'`);
    }

    // isOptional
    if (session.isOptional != null && !isBoolean(session.isOptional)) {
      errors.push(`${prefix}.isOptional must be a boolean`);
    }

    // prescription
    if (session.prescription != null) {
      validatePrescription(session.prescription, session.type, prefix, errors, warnings);
    }

    // Unknown session fields
    const sessionKnown = [
      'id', 'order', 'status', 'priority', 'isOptional', 'type',
      'title', 'description', 'coachNotes', 'completedAt',
      'completedWorkoutId', 'prescription',
    ];
    warnings.push(...collectUnknownFields(session, sessionKnown, `${prefix}`));
  });
}

/**
 * Validate a session's prescription based on its type.
 */
function validatePrescription(prescription, sessionType, prefix, errors, warnings) {
  if (!isObject(prescription)) {
    errors.push(`${prefix}.prescription must be an object`);
    return;
  }

  if (sessionType === 'Strength') {
    // exercises
    if (prescription.exercises == null) {
      errors.push(`${prefix}.prescription.exercises is required for Strength sessions`);
    } else if (!Array.isArray(prescription.exercises)) {
      errors.push(`${prefix}.prescription.exercises must be an array`);
    } else {
      prescription.exercises.forEach((exercise, exIndex) => {
        const exPrefix = `${prefix}.prescription.exercises[${exIndex}]`;
        STRENGTH_EXERCISE_REQUIRED_FIELDS.forEach(field => {
          if (exercise[field] === undefined || exercise[field] === null) {
            errors.push(`${exPrefix} is missing '${field}'`);
          }
        });
        // Unknown exercise fields
        const exKnown = ['name', 'sets', 'reps', 'weight', 'notes'];
        warnings.push(...collectUnknownFields(exercise, exKnown, exPrefix));
      });
    }

    // Unknown prescription fields for Strength
    const strengthPrescriptionKnown = ['type', 'exercises'];
    warnings.push(...collectUnknownFields(prescription, strengthPrescriptionKnown, `${prefix}.prescription`));

  } else if (sessionType === 'Run') {
    // At least one of distance or duration must be provided
    const hasDistance = prescription.distance != null;
    const hasDuration = prescription.duration != null;
    if (!hasDistance && !hasDuration) {
      errors.push(`${prefix}.prescription requires at least one of 'distance' or 'duration'`);
    } else {
      if (hasDistance && !isNumber(prescription.distance)) {
        errors.push(`${prefix}.prescription.distance must be a number`);
      }
      if (hasDuration && !isNumber(prescription.duration)) {
        errors.push(`${prefix}.prescription.duration must be a number`);
      }
    }

    // intensity
    if (prescription.intensity == null) {
      errors.push(`${prefix}.prescription.intensity is required for Run sessions`);
    } else if (!ALLOWED_RUN_INTENSITIES.includes(prescription.intensity)) {
      errors.push(`${prefix}.prescription.intensity must be one of: ${ALLOWED_RUN_INTENSITIES.join(', ')}, got '${prescription.intensity}'`);
    }

    // notes
    if (prescription.notes == null) {
      errors.push(`${prefix}.prescription.notes is required for Run sessions`);
    } else if (!isNonEmptyString(prescription.notes)) {
      errors.push(`${prefix}.prescription.notes must be a non-empty string`);
    }

    // Unknown prescription fields for Run
    const runPrescriptionKnown = ['type', 'distance', 'duration', 'intensity', 'notes'];
    warnings.push(...collectUnknownFields(prescription, runPrescriptionKnown, `${prefix}.prescription`));

  } else if (sessionType === 'Rest') {
    // Unknown prescription fields for Rest
    const restPrescriptionKnown = ['type'];
    warnings.push(...collectUnknownFields(prescription, restPrescriptionKnown, `${prefix}.prescription`));
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Validate an AI-generated Training Block JSON.
 *
 * Pure function. No side effects. Same inputs always produce the same output.
 *
 * @param {object} trainingBlockJson - The complete JSON returned by the AI.
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateTrainingBlock(trainingBlockJson) {
  const errors = [];
  const warnings = [];

  // Guard: input must be an object
  if (!isObject(trainingBlockJson)) {
    errors.push('Input must be a non-null object');
    return { valid: false, errors, warnings };
  }

  // Layer 1: Top-level structure
  validateTopLevel(trainingBlockJson, errors, warnings);

  // Layer 2: trainingBlock
  if (trainingBlockJson.trainingBlock) {
    validateTrainingBlockObject(trainingBlockJson.trainingBlock, errors, warnings);

    // Layer 3 & 4: Sessions and prescriptions
    if (Array.isArray(trainingBlockJson.trainingBlock.sessions)) {
      validateSessions(trainingBlockJson.trainingBlock.sessions, errors, warnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
