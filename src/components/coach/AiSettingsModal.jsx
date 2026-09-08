import React, { useState } from 'react';
import { X, Save, Cpu, Key, Wifi, WifiOff } from 'lucide-react';
import { saveApiKey, getApiKey, clearApiKey } from '../../services/settings/settingsStore';

/**
 * AI Settings Modal
 *
 * Configures AI provider, model, and API key.
 * API key is stored via settingsStore (currently localStorage).
 * Provider and model are saved to the Athlete Profile in Firestore.
 *
 * Props:
 *   profile       — current Athlete Profile object (or null)
 *   onSaveAiConfig — async ({ provider, model }) => Promise<void>
 *   onClose       — () => void
 */
export default function AiSettingsModal({ profile, onSaveAiConfig, onClose }) {
  const [provider, setProvider] = useState(profile?.aiProvider || 'deepseek');
  const [model, setModel] = useState(profile?.aiModel || 'deepseek-chat');
  const [apiKey, setApiKey] = useState(getApiKey() || '');
  const [showKey, setShowKey] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Connection test state
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // null | 'success' | 'fail'

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      // Save API key via settings store
      saveApiKey(apiKey.trim());

      // Save provider + model to Firestore via parent
      await onSaveAiConfig({ provider, model });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setConnectionStatus('fail');
      return;
    }
    setTesting(true);
    setConnectionStatus(null);
    try {
      // Minimal API call to verify the key works
      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });
      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('fail');
      }
    } catch {
      setConnectionStatus('fail');
    } finally {
      setTesting(false);
    }
  };

  const handleClearKey = () => {
    clearApiKey();
    setApiKey('');
    setConnectionStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-[#DCE3EA] rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#14B8A6]" />
            <h2 className="text-base font-black text-[#0F172A]">AI Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#64748B] hover:text-[#e11d48] rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 text-xs font-bold text-[#991B1B]">
              {error}
            </div>
          )}

          {/* Section: Provider */}
          <Section icon={<Cpu className="w-4 h-4 text-[#8B5CF6]" />} title="Provider">
            <SelectField
              label="AI Provider"
              value={provider}
              onChange={setProvider}
              options={['deepseek']}
            />
            <div className="mt-2">
              <TextField
                label="Model"
                value={model}
                onChange={setModel}
                placeholder="e.g. deepseek-chat"
              />
            </div>
          </Section>

          {/* Section: API Key */}
          <Section icon={<Key className="w-4 h-4 text-[#F59E0B]" />} title="API Key">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setConnectionStatus(null); }}
                placeholder="sk-..."
                className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 pr-20 text-sm text-[#0F172A] font-mono focus:border-[#14B8A6] outline-none transition-colors"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="px-2 py-1 text-[9px] font-bold text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
                {apiKey && (
                  <button
                    onClick={handleClearKey}
                    className="px-2 py-1 text-[9px] font-bold text-[#e11d48] hover:text-[#be123c] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Test Connection */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing || !apiKey.trim()}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#CBD5E1] rounded-xl text-[10px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Wifi className="w-3 h-3" />
                    Test Connection
                  </>
                )}
              </button>

              {/* Status indicator */}
              {connectionStatus === 'success' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#14B8A6]">
                  <Wifi className="w-3 h-3" />
                  Connected
                </span>
              )}
              {connectionStatus === 'fail' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#e11d48]">
                  <WifiOff className="w-3 h-3" />
                  Connection Failed
                </span>
              )}
            </div>
          </Section>

          {/* Info note */}
          <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-[#0369A1]">
              Your API key is stored locally in your browser. It is never sent to our servers.
              For security, use a limited-scope API key.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#DCE3EA] px-5 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0F172A] text-white text-xs font-black rounded-xl hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Internal Sub-Components ─────────────────────────────────────────────────

function Section({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon}
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{title}</p>
      </div>
      <div className="bg-[#F8FAFC] border border-[#DCE3EA] rounded-2xl p-4">
        {children}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && (
        <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">{label}</label>
      )}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-medium focus:border-[#14B8A6] outline-none transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      {label && (
        <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">{label}</label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-bold focus:border-[#14B8A6] outline-none transition-colors appearance-none"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
