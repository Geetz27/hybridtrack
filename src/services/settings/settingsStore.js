/**
 * ------------------------------------------------------------------
 * Settings Store (v2)
 * ------------------------------------------------------------------
 *
 * Dedicated service for persisting AI settings.
 * Phase 1: localStorage backend.
 * Phase 2+: swap implementation (e.g. Firestore) without touching UI.
 *
 * The UI must never call localStorage directly.
 *
 * Usage:
 *   import { getAISettings, saveAISettings } from './services/settings/settingsStore';
 *
 * ------------------------------------------------------------------
 */

const STORAGE_KEY = 'hybridtrack_ai_settings';
const API_KEY_KEY = 'hybridtrack_ai_api_key';

const DEFAULTS = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKey: '',
};

/**
 * Read full AI settings object from storage.
 * Merges with DEFAULTS so missing keys always return a valid shape.
 *
 * @returns {{ provider: string, model: string, apiKey: string }}
 */
export function getAISettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch (err) {
    console.error('settingsStore: getAISettings failed', err);
  }
  return { ...DEFAULTS };
}

/**
 * Persist full AI settings object to storage.
 * @param {{ provider: string, model: string, apiKey: string }} settings
 */
export function saveAISettings(settings) {
  try {
    const toStore = { ...DEFAULTS, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    // Keep legacy api-key key in sync so older code still works
    if (toStore.apiKey) {
      localStorage.setItem(API_KEY_KEY, toStore.apiKey);
    }
  } catch (err) {
    console.error('settingsStore: saveAISettings failed', err);
  }
}

// ─── Legacy helpers (kept for backward compatibility) ───────────────────────

export function saveApiKey(apiKey) {
  saveAISettings({ apiKey });
}

export function getApiKey() {
  return getAISettings().apiKey || null;
}

export function clearApiKey() {
  saveAISettings({ apiKey: '' });
}

export function hasApiKey() {
  const key = getApiKey();
  return key !== null && key !== '';
}
