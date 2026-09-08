/**
 * ------------------------------------------------------------------
 * Settings Store (legacy re-export)
 * ------------------------------------------------------------------
 *
 * This file re-exports from the canonical location at
 *   src/services/settings/settingsStore.js
 *
 * Direct imports from 'services/settingsStore' still work,
 * but new code should import from 'services/settings/settingsStore'.
 *
 * ------------------------------------------------------------------
 */
export {
  getAISettings,
  saveAISettings,
  saveApiKey,
  getApiKey,
  clearApiKey,
  hasApiKey,
} from './settings/settingsStore';
