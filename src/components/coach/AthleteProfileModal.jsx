import React, { useState } from 'react';
import { X, Save, User, Target, Dumbbell, Activity, BrainCircuit, Heart } from 'lucide-react';

/**
 * Athlete Profile Modal
 *
 * Edits the structured Athlete Profile stored in Firestore at
 * users/{uid}/profile/athlete.
 *
 * Props:
 *   profile   — current Athlete Profile object (or null)
 *   onSave    — async (profileData) => Promise<void>
 *   onClose   — () => void
 */
export default function AthleteProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    primaryGoal: profile?.primaryGoal || 'General Fitness',
    targetRace: profile?.targetRace || '',
    targetRaceDate: profile?.targetRaceDate || '',
    experienceLevel: profile?.experienceLevel || 'Intermediate',
    weeklyAvailability: profile?.weeklyAvailability ?? 5,
    preferredGymSplit: profile?.preferredGymSplit || 'Push/Pull/Legs',
    preferredRunningStructure: profile?.preferredRunningStructure || '3 runs/week',
    coachingPhilosophy: profile?.coachingPhilosophy || '',
    progressionRules: profile?.progressionRules || '',
    recoveryRules: profile?.recoveryRules || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({
        ...form,
        weeklyAvailability: Number(form.weeklyAvailability),
        schemaVersion: 1,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-[#DCE3EA] rounded-t-3xl">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#14B8A6]" />
            <h2 className="text-base font-black text-[#0F172A]">Athlete Profile</h2>
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

          {/* Section: Athlete */}
          <Section icon={<User className="w-4 h-4 text-[#14B8A6]" />} title="Athlete">
            <TextField
              label="Name"
              value={form.name}
              onChange={v => updateField('name', v)}
              placeholder="Your name"
              required
            />
          </Section>

          {/* Section: Goal */}
          <Section icon={<Target className="w-4 h-4 text-[#8B5CF6]" />} title="Goal">
            <SelectField
              label="Primary Goal"
              value={form.primaryGoal}
              onChange={v => updateField('primaryGoal', v)}
              options={[
                'General Fitness',
                'Fat Loss',
                'Muscle Gain',
                'Endurance',
                'Race Preparation',
              ]}
            />
          </Section>

          {/* Section: Target Race */}
          <Section icon={<Activity className="w-4 h-4 text-[#F59E0B]" />} title="Target Race (optional)">
            <TextField
              label="Race Name"
              value={form.targetRace}
              onChange={v => updateField('targetRace', v)}
              placeholder="e.g. BayRun 10K"
            />
            <div className="mt-2">
              <TextField
                label="Race Date"
                type="date"
                value={form.targetRaceDate}
                onChange={v => updateField('targetRaceDate', v)}
              />
            </div>
          </Section>

          {/* Section: Experience */}
          <Section icon={<BrainCircuit className="w-4 h-4 text-[#7C3AED]" />} title="Experience">
            <SelectField
              label="Experience Level"
              value={form.experienceLevel}
              onChange={v => updateField('experienceLevel', v)}
              options={['Beginner', 'Intermediate', 'Advanced']}
            />
          </Section>

          {/* Section: Weekly Availability */}
          <Section icon={<Heart className="w-4 h-4 text-[#14B8A6]" />} title="Weekly Availability">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="7"
                value={form.weeklyAvailability}
                onChange={e => updateField('weeklyAvailability', e.target.value)}
                className="flex-1 accent-[#14B8A6]"
              />
              <span className="text-sm font-black text-[#0F172A] min-w-[2ch] text-center">
                {form.weeklyAvailability}
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] mt-1">Sessions per week</p>
          </Section>

          {/* Section: Preferred Split */}
          <Section icon={<Dumbbell className="w-4 h-4 text-[#8B5CF6]" />} title="Preferred Split">
            <SelectField
              label="Gym Split"
              value={form.preferredGymSplit}
              onChange={v => updateField('preferredGymSplit', v)}
              options={['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Custom']}
            />
            <div className="mt-2">
              <TextField
                label="Running Structure"
                value={form.preferredRunningStructure}
                onChange={v => updateField('preferredRunningStructure', v)}
                placeholder="e.g. 3 runs/week"
              />
            </div>
          </Section>

          {/* Section: Recovery Strategy */}
          <Section icon={<Heart className="w-4 h-4 text-[#F59E0B]" />} title="Recovery Strategy">
            <TextAreaField
              label="Recovery Rules"
              value={form.recoveryRules}
              onChange={v => updateField('recoveryRules', v)}
              placeholder="e.g. Deload if RPE > 8 for 2 consecutive sessions"
            />
          </Section>

          {/* Section: Coaching Style */}
          <Section icon={<BrainCircuit className="w-4 h-4 text-[#14B8A6]" />} title="Coaching Style">
            <TextAreaField
              label="Coaching Philosophy"
              value={form.coachingPhilosophy}
              onChange={v => updateField('coachingPhilosophy', v)}
              placeholder="e.g. Progressive overload with deload every 4th week"
            />
            <div className="mt-2">
              <TextAreaField
                label="Progression Rules"
                value={form.progressionRules}
                onChange={v => updateField('progressionRules', v)}
                placeholder="e.g. Increase weight when 3×12 is achieved with good form"
              />
            </div>
          </Section>
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
            {saving ? 'Saving...' : 'Save Profile'}
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

function TextField({ label, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <div>
      {label && (
        <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">
          {label}{required && <span className="text-[#e11d48] ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-medium focus:border-[#14B8A6] outline-none transition-colors"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <div>
      {label && (
        <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">{label}</label>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-medium focus:border-[#14B8A6] outline-none transition-colors resize-none"
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
