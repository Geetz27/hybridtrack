// Custom targets live in users/{uid}/weeklyTargets/{weekStart}, keyed by the week's Monday.
// A week without a document uses DEFAULT_WEEKLY_TARGETS. Keep MAX_WEEKLY_TARGET in sync with firestore.rules.

export const WEEKLY_TARGET_KEYS = ['Push', 'Pull', 'Legs', 'Run'];
export const DEFAULT_WEEKLY_TARGETS = { Push: 1, Pull: 1, Legs: 1, Run: 3 };
export const MAX_WEEKLY_TARGET = 14;

export function getWeekStartKey(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, '0'),
    String(start.getDate()).padStart(2, '0'),
  ].join('-');
}

export function parseWeeklyTargetsInput(values) {
  const targets = {};
  for (const key of WEEKLY_TARGET_KEYS) {
    const raw = String(values?.[key] ?? '').trim();
    const value = Number(raw);
    if (raw === '' || !Number.isInteger(value) || value < 0 || value > MAX_WEEKLY_TARGET) {
      return { error: `Isi target ${key} dengan angka bulat 0 sampai ${MAX_WEEKLY_TARGET}.` };
    }
    targets[key] = value;
  }
  return { targets };
}

export function resolveWeeklyTargets(customTargets) {
  const parsed = customTargets ? parseWeeklyTargetsInput(customTargets) : null;
  return parsed?.targets
    ? { targets: parsed.targets, isCustom: true }
    : { targets: { ...DEFAULT_WEEKLY_TARGETS }, isCustom: false };
}
