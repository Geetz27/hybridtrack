import React, { useState, useMemo, useEffect, Suspense } from 'react';
import * as dashboardUtils from './utils/dashboard';
import { getPlannedSession, getNextSession } from './utils/planning';
import { generateCoachInsight } from './utils/coachInsight';
import { runTrainingPipeline } from './utils/trainingPlayground';
import { validateTrainingBlock } from './utils/trainingBlockValidator';
import { normalizeTrainingBlock } from './utils/trainingBlockNormalizer';
import { 
  Activity, Dumbbell, Flame, PlusCircle, List, 
  CheckCircle2, Timer, Heart, CalendarDays, TrendingUp,
  BrainCircuit, AlertTriangle, Moon, Target, Award,
  ChevronRight, X, MessageSquare, Zap, BarChart2, Trash2, LogOut, ChevronDown, Pencil, ClipboardList, Plus, Edit3, Save, FileDown
} from 'lucide-react';

// --- 1. IMPORT FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// --- 2. KUNCI FIREBASE MILIKMU ---
const firebaseConfig = {
  apiKey: "AIzaSyDG_sI23RNXtb67w1-xRziGMbnoCYVjD70",
  authDomain: "hybrid-track.firebaseapp.com",
  projectId: "hybrid-track",
  storageBucket: "hybrid-track.firebasestorage.app",
  messagingSenderId: "48093730097",
  appId: "1:48093730097:web:4986f7af26d92991088c10"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


// ─── WEEKLY PLAN SCHEMA ─────────────────────────────────────────────────────
const DEFAULT_WEEKLY_PLAN = {
  weekStart: '2026-05-18',
  weekEnd:   '2026-05-24',
  label:     'Week of 18 May 2026',
  days: {
    monday: {
      type: 'Gym', sessionName: 'Push', notes: 'Transisi beban: Set 1 adaptasi, Set 2-3 naik. Fokus kontrol gerakan.',
      exercises: [
        { name: 'Smith Machine Bench Press',
          sets: [{set:1,weight:25,reps:10},{set:2,weight:27.5,reps:10},{set:3,weight:27.5,reps:9}] },
        { name: 'Smith Machine Incline Press',
          sets: [{set:1,weight:25,reps:10},{set:2,weight:25,reps:10},{set:3,weight:25,reps:8}] },
        { name: 'Machine Chest Fly',
          sets: [{set:1,weight:30,reps:12},{set:2,weight:30,reps:12},{set:3,weight:30,reps:12}] },
        { name: 'Tricep Pushdown',
          sets: [{set:1,weight:30,reps:12},{set:2,weight:30,reps:12},{set:3,weight:30,reps:12}] },
        { name: 'Lateral Raise',
          sets: [{set:1,weight:6,reps:12},{set:2,weight:6,reps:12},{set:3,weight:6,reps:12}] },
      ]
    },
    tuesday: {
      type: 'Run', sessionName: 'Easy Run', notes: 'Kalau napas mulai berat, selingi jalan 45–60 detik.',
      runTarget: { distance: 3.5, effort: 'easy', rpe: '3-4', pace: '7:30' }
    },
    wednesday: {
      type: 'Gym', sessionName: 'Pull', notes: 'Focus: Back + Bicep. Kontrol negatif di setiap rep.',
      exercises: [
        { name: 'Lat Pulldown',
          sets: [{set:1,weight:30,reps:11},{set:2,weight:32,reps:10},{set:3,weight:32,reps:10}] },
        { name: 'Seated Cable Row',
          sets: [{set:1,weight:40,reps:10},{set:2,weight:40,reps:10},{set:3,weight:40,reps:10}] },
        { name: 'Face Pull',
          sets: [{set:1,weight:36,reps:12},{set:2,weight:36,reps:12},{set:3,weight:36,reps:12}] },
        { name: 'Incline DB Curl',
          sets: [{set:1,weight:10,reps:10},{set:2,weight:10,reps:10},{set:3,weight:10,reps:9}] },
        { name: 'Hammer Curl',
          sets: [{set:1,weight:12.5,reps:12},{set:2,weight:12.5,reps:12},{set:3,weight:12.5,reps:12}] },
      ]
    },
    thursday: {
      type: 'Run', sessionName: 'Easy Run', notes: 'Tetap easy, jaga pace konsisten.',
      runTarget: { distance: 3.5, effort: 'easy', rpe: '4-5', pace: '7:30' }
    },
    friday: {
      type: 'Gym', sessionName: 'Legs', notes: 'Target RPE 6–7. Calf Raise 4 set. Fokus form, jangan buru-buru.',
      exercises: [
        { name: 'Seated Leg Curl',
          sets: [{set:1,weight:45,reps:11},{set:2,weight:50,reps:10},{set:3,weight:50,reps:10}] },
        { name: 'RDL (Dumbbell)',
          sets: [{set:1,weight:17.5,reps:10},{set:2,weight:20,reps:10},{set:3,weight:20,reps:10}] },
        { name: 'Leg Press',
          sets: [{set:1,weight:50,reps:11},{set:2,weight:55,reps:11},{set:3,weight:55,reps:10}] },
        { name: 'Standing Calf Raise (DB)',
          sets: [{set:1,weight:17.5,reps:15},{set:2,weight:20,reps:15},{set:3,weight:20,reps:15},{set:4,weight:20,reps:15}] },
      ]
    },
    saturday: {
      type: 'Run', sessionName: 'Long Run', notes: 'Long run santai. Prioritas jarak, bukan kecepatan.',
      runTarget: { distance: 5, effort: 'easy', rpe: '4-5', pace: '7:30' }
    },
    sunday: {
      type: 'Rest', sessionName: 'Rest', notes: 'Recovery, tidur, makan rapi, kirim ringkasan minggu ini ke coach.',
      runTarget: null
    },
  }
};


// ─── DYNAMIC PLAN GENERATION ────────────────────────────────────────────────
function generateDefaultPlan() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  return {
    weekStart: fmt(monday),
    weekEnd: fmt(sunday),
    label: `Week of ${monday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()}`,
    planVersion: 1,
    days: {
      monday:    { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      tuesday:   { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      wednesday: { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      thursday:  { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      friday:    { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      saturday:  { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null },
      sunday:    { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null }
    }
  };
}

function migratePlan(data) {
  let plan = { ...data };
  if (!plan.planVersion || plan.planVersion < 1) {
    plan.planVersion = 1;
  }
  const requiredDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  requiredDays.forEach(day => {
    if (!plan.days[day]) {
      plan.days[day] = { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null };
    }
  });
  return plan;
}


// ─── WEEKLY PLAN TAB ────────────────────────────────────────────────────────
const DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Senin', tuesday:'Selasa', wednesday:'Rabu', thursday:'Kamis', friday:'Jumat', saturday:'Sabtu', sunday:'Minggu' };
const DAY_SHORT = { monday:'Sen', tuesday:'Sel', wednesday:'Rab', thursday:'Kam', friday:'Jum', saturday:'Sab', sunday:'Min' };

const SESSION_COLORS = {
  Push:         { bg:'bg-[#FFFFFF]', border:'border-[#CBD5E1]/50', text:'text-[#14B8A6]', badge:'bg-[#8B5CF6]/30 text-[#0F172A]', dot:'bg-[#8B5CF6]' },
  Pull:         { bg:'bg-[#14B8A6]/12', border:'border-[#14B8A6]/40', text:'text-[#14B8A6]', badge:'bg-[#14B8A6]/20 text-[#14B8A6]', dot:'bg-[#14B8A6]' },
  Legs:         { bg:'bg-[#FFFFFF]', border:'border-[#99F6E4]/35', text:'text-[#14B8A6]', badge:'bg-[#99F6E4]/15 text-[#14B8A6]', dot:'bg-[#99F6E4]' },
  'Easy Run':   { bg:'bg-[#14B8A6]/10', border:'border-[#14B8A6]/30', text:'text-[#14B8A6]', badge:'bg-[#14B8A6]/15 text-[#14B8A6]', dot:'bg-[#14B8A6]' },
  'Quality Run':{ bg:'bg-[#c76360]/12', border:'border-[#c76360]/35', text:'text-[#d07573]', badge:'bg-[#c76360]/15 text-[#e8a8a6]', dot:'bg-[#c76360]' },
  Rest:         { bg:'bg-[#FFFFFF]', border:'border-[#CBD5E1]/25', text:'text-[#64748B]', badge:'bg-[#FFFFFF] text-[#64748B]', dot:'bg-[#2d3f72]' },
};
const getSessionColor = (name) => SESSION_COLORS[name] || SESSION_COLORS['Rest'];

function WeeklyPlanTab({ weeklyPlan, setWeeklyPlan, workouts, user }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);

  // Stale week detection
  const isPlanStale = weeklyPlan.weekEnd && new Date(weeklyPlan.weekEnd) < new Date();
  const handleRefreshPlan = () => {
    const newPlan = generateDefaultPlan();
    setWeeklyPlan(newPlan);
    if (user) {
      const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
      setDoc(planDocRef, {
        ...newPlan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => console.error("Error creating new plan:", err));
    }
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText.trim());
      if (!parsed.days || !parsed.weekStart) throw new Error('Format tidak valid. Pastikan ada field "days" dan "weekStart".');
      setWeeklyPlan(parsed);
      setShowImport(false);
      setImportText('');
      setImportError('');
    } catch(e) {
      setImportError(e.message || 'JSON tidak valid.');
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(weeklyPlan, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `hybridtrack-plan-${weeklyPlan.weekStart}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get today's day key
  const todayKey = DAY_KEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const startEditing = (dayKey) => {
    setEditDraft(JSON.parse(JSON.stringify(weeklyPlan.days[dayKey])));
    setEditingDay(dayKey);
    setSelectedDay(dayKey);
  };

  const saveDraft = async () => {
    setSaveStatus('saving');

    const updatedPlan = {
      ...weeklyPlan,
      days: { ...weeklyPlan.days, [editingDay]: editDraft }
    };
    setWeeklyPlan(updatedPlan);
    setEditingDay(null);
    setEditDraft(null);

    // Persist to Firestore
    if (user) {
      try {
        const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
        await setDoc(planDocRef, {
          ...updatedPlan,
          updatedAt: serverTimestamp()
        }, { merge: true });
        setSaveStatus('saved');
      } catch (err) {
        console.error("Error saving plan:", err);
        setSaveStatus('error');
      }
    } else {
      setSaveStatus('saved');
    }

    setTimeout(() => setSaveStatus(null), 3000);
  };

  const updateSetField = (exIdx, setIdx, field, value) => {
    const draft = JSON.parse(JSON.stringify(editDraft));
    draft.exercises[exIdx].sets[setIdx][field] = field === 'reps' ? parseInt(value)||0 : parseFloat(value)||0;
    setEditDraft(draft);
  };

  const addExercise = () => {
    const draft = JSON.parse(JSON.stringify(editDraft));
    draft.exercises.push({ name: '', sets: [{set:1,weight:0,reps:12},{set:2,weight:0,reps:10},{set:3,weight:0,reps:8}] });
    setEditDraft(draft);
  };

  const removeExercise = (exIdx) => {
    const draft = JSON.parse(JSON.stringify(editDraft));
    draft.exercises.splice(exIdx, 1);
    setEditDraft(draft);
  };

  const dayData = selectedDay ? weeklyPlan.days[selectedDay] : null;
  const editData = editingDay ? editDraft : null;

  return (
    <div className="space-y-4 animate-in fade-in rounded-[28px] bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#FFFFFF_58%,_#F5F7F9_100%)] p-4 md:p-5 border border-[#DCE3EA] shadow-[0_20px_50px_rgba(17,24,39,0.06)]">
      {/* Stale week banner */}
      {isPlanStale && (
        <div className="flex items-center justify-between bg-[#FEF3C7] border border-[#F59E0B]/40 rounded-2xl px-4 py-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            <p className="text-xs font-bold text-[#92400E]">
              Plan ini dari minggu lalu. Buat plan baru untuk minggu ini?
            </p>
          </div>
          <button
            onClick={handleRefreshPlan}
            className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-[10px] font-bold rounded-xl transition-colors whitespace-nowrap"
          >
            Buat Baru
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-[#14B8A6]"/>
          Program Mingguan
        </h2>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#0F172A] bg-white/80 border border-[#CBD5E1] px-2 py-1 rounded-full font-medium hidden sm:block shadow-sm">
            {weeklyPlan.label}
          </span>
          <button
            onClick={() => { setShowImport(true); setImportError(''); setImportText(''); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#ECFDF5] hover:bg-[#99F6E4] border border-[#CBD5E1] rounded-lg text-[#14B8A6] text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3"/> Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-[#0F172A] text-xs font-bold transition-colors shadow-sm"
          >
            <Save className="w-3 h-3"/> Export
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="rounded-3xl border border-[#CBD5E1] bg-white/85 backdrop-blur-sm overflow-hidden animate-in slide-in-from-top-2 shadow-[0_10px_30px_rgba(17,24,39,0.06)]">
          <div className="flex items-center justify-between px-4 py-3 bg-[#FFFFFF] border-b border-[#DCE3EA]">
            <div>
              <p className="font-black text-[#0F172A] text-sm">Import Plan JSON</p>
              <p className="text-[10px] text-[#64748B] mt-0.5">Paste JSON jadwal dari coach di bawah ini</p>
            </div>
            <button onClick={() => setShowImport(false)} className="p-1.5 text-[#64748B] hover:text-[#e11d48] rounded-lg transition-colors"><X className="w-4 h-4"/></button>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(''); }}
              rows={8}
              placeholder={'{ "weekStart": "2026-05-11", "weekEnd": "2026-05-17", "label": "...", "days": { ... } }'}
              className="w-full bg-[#fbfcfe] border border-[#CBD5E1] rounded-3xl px-3 py-2.5 text-xs text-[#0F172A] font-mono focus:border-[#14B8A6] outline-none resize-none leading-relaxed"
            />
            {importError && (
              <p className="text-xs text-[#d92d20] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0"/> {importError}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowImport(false)} className="flex-1 py-2 border border-[#CBD5E1] rounded-3xl text-[#0F172A] text-sm font-bold hover:text-[#0F172A] hover:bg-[#FFFFFF] transition-colors">Batal</button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex-1 py-2 bg-[#0F172A] text-[#0F172A] font-black text-sm rounded-3xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Load Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-2">
        {DAY_KEYS.map(dk => {
          const d = weeklyPlan.days[dk];
          const sc = getSessionColor(d.sessionName);
          const isToday = dk === todayKey;
          const isSelected = dk === selectedDay;
          return (
            <button
              key={dk}
              onClick={() => setSelectedDay(isSelected ? null : dk)}
              className={`flex flex-col items-center py-2.5 px-1 rounded-xl border transition-all ${
                isToday
                  ? 'border-[#d6d9df] bg-[#fffdf7] ring-1 ring-[#9edbb4]/60 shadow-sm'
                  : isSelected
                    ? `${sc.border} ${sc.bg}`
                    : 'border-[#CBD5E1] bg-white/80 hover:border-[#cfd4dc] shadow-sm'
              }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 ${isToday ? 'text-[#14B8A6]' : 'text-[#64748B]'}`}>
                {DAY_SHORT[dk]}
              </span>
              <div className={`w-2.5 h-2.5 rounded-full mb-1.5 ${sc.dot}`}/>
              <span className={`text-[8px] font-bold leading-tight text-center ${isToday ? 'text-[#0F172A]' : 'text-[#0F172A]'}`}>
                {(d.sessionName || '').split(' ')[0]}
              </span>
              {isToday && <span className="text-[7px] text-[#14B8A6] font-black mt-0.5">HARI INI</span>}
            </button>
          );
        })}
      </div>

      {/* Detail card for selected day */}
      {selectedDay && dayData && !editingDay && (
        <div className={`rounded-3xl border ${getSessionColor(dayData.sessionName).border} bg-white/88 backdrop-blur-sm overflow-hidden animate-in slide-in-from-top-2 shadow-[0_12px_32px_rgba(17,24,39,0.08)]`}>
          {/* Card header */}
          <div className={`flex items-center justify-between px-4 py-3 ${getSessionColor(dayData.sessionName).bg}`}>
            <div>
              <p className={`font-black text-base ${getSessionColor(dayData.sessionName).text}`}>{dayData.sessionName}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{DAY_LABELS[selectedDay]} · {dayData.type}</p>
            </div>
            <div className="flex items-center gap-2">
              {dayData.notes && (
                <span className="text-[10px] text-[#64748B] max-w-[120px] text-right leading-tight hidden sm:block">
                  {dayData.notes}
                </span>
              )}
              <button
                onClick={() => startEditing(selectedDay)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#FFFFFF] rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Gym session detail */}
          {dayData.type === 'Gym' && dayData.exercises && (
            <div className="divide-y divide-[#DCE3EA]">
              {dayData.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getSessionColor(dayData.sessionName).badge}`}>{exIdx+1}</span>
                    <p className="font-bold text-sm text-[#0F172A]">{ex.name}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {ex.sets.map((s, sIdx) => (
                      <div key={sIdx} className="flex flex-col items-center bg-[#FFFFFF] border border-[#DCE3EA] rounded-3xl px-2.5 py-1.5 min-w-[52px]">
                        <span className="text-[8px] text-[#64748B] font-bold uppercase">S{s.set}</span>
                        <span className="text-sm font-black text-[#0F172A]">{s.weight}kg</span>
                        <span className="text-[9px] text-[#64748B]">×{s.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Run session detail */}
          {dayData.type === 'Run' && dayData.runTarget && (
            <div className="px-4 py-4 flex items-center gap-2 flex-wrap bg-white/60">
              <div className="flex flex-col items-center bg-[#FFFFFF] border border-[#DCE3EA] rounded-3xl px-3 py-2.5 min-w-[52px] shadow-sm">
                <span className="text-[8px] text-[#64748B] uppercase font-bold">Jarak</span>
                <span className="text-lg font-black text-[#0F172A]">{dayData.runTarget.distance}km</span>
              </div>
              <div className="flex flex-col items-center bg-[#FFFFFF] border border-[#DCE3EA] rounded-3xl px-3 py-2.5 min-w-[52px] shadow-sm">
                <span className="text-[8px] text-[#64748B] uppercase font-bold">Pace</span>
                <span className="text-sm font-black text-[#14B8A6]">{dayData.runTarget.pace || '–'}/km</span>
              </div>
              <div className="flex flex-col items-center bg-[#FFFFFF] border border-[#DCE3EA] rounded-3xl px-3 py-2.5 min-w-[52px] shadow-sm">
                <span className="text-[8px] text-[#64748B] uppercase font-bold">Effort</span>
                <span className="text-sm font-black text-[#7c3aed] capitalize">{dayData.runTarget.effort}</span>
              </div>
              <div className="flex flex-col items-center bg-[#FFFFFF] border border-[#DCE3EA] rounded-3xl px-3 py-2.5 min-w-[52px] shadow-sm">
                <span className="text-[8px] text-[#64748B] uppercase font-bold">RPE</span>
                <span className="text-sm font-black text-[#0F172A]">{dayData.runTarget.rpe}</span>
              </div>
            </div>
          )}

          {/* Rest day */}
          {dayData.type === 'Rest' && (
            <div className="px-4 py-4 text-center text-[#0F172A] text-sm">{dayData.notes || 'Rest day'}</div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editingDay && editDraft && (
        <div className="rounded-3xl border border-[#CBD5E1] bg-white/88 backdrop-blur-sm overflow-hidden animate-in slide-in-from-top-2 shadow-[0_12px_32px_rgba(17,24,39,0.08)]">
          <div className="flex items-center justify-between px-4 py-3 bg-[#FFFFFF] border-b border-[#DCE3EA]">
            <p className="font-black text-[#0F172A]">Edit {DAY_LABELS[editingDay]} — {editDraft.sessionName}</p>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <span className="text-[10px] text-[#64748B] font-bold animate-pulse">
                  Menyimpan...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[10px] text-[#14B8A6] font-bold">
                  ✓ Tersimpan
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-[10px] text-[#d07573] font-bold">
                  ✗ Gagal menyimpan
                </span>
              )}
              <button onClick={() => { setEditingDay(null); setEditDraft(null); }} className="p-1.5 text-[#64748B] hover:text-[#e11d48] rounded-lg transition-colors"><X className="w-4 h-4"/></button>
              <button onClick={saveDraft} disabled={saveStatus === 'saving'} className="px-3 py-1.5 bg-[#0F172A] text-[#0F172A] text-xs font-black rounded-xl flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><Save className="w-3 h-3"/> Simpan</button>
            </div>
          </div>


          {/* Edit gym exercises */}
          {editDraft.type === 'Gym' && (
            <div className="p-4 space-y-4">
              {editDraft.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="bg-[#FFFFFF] border border-[#DCE3EA] rounded-3xl p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={ex.name}
                      onChange={e => { const d = JSON.parse(JSON.stringify(editDraft)); d.exercises[exIdx].name = e.target.value; setEditDraft(d); }}
                      className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-sm text-[#0F172A] font-bold focus:border-[#14B8A6] outline-none"
                      placeholder="Nama gerakan"
                    />
                    <button onClick={() => removeExercise(exIdx)} className="p-1.5 text-[#64748B] hover:text-[#e11d48] rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ex.sets.map((s, sIdx) => (
                      <div key={sIdx} className="bg-white rounded-xl p-2 text-center border border-[#DCE3EA]">
                        <p className="text-[8px] text-[#64748B] font-bold mb-1.5">SET {s.set}</p>
                        <input
                          type="number"
                          value={s.weight}
                          onChange={e => updateSetField(exIdx, sIdx, 'weight', e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded px-1 py-0.5 text-xs text-center text-[#0F172A] font-bold mb-1 focus:border-[#14B8A6] outline-none"
                          placeholder="kg"
                        />
                        <input
                          type="number"
                          value={s.reps}
                          onChange={e => updateSetField(exIdx, sIdx, 'reps', e.target.value)}
                          className="w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded px-1 py-0.5 text-xs text-center text-[#0F172A] font-bold focus:border-[#14B8A6] outline-none"
                          placeholder="reps"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addExercise} className="w-full py-2.5 border border-dashed border-[#CBD5E1] rounded-3xl text-[#0F172A] hover:border-[#0F172A] hover:text-[#0F172A] transition-colors text-sm font-bold flex items-center justify-center gap-2">
                <Plus className="w-4 h-4"/> Tambah Gerakan
              </button>
            </div>
          )}

          {/* Edit run target */}
          {editDraft.type === 'Run' && editDraft.runTarget && (
            <div className="p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">Jarak (km)</label>
                <input type="number" value={editDraft.runTarget.distance}
                  onChange={e => { const d=JSON.parse(JSON.stringify(editDraft)); d.runTarget.distance=parseFloat(e.target.value)||0; setEditDraft(d); }}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-bold focus:border-[#14B8A6] outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">Target Pace (/km)</label>
                <input value={editDraft.runTarget.pace||''}
                  onChange={e => { const d=JSON.parse(JSON.stringify(editDraft)); d.runTarget.pace=e.target.value; setEditDraft(d); }}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-bold focus:border-[#14B8A6] outline-none" placeholder="e.g. 6:30" />
              </div>
              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">Effort</label>
                <select value={editDraft.runTarget.effort}
                  onChange={e => { const d=JSON.parse(JSON.stringify(editDraft)); d.runTarget.effort=e.target.value; setEditDraft(d); }}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-2 py-2 text-sm text-[#0F172A] font-bold focus:border-[#14B8A6] outline-none">
                  <option value="easy">Easy</option>
                  <option value="tempo">Tempo</option>
                  <option value="interval">Interval</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">RPE</label>
                <input value={editDraft.runTarget.rpe}
                  onChange={e => { const d=JSON.parse(JSON.stringify(editDraft)); d.runTarget.rpe=e.target.value; setEditDraft(d); }}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-bold focus:border-[#14B8A6] outline-none" placeholder="e.g. 4-5" />
              </div>
            </div>
          )}

          {/* Edit notes */}
          <div className="px-4 pb-4">
            <label className="text-[9px] text-[#64748B] uppercase font-bold block mb-1">Catatan Coach</label>
            <input value={editDraft.notes||''}
              onChange={e => { const d=JSON.parse(JSON.stringify(editDraft)); d.notes=e.target.value; setEditDraft(d); }}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:border-[#14B8A6] outline-none"
              placeholder="Catatan untuk sesi ini..." />
          </div>
        </div>
      )}

    </div>
  );
}


// ─── PLAN VS ACTUAL SUMMARY ─────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]); 

  const [showToast, setShowToast] = useState(false);
  const [editModal, setEditModal] = useState(null);

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyPlan, setWeeklyPlan] = useState(DEFAULT_WEEKLY_PLAN);
  const [activeTrainingBlock, setActiveTrainingBlock] = useState(null);

  // --- 3. AUTHENTICATION LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 4. FETCH DATA DARI FIRESTORE ---
  useEffect(() => {
    if (!user) return;
    const workoutsRef = collection(db, 'users', user.uid, 'workouts');
    const unsubscribe = onSnapshot(workoutsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkouts(data);
    }, (error) => {
      console.error("Error fetching data:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // --- 4B. FETCH PLAN DARI FIRESTORE ---
  useEffect(() => {
    if (!user) return;
    const planDocRef = doc(db, 'users', user.uid, 'plan', 'current');
    const unsubscribe = onSnapshot(planDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const migrated = migratePlan(data);
        setWeeklyPlan(migrated);
      } else {
        // First-time user: generate and save default plan
        const defaultPlan = generateDefaultPlan();
        setWeeklyPlan(defaultPlan);
        setDoc(planDocRef, {
          ...defaultPlan,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Error creating default plan:", err));
      }
    }, (error) => {
      console.error("Error fetching plan:", error);
      setWeeklyPlan(generateDefaultPlan());
    });
    return () => unsubscribe();
  }, [user]);

  // --- 4C. FETCH ACTIVE TRAINING BLOCK DARI FIRESTORE ---
  useEffect(() => {
    if (!user) return;
    const trainingBlocksRef = collection(db, 'users', user.uid, 'trainingBlocks');
    const unsubscribe = onSnapshot(trainingBlocksRef, (snapshot) => {
      const blocks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(b => b.status === 'active');
      if (blocks.length > 0) {
        // Pick the one with the newest importedAt
        const sorted = blocks.sort((a, b) => {
          const aTime = a.importedAt?.toMillis?.() || 0;
          const bTime = b.importedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setActiveTrainingBlock(sorted[0]);
      } else {
        setActiveTrainingBlock(null);
      }
    }, (error) => {
      console.error("Error fetching training blocks:", error);
      setActiveTrainingBlock(null);
    });
    return () => unsubscribe();
  }, [user]);

  // --- 4D. DERIVED EFFECTIVE PLAN (Training Block → WeeklyPlan shape) ---
  const effectivePlan = useMemo(() => {
    if (activeTrainingBlock?.trainingBlock?.sessions) {
      const block = activeTrainingBlock.trainingBlock;
      const days = {};
      const DAY_KEYS_LOCAL = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      DAY_KEYS_LOCAL.forEach(day => {
        const session = block.sessions.find(s => s.day === day);
        if (session) {
          days[day] = {
            type: session.type === 'Strength' ? 'Gym' : session.type === 'Run' ? 'Run' : 'Rest',
            sessionName: session.sessionName || null,
            notes: session.notes || '',
            exercises: session.exercises || null,
            runTarget: session.runTarget || null,
          };
        } else {
          days[day] = { type: 'Rest', sessionName: null, notes: '', exercises: null, runTarget: null };
        }
      });
      return {
        weekStart: weeklyPlan.weekStart,
        weekEnd: weeklyPlan.weekEnd,
        label: block.name || 'Training Block',
        days,
      };
    }
    return weeklyPlan; // fallback
  }, [activeTrainingBlock, weeklyPlan]);

  // --- 5. FUNGSI LOGIN / LOGOUT ---
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login gagal:", error);
      alert("Login gagal. Pastikan fitur Authentication Google di Firebase sudah aktif.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setWorkouts([]);
  };

  // --- 6. TAMBAH & HAPUS DATA ---
  const handleAddData = async (newData) => {
    if (!user) return;
    try {
      const newId = Date.now().toString();
      const docRef = doc(db, 'users', user.uid, 'workouts', newId);
      await setDoc(docRef, { ...newData, createdAt: newId });

      const updatedWorkouts = [...workouts, { id: newId, ...newData }];
      setActiveTab('dashboard');

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Gagal menyimpan latihan:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'workouts', id.toString()));
    } catch (err) {
      console.error("Gagal menghapus:", err);
    }
  };

  // --- 7. EDIT DATA ---
  const handleEdit = async (id, updatedData) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'workouts', id.toString());
      await setDoc(docRef, updatedData, { merge: true });
    } catch (err) {
      console.error("Gagal update:", err);
    }
  };

  // --- TAMPILAN LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-full bg-gradient-to-br from-[#99F6E4]/20 to-[#5a90b8]/20 border border-[#CBD5E1]">
          <BrainCircuit className="w-12 h-12 text-[#14B8A6] animate-pulse" />
        </div>
        <p className="text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-[#99F6E4] to-[#5a90b8] bg-clip-text text-transparent">Memuat HybridTrack...</p>
      </div>
    );
  }

  // --- TAMPILAN HALAMAN LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative bg blobs */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-[#FFFFFF] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#14B8A6]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#99F6E4]/20 to-[#14B8A6]/20 border border-[#CBD5E1] mb-6 shadow-2xl shadow-[#99F6E4]/10">
            <Flame className="w-14 h-14 text-[#14B8A6] animate-bounce" />
          </div>
          <h1 className="text-4xl font-black mb-2">
            <span className="bg-gradient-to-r from-[#99F6E4] to-[#14B8A6] bg-clip-text text-transparent">Hybrid</span>
            <span className="bg-gradient-to-r from-[#5a90b8] to-[#64748B] bg-clip-text text-transparent">Track</span>
          </h1>
          <p className="text-[#0F172A] mb-10 max-w-sm text-sm leading-relaxed">Pantau latihan Lari dan Gym kamu, tersimpan otomatis di awan.</p>
          <button 
            onClick={loginWithGoogle}
            className="bg-white text-[#0a1929] font-bold px-8 py-4 rounded-full flex items-center shadow-2xl shadow-[#99F6E4]/20 active:scale-95 transition-transform hover:shadow-[#99F6E4]/30"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN APLIKASI UTAMA ---
  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#0F172A] font-sans selection:bg-[#99F6E4]/30 pb-28 md:pb-0">

      {/* HEADER */}
      <header className="bg-[#F5F7F9]/95 backdrop-blur-md border-b border-[#CBD5E1]/50 sticky top-0 z-40">
        <div className="max-w-md md:max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#99F6E4]/20 to-[#5a90b8]/20">
              <Flame className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <h1 className="text-xl font-black tracking-tight hidden sm:block">
              <span className="bg-gradient-to-r from-[#99F6E4] to-[#14B8A6] bg-clip-text text-transparent">Hybrid</span>
              <span className="bg-gradient-to-r from-[#5a90b8] to-[#64748B] bg-clip-text text-transparent">Track</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2">

            <button onClick={handleLogout} className="p-1.5 text-[#0F172A] hover:text-[#0F172A] bg-[#8B5CF6] rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Gradient line at bottom of header */}
        <div className="h-px bg-gradient-to-r from-[#8B5CF6] via-[#99F6E4] to-[#14B8A6]" />
      </header>

      {/* TOAST NOTIF */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-[#14B8A6] to-[#99F6E4] text-[#05131c] px-5 py-3 rounded-full flex items-center shadow-2xl shadow-[rgba(17,24,39,0.08)] animate-in slide-in-from-top-5 w-11/12 max-w-sm justify-center">
          <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="font-bold text-sm truncate">Data tersimpan di Cloud!</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-md md:max-w-5xl mx-auto px-4 py-6 md:pt-14 space-y-6">
        {activeTab === 'dashboard' && <Dashboard workouts={workouts} weeklyPlan={effectivePlan} />}
        {activeTab === 'add' && <QuickInput onAdd={handleAddData} workouts={workouts} weeklyPlan={weeklyPlan} />}
        {activeTab === 'history' && <History workouts={workouts} onDelete={handleDelete} onEdit={(w) => setEditModal(w)} />}
        {activeTab === 'plan' && <WeeklyPlanTab weeklyPlan={weeklyPlan} setWeeklyPlan={setWeeklyPlan} workouts={workouts} user={user} />}
      </main>

      {/* NAVIGATION */}
      <nav className="fixed bottom-0 w-full bg-[#F5F7F9]/98 backdrop-blur-xl border-t border-[#CBD5E1]/50 md:bottom-auto md:top-16 md:bg-[#F5F7F9]/80 md:border-b z-30 pb-safe">
        <div className="max-w-md md:max-w-5xl mx-auto flex justify-around items-center h-20 md:h-12 px-2 pb-2 md:pb-0">
          <NavButton icon={<Activity />} label="Dasbor" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<ClipboardList />} label="Plan" isActive={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton icon={<PlusCircle />} label="Input" isActive={activeTab === 'add'} onClick={() => setActiveTab('add')} highlight />
          <NavButton icon={<List />} label="Riwayat" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </div>
      </nav>

      {/* COACH INSIGHT MODAL */}
      

      {/* EDIT MODAL */}
      {editModal && (
        <EditModal
          workout={editModal}
          onClose={() => setEditModal(null)}
          onSave={async (updatedData) => { await handleEdit(editModal.id, updatedData); setEditModal(null); }}
        />
      )}
    </div>
  );
}

// --- KOMPONEN NAV BUTTON ---
function NavButton({ icon, label, isActive, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200
        ${isActive ? 'text-[#14B8A6]' : 'text-[#64748B] hover:text-[#0F172A]'}
        ${highlight ? '' : ''}
      `}
    >
      <div className={`
        ${highlight ? 'bg-[#14B8A6] text-white p-2.5 rounded-3xl shadow-md shadow-[rgba(20,184,166,0.22)] active:scale-95 transition-transform' : 'p-1'}
        
      `}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

// --- LOGIC: COACH ENGINE ---
function analyzeAlerts(workouts) {
  const alerts = [];
  const recent = [...workouts].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-5);
  const highRPECount = recent.filter(w => (w.type === 'Gym' || w.type === 'Lari') && w.rpe >= 8).length;
  if (highRPECount >= 3) alerts.push("3 sesi terakhir RPE tinggi (>=8). Risiko overtraining. Ambil Deload!");
  const badEasyRun = recent.find(w => w.type === 'Lari' && w.category === 'Easy Run' && (w.rpe > 6 || w.planStatus === 'Terlalu Berat'));
  if (badEasyRun) alerts.push("Easy run terakhirmu terlalu kencang. Rem pace-mu di lari berikutnya.");
  return alerts;
}

// --- TAB 1: DASHBOARD ---

const parseLocalDate = (dateStr) => dateStr ? new Date(`${dateStr}T00:00:00`) : null;

function getCurrentWeekRange(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getDashboardSummary(workouts, weeklyPlan) {
  const { start, end } = getCurrentWeekRange();
  const thisWeek = workouts.filter(w => {
    const date = parseLocalDate(w.date);
    return date && date >= start && date <= end;
  });
  const runDistance = thisWeek
    .filter(w => w.type === 'Lari')
    .reduce((sum, w) => sum + (parseFloat(w.distance) || 0), 0);
  const gymSessions = thisWeek.filter(w => w.type === 'Gym').length;

  const planStart = parseLocalDate(weeklyPlan?.weekStart);
  const planEnd = parseLocalDate(weeklyPlan?.weekEnd);
  if (planEnd) planEnd.setHours(23, 59, 59, 999);
  const planCoversCurrentWeek = planStart && planEnd && planStart <= start && planEnd >= end;
  const plannedDays = planCoversCurrentWeek && weeklyPlan?.days
    ? DAY_KEYS.map((dayKey, index) => {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
        return {
          date,
          plan: getPlannedSession(weeklyPlan, date),
        };
      }).filter(item => item.plan && item.plan.type !== 'Rest')
    : [];
  const completedPlanned = plannedDays.filter(item => {
    const dateKey = [
      item.date.getFullYear(),
      String(item.date.getMonth() + 1).padStart(2, '0'),
      String(item.date.getDate()).padStart(2, '0'),
    ].join('-');
    const expectedType = item.plan.type === 'Run' ? 'Lari' : item.plan.type;
    return workouts.some(w => w.date === dateKey && w.type === expectedType);
  }).length;

  return {
    runDistance,
    gymSessions,
    consistency: plannedDays.length
      ? Math.min(100, Math.round((completedPlanned / plannedDays.length) * 100))
      : null,
    completedPlanned,
    plannedCount: plannedDays.length,
  };
}

function getExerciseProgress(workouts) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 90);
  const exerciseMap = new Map();

  workouts
    .filter(w => w.type === 'Gym' && w.date && parseLocalDate(w.date) >= cutoff)
    .forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        const name = (exercise.exercise || exercise.name || '').trim();
        const bestWeight = Math.max(0, ...(exercise.sets || []).map(set => parseFloat(set.weight) || 0));
        if (!name || bestWeight <= 0) return;
        const key = name.toLocaleLowerCase();
        const entry = exerciseMap.get(key) || { exercise: name, points: [] };
        entry.points.push({
          timestamp: parseLocalDate(workout.date).getTime(),
          weight: bestWeight,
        });
        exerciseMap.set(key, entry);
      });
    });

  return [...exerciseMap.values()].map(entry => {
    const points = entry.points.sort((a, b) => a.timestamp - b.timestamp);
    const currentBest = Math.max(...points.map(point => point.weight));
    return {
      exercise: entry.exercise,
      currentBest,
      improvement: points.length >= 2 ? currentBest - points[0].weight : null,
      points,
    };
  }).sort((a, b) =>
    (b.improvement ?? -Infinity) - (a.improvement ?? -Infinity) ||
    b.currentBest - a.currentBest
  )[0] || null;
}

function getRunningProgress(workouts) {
  const runs = workouts
    .filter(w => w.type === 'Lari' && w.date)
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
  const validRuns = runs.filter(w =>
    (parseFloat(w.distance) || 0) > 0 && (parseFloat(w.duration) || 0) > 0
  );
  const fiveKRuns = validRuns.filter(w => {
    const distance = parseFloat(w.distance);
    return distance >= 4.9 && distance <= 5.1;
  });
  const fiveKPB = fiveKRuns.length
    ? Math.min(...fiveKRuns.map(w => (parseFloat(w.duration) / parseFloat(w.distance)) * 5))
    : null;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 30);
  const recentRuns = validRuns.filter(w => parseLocalDate(w.date) >= cutoff);
  const recentDistance = recentRuns.reduce((sum, w) => sum + parseFloat(w.distance), 0);
  const recentDuration = recentRuns.reduce((sum, w) => sum + parseFloat(w.duration), 0);

  return {
    fiveKPB,
    averagePace: recentDistance > 0 ? recentDuration / recentDistance : null,
    longestRun: runs.reduce((max, w) => Math.max(max, parseFloat(w.distance) || 0), 0),
    points: validRuns.slice(-10).map(w => ({
      value: parseFloat(w.duration) / parseFloat(w.distance),
    })),
  };
}

function formatDashboardTime(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  let wholeMinutes = Math.floor(minutes);
  let seconds = Math.round((minutes - wholeMinutes) * 60);
  if (seconds === 60) {
    wholeMinutes += 1;
    seconds = 0;
  }
  return `${wholeMinutes}:${seconds.toString().padStart(2, '0')}`;
}

function MiniTrend({ points, color = '#14B8A6', invert = false }) {
  const values = points.map(point => point.value ?? point.weight).filter(Number.isFinite);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const chartPoints = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    const y = 28 - (invert ? 1 - ratio : ratio) * 22;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 32" className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={chartPoints} fill="none" stroke={color} strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DashboardHero({ summary }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#0F172A] p-5 text-white shadow-[0_22px_55px_rgba(15,23,42,0.24)] md:p-7">
      <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#14B8A6]/25 blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#7C3AED]/20 blur-3xl" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#5EEAD4]">Performance this week</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Your training, at a glance.</h2>
        <p className="mt-1 text-xs text-slate-300">Consistency first. Progress follows.</p>
        <div className="mt-5 grid grid-cols-3 gap-2.5 md:gap-4">
          <HeroMetric icon={<Activity />} value={summary.runDistance.toFixed(1)} label="Run km" color="text-[#2DD4BF]" />
          <HeroMetric icon={<Dumbbell />} value={summary.gymSessions} label="Gym sessions" color="text-[#A78BFA]" />
          <HeroMetric icon={<Target />} value={summary.consistency === null ? '—' : `${summary.consistency}%`}
            label="Consistency" color="text-[#FBBF24]" achievement />
        </div>
        <p className="mt-3 text-[10px] text-slate-400">
          {summary.consistency === null
            ? 'Consistency appears when the active plan covers this week.'
            : `${summary.completedPlanned} of ${summary.plannedCount} planned workouts completed.`}
        </p>
      </div>
    </section>
  );
}

function HeroMetric({ icon, value, label, color, achievement = false }) {
  return (
    <div className={`rounded-2xl border p-3 md:p-4 ${achievement ? 'border-[#F59E0B]/30 bg-[#F59E0B]/10' : 'border-white/10 bg-white/[0.07]'}`}>
      {React.cloneElement(icon, { className: `mb-3 h-4 w-4 ${color}` })}
      <p className={`text-xl font-black md:text-3xl ${achievement ? color : ''}`}>{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-300">{label}</p>
    </div>
  );
}

function StrengthProgressCard({ progress }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#7C3AED]/25 bg-white p-5 shadow-[0_14px_35px_rgba(51,65,85,0.08)]">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#7C3AED]/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7C3AED]">Strength progress</p>
            <h3 className="mt-1 text-lg font-black text-[#0F172A]">Best Progress Exercise</h3>
          </div>
          <div className="rounded-2xl bg-[#7C3AED] p-2.5 text-white"><Dumbbell className="h-5 w-5" /></div>
        </div>
        {progress ? (
          <>
            <p className="mt-5 min-h-[48px] text-xl font-black leading-tight text-[#334155]">{progress.exercise}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ProgressMetric label="Best Weight" value={`${progress.currentBest}kg`} />
              <ProgressMetric label="90 Day Progress"
                value={progress.improvement === null ? '—' : `${progress.improvement >= 0 ? '+' : ''}${progress.improvement}kg`}
                accent />
            </div>
            {progress.points.length >= 2 && (
              <div className="mt-3 rounded-2xl border border-[#EDE9FE] bg-[#FAFAFF] px-3 pt-2">
                <MiniTrend points={progress.points} color="#7C3AED" />
              </div>
            )}
          </>
        ) : (
          <p className="mt-5 rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">Log a gym exercise to start tracking strength progress.</p>
        )}
      </div>
    </section>
  );
}

function ProgressMetric({ label, value, accent = false }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? 'bg-[#7C3AED] text-white' : 'bg-[#F5F3FF]'}`}>
      <p className={`text-[9px] font-bold uppercase tracking-wider ${accent ? 'text-violet-100' : 'text-[#64748B]'}`}>{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function RunningProgressCard({ progress }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#14B8A6]/30 bg-white p-5 shadow-[0_14px_35px_rgba(51,65,85,0.08)]">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#14B8A6]/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Running progress</p>
            <h3 className="mt-1 text-lg font-black text-[#0F172A]">Your running markers</h3>
          </div>
          <div className="rounded-2xl bg-[#14B8A6] p-2.5 text-white"><TrendingUp className="h-5 w-5" /></div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <RunMetric label="5K PB" value={formatDashboardTime(progress.fiveKPB)} />
          <RunMetric label="30D Pace" value={progress.averagePace ? `${formatDashboardTime(progress.averagePace)}/km` : '—'} accent />
          <RunMetric label="Longest" value={progress.longestRun > 0 ? `${progress.longestRun.toFixed(1)}km` : '—'} />
        </div>
        {progress.points.length >= 2 && (
          <div className="mt-3 rounded-2xl border border-[#CCFBF1] bg-[#F8FFFD] px-3 pt-2">
            <MiniTrend points={progress.points} color="#14B8A6" invert />
          </div>
        )}
        <p className="mt-3 text-[10px] text-[#64748B]">5K PB uses runs between 4.9–5.1 km. Pace is distance-weighted over 30 days.</p>
      </div>
    </section>
  );
}

function RunMetric({ label, value, accent = false }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? 'bg-[#CCFBF1]' : 'bg-[#F0FDFA]'}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
      <p className={`mt-2 text-lg font-black ${accent ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>{value}</p>
    </div>
  );
}

function Dashboard({ workouts, weeklyPlan }) {
  const summary = getDashboardSummary(workouts, weeklyPlan);
  const strengthProgress = useMemo(() => getExerciseProgress(workouts), [workouts]);
  const runningProgress = useMemo(() => getRunningProgress(workouts), [workouts]);

  // ─── MVP Dashboard Computations ──────────────────────────────────────────
  const streak = useMemo(() => {
    // Dynamic import handled via top-level import
    const { computeStreak } = dashboardUtils;
    return computeStreak(workouts);
  }, [workouts]);

  const weeklyVolume = useMemo(() => {
    const { getWeeklyVolume } = dashboardUtils;
    return getWeeklyVolume(workouts, 12);
  }, [workouts]);

  const paceTrend = useMemo(() => {
    const { getPaceTrend } = dashboardUtils;
    return getPaceTrend(workouts, 20);
  }, [workouts]);

  const completion = useMemo(() => {
    const { getCompletionRate } = dashboardUtils;
    return getCompletionRate(workouts, weeklyPlan);
  }, [workouts, weeklyPlan]);

  const gymPRs = useMemo(() => {
    const { getGymPRs } = dashboardUtils;
    return getGymPRs(workouts, 5);
  }, [workouts]);

  const runningPBs = useMemo(() => {
    const { getRunningPBs } = dashboardUtils;
    return getRunningPBs(workouts);
  }, [workouts]);

  // ─── Planning Engine + Coach Insight ────────────────────────────────────
  const nextSession = useMemo(() => {
    return getNextSession({ weeklyPlan, completedWorkouts: workouts, currentDate: new Date() });
  }, [weeklyPlan, workouts]);

  const coachInsight = useMemo(() => {
    return generateCoachInsight({
      nextSession,
      weeklyRunDistance: summary.runDistance,
      weeklyGymSessions: summary.gymSessions,
      currentWeight: null,
      streak: streak.current,
    });
  }, [nextSession, summary.runDistance, summary.gymSessions, streak.current]);

  // ─── Dynamic Imports for Dashboard Components ───────────────────────────
  const StreakDisplay = React.lazy(() => import('./components/dashboard/StreakDisplay'));
  const VolumeTrendChart = React.lazy(() => import('./components/dashboard/VolumeTrendChart'));
  const PaceTrendChart = React.lazy(() => import('./components/dashboard/PaceTrendChart'));
  const CompletionRate = React.lazy(() => import('./components/dashboard/CompletionRate'));
  const PersonalRecords = React.lazy(() => import('./components/dashboard/PersonalRecords'));

  const Fallback = () => <div className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-xl h-24" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Hero Section ── */}
      <DashboardHero summary={summary} />

      {/* ── Streak + Completion Rate ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <React.Suspense fallback={<Fallback />}>
          <StreakDisplay current={streak.current} longest={streak.longest} />
        </React.Suspense>
        <React.Suspense fallback={<Fallback />}>
          <CompletionRate
            rate={completion.rate}
            completed={completion.completed}
            planned={completion.planned}
            message={completion.message}
          />
        </React.Suspense>
      </div>

      {/* ── Volume Trends ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <React.Suspense fallback={<Fallback />}>
          <VolumeTrendChart
            data={weeklyVolume.map(w => ({ label: w.week, value: w.runKm }))}
            unit="km"
            title="Running Volume (Weekly)"
            color="#14B8A6"
          />
        </React.Suspense>
        <React.Suspense fallback={<Fallback />}>
          <VolumeTrendChart
            data={weeklyVolume.map(w => ({ label: w.week, value: Math.round(w.gymVolume / 1000) }))}
            unit="k kg"
            title="Gym Volume (Weekly)"
            color="#8B5CF6"
          />
        </React.Suspense>
      </div>

      {/* ── Pace Trend ── */}
      <React.Suspense fallback={<Fallback />}>
        <PaceTrendChart data={paceTrend} />
      </React.Suspense>

      {/* ── Strength & Running Progress (existing cards) ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StrengthProgressCard progress={strengthProgress} />
        <RunningProgressCard progress={runningProgress} />
      </div>

      {/* ── Personal Records ── */}
      <React.Suspense fallback={<Fallback />}>
        <PersonalRecords gymPRs={gymPRs} runningPBs={runningPBs} />
      </React.Suspense>

      {/* ── Today's Plan Card (existing) ── */}
      {(() => {
        const todayPlan = getPlannedSession(weeklyPlan, new Date());
        if (!todayPlan || todayPlan.type === 'Rest') return null;
        const sc = getSessionColor(todayPlan.sessionName);
        return (
          <div className={`rounded-3xl border ${sc.border} bg-white overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-3 ${sc.bg}`}>
              <div>
                <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider mb-0.5">Rencana Hari Ini</p>
                <p className={`font-black text-base ${sc.text}`}>{todayPlan.sessionName}</p>
              </div>
              <div className="text-right">
                {todayPlan.type === 'Gym' && todayPlan.exercises && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${sc.badge}`}>{todayPlan.exercises.length} gerakan</span>
                )}
                {todayPlan.type === 'Run' && todayPlan.runTarget && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${sc.badge}`}>{todayPlan.runTarget.distance}km</span>
                )}
              </div>
            </div>
            {todayPlan.type === 'Gym' && todayPlan.exercises && (
              <div className="divide-y divide-[#DCE3EA]">
                {todayPlan.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="px-4 py-2.5 flex items-center gap-3">
                    <span className={`text-[9px] font-black w-5 h-5 flex items-center justify-center rounded ${sc.badge} flex-shrink-0`}>{exIdx+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#0F172A] truncate mb-1">{ex.name}</p>
                      <div className="flex gap-1.5">
                        {ex.sets.map((s, sIdx) => (
                          <span key={sIdx} className="text-[9px] bg-[#8B5CF6]/70 text-[#0F172A] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            S{s.set}: {s.weight}kg×{s.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {todayPlan.type === 'Run' && todayPlan.runTarget && (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex flex-col items-center bg-[#FFFFFF] rounded-xl px-3 py-2 min-w-[52px]">
                  <span className="text-[8px] text-[#64748B] uppercase font-bold">Jarak</span>
                  <span className="text-base font-black text-[#0F172A]">{todayPlan.runTarget.distance}km</span>
                </div>
                {todayPlan.runTarget.pace && (
                  <div className="flex flex-col items-center bg-[#FFFFFF] rounded-xl px-3 py-2 min-w-[52px]">
                    <span className="text-[8px] text-[#64748B] uppercase font-bold">Pace</span>
                    <span className="text-sm font-black text-[#14B8A6]">{todayPlan.runTarget.pace}/km</span>
                  </div>
                )}
                <div className="flex flex-col items-center bg-[#FFFFFF] rounded-xl px-3 py-2 min-w-[52px]">
                  <span className="text-[8px] text-[#64748B] uppercase font-bold">RPE</span>
                  <span className="text-sm font-black text-[#0F172A]">{todayPlan.runTarget.rpe}</span>
                </div>
                <div className="flex flex-col items-center bg-[#FFFFFF] rounded-xl px-3 py-2 min-w-[52px]">
                  <span className="text-[8px] text-[#64748B] uppercase font-bold">Effort</span>
                  <span className="text-xs font-black text-[#14B8A6] capitalize">{todayPlan.runTarget.effort}</span>
                </div>
              </div>
            )}
            {todayPlan.notes && (
              <div className="px-4 pb-3">
                <p className="text-[10px] text-[#64748B] italic">{todayPlan.notes}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Coach Insight ── */}
      {coachInsight && (
        <div className="rounded-3xl border border-[#CBD5E1]/50 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-b border-[#DCE3EA]">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#14B8A6]" />
              <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Coach Insight</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              coachInsight.priority === 'high' ? 'bg-[#FEF3C7] text-[#92400E]' :
              coachInsight.priority === 'low' ? 'bg-[#F1F5F9] text-[#64748B]' :
              'bg-[#ECFDF5] text-[#065F46]'
            }`}>
              {coachInsight.priority === 'high' ? 'Important' : coachInsight.priority === 'low' ? 'Note' : 'Tip'}
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-[#0F172A] mb-1">{coachInsight.title}</p>
            <p className="text-xs text-[#64748B] leading-relaxed">{coachInsight.message}</p>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {workouts.length === 0 && (
        <div className="text-center py-10 opacity-50">
          <p className="text-sm">Mulai isi data di tab Input!</p>
        </div>
      )}
    </div>
  );
}

function QuickInput({ onAdd, workouts, weeklyPlan }) {
  const [type, setType] = useState('Lari');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [runCat, setRunCat] = useState('Easy Run');
  const [dist, setDist] = useState('');
  const [dur, setDur] = useState('');
  const [hr, setHr] = useState('');
  const [cadence, setCadence] = useState('');
  const [runRpe, setRunRpe] = useState('5');
  const [planStatus, setPlanStatus] = useState('Sesuai Plan');

  const [gymCat, setGymCat] = useState('Push');
  const [gymRpe, setGymRpe] = useState('7');

  const newExercise = () => ({ exercise: '', sets: [{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }] });
  const [fromPlan, setFromPlan] = React.useState(false);

  const applyPlanForDate = React.useCallback((dateStr) => {
    const plan = getPlannedSession(weeklyPlan, new Date(dateStr + 'T00:00:00'));
    if (!plan) { setFromPlan(false); return; }
    if (plan.type === 'Gym' && plan.exercises && plan.exercises.length > 0) {
      setType('Gym');
      const cat = plan.sessionName || 'Push';
      setGymCat(['Push','Pull','Legs'].includes(cat) ? cat : 'Push');
      const filled = plan.exercises.map(ex => ({
        exercise: ex.name || ex.exercise || '',
        sets: (ex.sets || [{weight:'',reps:''},{weight:'',reps:''},{weight:'',reps:''}])
          .slice(0,5).map(s => ({ weight: s.weight != null ? String(s.weight) : '', reps: s.reps != null ? String(s.reps) : '' }))
      }));
      while (filled.length < 2) filled.push(newExercise());
      setGymExercises(filled);
      if (plan.notes) setNotes(plan.notes);
      setFromPlan(true);
    } else if (plan.type === 'Run' && plan.runTarget) {
      setType('Lari');
      const rt = plan.runTarget;
      setRunCat(plan.sessionName || 'Easy Run');
      if (rt.distance) setDist(String(rt.distance));
      const rpeVal = parseInt(rt.rpe) || 4;
      setRunRpe(rpeVal);
      if (plan.notes) setNotes(plan.notes);
      setFromPlan(true);
    } else { setFromPlan(false); }
  }, [weeklyPlan]);

  React.useEffect(() => { applyPlanForDate(date); }, []); // eslint-disable-line

  const handleDateChange = (newDate) => {
    setDate(newDate);
    applyPlanForDate(newDate);
  };

  const exerciseTemplates = React.useMemo(() => {
    const bucket = { Push: [], Pull: [], Legs: [], Upper: [], Lower: [], 'Full Body': [] };
    const seen = { Push: new Set(), Pull: new Set(), Legs: new Set(), Upper: new Set(), Lower: new Set(), 'Full Body': new Set() };
    workouts
      .filter(w => w.type === 'Gym' && w.category && Array.isArray(w.exercises))
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .forEach(w => {
        const cat = bucket[w.category] ? w.category : null;
        if (!cat) return;
        w.exercises.forEach(ex => {
          const name = (ex.exercise || ex.name || '').trim();
          if (!name || seen[cat].has(name.toLowerCase())) return;
          seen[cat].add(name.toLowerCase());
          bucket[cat].push({
            name,
            sets: (ex.sets || []).map((s, idx) => ({ set: idx + 1, weight: s.weight, reps: s.reps }))
          });
        });
      });
    return bucket;
  }, [workouts]);

  const latestGymSessionByCategory = React.useMemo(() => {
    const bucket = { Push: null, Pull: null, Legs: null, Upper: null, Lower: null, 'Full Body': null };
    workouts
      .filter(w => w.type === 'Gym' && w.category && Array.isArray(w.exercises) && w.exercises.length > 0)
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .forEach(w => {
        if (bucket[w.category] === null && bucket.hasOwnProperty(w.category)) {
          bucket[w.category] = w;
        }
      });
    return bucket;
  }, [workouts]);

  const loadLastGymSession = () => {
    const last = latestGymSessionByCategory[gymCat];
    if (!last) return;
    const filled = (last.exercises || []).map(ex => ({
      exercise: ex.exercise || ex.name || '',
      sets: (ex.sets || [{weight:'',reps:''},{weight:'',reps:''},{weight:'',reps:''}])
        .slice(0,5).map(s => ({ weight: s.weight != null ? String(s.weight) : '', reps: s.reps != null ? String(s.reps) : '' }))
    }));
    while (filled.length < 2) filled.push(newExercise());
    setType('Gym');
    setGymExercises(filled);
    if (last.rpe) setGymRpe(String(last.rpe));
    setFromPlan(false);
  };

  const applyTemplateToExercise = (eIdx, templateName) => {
    const templates = exerciseTemplates[gymCat] || [];
    const picked = templates.find(t => t.name === templateName);
    if (!picked) return;
    setGymExercises(prev => prev.map((ex, i) => i === eIdx ? ({
      ...ex,
      exercise: picked.name,
      sets: picked.sets.length > 0
        ? picked.sets.map(s => ({ weight: s.weight != null ? String(s.weight) : '', reps: s.reps != null ? String(s.reps) : '' }))
        : ex.sets
    }) : ex));
  };

  const [gymExercises, setGymExercises] = useState([newExercise(), newExercise(), newExercise(), newExercise()]);

  const updateExName   = (eIdx, val) => setGymExercises(prev => prev.map((e,i) => i===eIdx ? {...e, exercise: val} : e));
  const updateExSet    = (eIdx, sIdx, field, val) => setGymExercises(prev => prev.map((e,i) => i===eIdx ? {...e, sets: e.sets.map((s,j) => j===sIdx ? {...s,[field]:val} : s)} : e));
  const addExSet       = (eIdx) => setGymExercises(prev => prev.map((e,i) => i===eIdx && e.sets.length < 4 ? {...e, sets:[...e.sets,{weight:'',reps:''}]} : e));
  const removeExSet    = (eIdx, sIdx) => setGymExercises(prev => prev.map((e,i) => i===eIdx ? {...e, sets: e.sets.filter((_,j)=>j!==sIdx)} : e));
  const addExercise    = () => { if(gymExercises.length < 10) setGymExercises(prev => [...prev, newExercise()]); };
  const removeExercise = (eIdx) => { if(gymExercises.length > 1) setGymExercises(prev => prev.filter((_,i)=>i!==eIdx)); };

  const [sleep, setSleep] = useState('');
  const [soreness, setSoreness] = useState('5');
  const [fatigue, setFatigue] = useState('5');
  const [bodyWeight, setBodyWeight] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'Lari') {
      const d = parseFloat(dist), m = parseInt(dur);
      const pace = (d > 0 && m > 0) ? parseFloat((m / d).toFixed(4)) : null;
      onAdd({ type, category: runCat, date, distance: d, duration: m, hr: parseInt(hr)||null, cadence: parseInt(cadence)||null, rpe: parseInt(runRpe), notes, planStatus, pace });
    } else if (type === 'Gym') {
      const validExercises = gymExercises
        .filter(e => e.exercise && e.sets.some(s => s.weight && s.reps))
        .map(e => ({
          exercise: e.exercise,
          sets: e.sets.filter(s => s.weight && s.reps).map(s => ({ weight: parseFloat(s.weight), reps: parseInt(s.reps) })),
        }));
      if (validExercises.length === 0) return;
      onAdd({ type, category: gymCat, date, exercises: validExercises, rpe: parseInt(gymRpe), notes });
    } else {
      onAdd({ type: 'Recovery', date, sleep: parseFloat(sleep), soreness: parseInt(soreness), fatigue: parseInt(fatigue), weight: parseFloat(bodyWeight)||null, notes });
    }
  };

  const typeConfig = {
    Lari:     { active: 'bg-[#14B8A6] text-white shadow-lg shadow-[rgba(20,184,166,0.22)]', submit: 'bg-[#14B8A6] hover:bg-[#0F766E] text-white shadow-[rgba(20,184,166,0.22)]', border: 'focus:border-[#14B8A6]' },
    Gym:      { active: 'bg-[#8B5CF6] text-white shadow-lg shadow-[rgba(139,92,246,0.22)]', submit: 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[rgba(139,92,246,0.22)]', border: 'focus:border-[#8B5CF6]' },
    Recovery: { active: 'bg-[#64748B] text-white shadow-lg shadow-[rgba(100,116,139,0.18)]', submit: 'bg-[#64748B] hover:bg-[#475569] text-white shadow-[rgba(100,116,139,0.18)]', border: 'focus:border-[#64748B]' },
  };

  return (
    <div className="bg-white border border-[#CBD5E1] p-5 rounded-3xl shadow-[0_12px_32px_rgba(17,24,39,0.08)] border border-[#DCE3EA] animate-in fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center">
          <PlusCircle className="w-5 h-5 mr-2 text-[#14B8A6]"/> Input Cepat
        </h2>
        {fromPlan && (
          <div className="flex items-center gap-1.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full px-3 py-1">
            <ClipboardList className="w-3 h-3 text-[#14B8A6]"/>
            <span className="text-[10px] font-bold text-[#14B8A6]">Dari Plan</span>
          </div>
        )}
      </div>

      <div className="flex p-1.5 bg-[#F5F7F9] rounded-3xl mb-6 shadow-inner gap-1">
        {['Lari', 'Gym', 'Recovery'].map(t => (
          <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-xs font-bold transition-all ${type === t ? typeConfig[t].active : 'text-[#0F172A] hover:text-[#0F172A]'}`}>
            {t==='Lari' ? <Activity className="w-4 h-4 mr-1.5 hidden sm:block"/> : t==='Gym' ? <Dumbbell className="w-4 h-4 mr-1.5 hidden sm:block"/> : <Moon className="w-4 h-4 mr-1.5 hidden sm:block"/>} {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Tanggal" type="date" value={date} onChange={e=>handleDateChange(e.target.value)} required activeColor={typeConfig[type].border} />
          {type === 'Lari' && <SelectField label="Sesi" value={runCat} onChange={e=>setRunCat(e.target.value)} options={['Easy Run', 'Tempo', 'Interval', 'Long Run', 'Recovery']} activeColor={typeConfig[type].border} />}
          {type === 'Gym' && <SelectField label="Fokus" value={gymCat} onChange={e=>setGymCat(e.target.value)} options={['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body']} activeColor={typeConfig[type].border} />}
        </div>

        {type === 'Gym' && (
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="text-[11px] text-[#64748B] font-medium">
              {latestGymSessionByCategory[gymCat]
                ? `Sesi ${gymCat} terakhir: ${new Date(latestGymSessionByCategory[gymCat].date + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}`
                : `Belum ada histori ${gymCat} sebelumnya`}
            </div>
            {latestGymSessionByCategory[gymCat] && (
              <button
                type="button"
                onClick={loadLastGymSession}
                className="px-3 py-2 rounded-xl bg-[#14B8A6] hover:bg-[#0F172A] text-white text-xs font-black transition-colors shadow-sm"
              >
                Load Last {gymCat} Session
              </button>
            )}
          </div>
        )}

        {type === 'Lari' && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Jarak (km)" type="number" step="0.01" value={dist} onChange={e=>setDist(e.target.value)} placeholder="5.0" required activeColor={typeConfig[type].border} />
              <InputField label="Waktu (mnt)" type="number" value={dur} onChange={e=>setDur(e.target.value)} placeholder="30" required activeColor={typeConfig[type].border} />
              <InputField label="Avg HR (opsional)" type="number" value={hr} onChange={e=>setHr(e.target.value)} placeholder="150" activeColor={typeConfig[type].border} />
              <InputField label="Cadence (ops)" type="number" value={cadence} onChange={e=>setCadence(e.target.value)} placeholder="170" activeColor={typeConfig[type].border} />
            </div>
            {/* Live Pace Preview */}
            {dist && dur && parseFloat(dist) > 0 && parseInt(dur) > 0 && (
              <div className="flex items-center justify-between bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-xl px-4 py-2.5">
                <span className="text-[10px] font-bold text-[#14B8A6] uppercase tracking-wider">⚡ Pace Otomatis</span>
                <span className="font-black text-[#f0d090] text-base">{formatPace(parseInt(dur), parseFloat(dist))}</span>
              </div>
            )}
            <SelectField label="Status Eksekusi" value={planStatus} onChange={e=>setPlanStatus(e.target.value)} options={['Sesuai Plan', 'Terlalu Berat', 'Terlalu Ringan', 'Missed Plan']} activeColor={typeConfig[type].border} />
            <SliderField label="RPE (Kesulitan)" value={runRpe} onChange={e=>setRunRpe(e.target.value)} accentColor="accent-[#14B8A6]" />
          </div>
        )}

        {type === 'Gym' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">

            {/* Session Header */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Fokus Sesi" value={gymCat} onChange={e=>setGymCat(e.target.value)}
                options={['Push','Pull','Legs','Upper','Lower','Full Body']} activeColor="focus:border-[#CBD5E1]" />
            </div>

            {/* Exercise Cards */}
            {gymExercises.map((ex, eIdx) => {
              const exColors = ['fuchsia','pink','purple','violet','rose'];
              const c = exColors[eIdx] || 'fuchsia';
              const totalVol = ex.sets.reduce((a,s)=>a+((parseFloat(s.weight)||0)*(parseInt(s.reps)||0)),0);
              return (
                <div key={eIdx} className={`bg-[#F5F7F9] border border-${c}-500/20 rounded-3xl overflow-hidden`}>
                  {/* Exercise header bar */}
                  <div className={`flex items-center justify-between px-4 py-2.5 bg-${c}-500/10 border-b border-${c}-500/15`}>
                    <span className={`text-[10px] font-black text-${c}-400 uppercase tracking-wider`}>Gerakan {eIdx+1}</span>
                    <div className="flex items-center gap-2">
                      {totalVol > 0 && <span className={`text-[9px] font-bold text-${c}-400/70`}>{totalVol.toLocaleString()} kg</span>}
                      {gymExercises.length > 1 && (
                        <button type="button" onClick={() => removeExercise(eIdx)}
                          className="text-[#64748B] hover:text-[#d07573] transition-colors">
                          <X className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 space-y-2.5">
                    {/* Exercise Name */}
                    <ExerciseField value={ex.exercise} onChange={(val) => updateExName(eIdx, val)} workouts={workouts} activeColor={`focus:border-${c}-500`} category={gymCat} templates={exerciseTemplates[gymCat] || []} onTemplateSelect={(val) => applyTemplateToExercise(eIdx, val)} />

                    {/* Set Rows */}
                    <div className="space-y-1.5">
                      {ex.sets.map((s, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md bg-[#8B5CF6] text-[9px] font-black text-[#0F172A]">
                            S{sIdx+1}
                          </div>
                          <div className="flex-1 relative">
                            <input type="number" step="0.5" placeholder="kg"
                              value={s.weight} onChange={e => updateExSet(eIdx, sIdx, 'weight', e.target.value)}
                              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-2 pr-7 text-[#0F172A] text-sm focus:outline-none focus:border-[#CBD5E1] transition-colors placeholder:text-[#94A3B8]"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#64748B] font-bold">kg</span>
                          </div>
                          <span className="text-[#64748B] text-xs font-bold flex-shrink-0">×</span>
                          <div className="w-14">
                            <input type="number" placeholder="reps"
                              value={s.reps} onChange={e => updateExSet(eIdx, sIdx, 'reps', e.target.value)}
                              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-2 text-[#0F172A] text-sm focus:outline-none focus:border-[#CBD5E1] transition-colors placeholder:text-[#94A3B8]"
                            />
                          </div>
                          {sIdx > 0 ? (
                            <button type="button" onClick={() => removeExSet(eIdx, sIdx)}
                              className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[#64748B] hover:text-[#d07573] transition-colors">
                              <X className="w-3 h-3"/>
                            </button>
                          ) : <div className="w-6 flex-shrink-0"/>}
                        </div>
                      ))}

                      {ex.sets.length < 4 && (
                        <button type="button" onClick={() => addExSet(eIdx)}
                          className="w-full py-1.5 rounded-lg border border-dashed border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]/30 text-[10px] font-bold transition-all">
                          + Set {ex.sets.length + 1}{ex.sets.length === 3 ? ' (opsional)' : ''}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Exercise Button */}
            {gymExercises.length < 10 && (
              <button type="button" onClick={addExercise}
                className="w-full py-3 rounded-3xl border border-dashed border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]/40 text-sm font-bold transition-all flex items-center justify-center gap-2">
                <span className="text-lg leading-none">+</span> Tambah Gerakan {gymExercises.length + 1}
              </button>
            )}

            {/* Session Summary */}
            {gymExercises.some(e => e.exercise && e.sets.some(s => s.weight && s.reps)) && (
              <div className="flex items-center justify-between bg-[#FFFFFF] border border-[#CBD5E1]/20 rounded-xl px-4 py-2.5">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">📦 Total Sesi</span>
                  <span className="text-[10px] text-[#64748B] ml-2">
                    {gymExercises.filter(e=>e.exercise).length} gerakan
                  </span>
                </div>
                <span className="font-black text-[#14B8A6]">
                  {gymExercises.reduce((total, e) =>
                    total + e.sets.reduce((a,s) => a+((parseFloat(s.weight)||0)*(parseInt(s.reps)||0)),0), 0
                  ).toLocaleString()} kg
                </span>
              </div>
            )}

            <SliderField label="RPE Sesi (Kesulitan)" value={gymRpe} onChange={e=>setGymRpe(e.target.value)} accentColor="accent-[#8B5CF6]" />
          </div>
        )}
        {type === 'Recovery' && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Tidur (Jam)" type="number" step="0.5" value={sleep} onChange={e=>setSleep(e.target.value)} placeholder="7.5" required activeColor={typeConfig[type].border} />
              <InputField label="Berat (kg)" type="number" step="0.1" value={bodyWeight} onChange={e=>setBodyWeight(e.target.value)} placeholder="60.5" activeColor={typeConfig[type].border} />
            </div>
            <SliderField label="Rasa Pegal (DOMS)" value={soreness} onChange={e=>setSoreness(e.target.value)} invertColors accentColor="accent-[#14B8A6]" />
            <SliderField label="Tingkat Lelah" value={fatigue} onChange={e=>setFatigue(e.target.value)} invertColors accentColor="accent-[#14B8A6]" />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">Catatan Sesi</label>
          <textarea 
            rows="2" value={notes} onChange={e=>setNotes(e.target.value)} placeholder={type === 'Gym' ? "Contoh: Form sudah bagus..." : "Catatan kondisi..."}
            className={`w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-4 py-3 text-[#0F172A] text-sm focus:outline-none transition-colors resize-none ${typeConfig[type].border}`}
          ></textarea>
        </div>

        <button type="submit" className={`w-full py-4 rounded-xl font-bold text-[#0F172A] shadow-xl transition-transform active:scale-95 ${typeConfig[type].submit}`}>
          Simpan ke Cloud ☁️
        </button>
      </form>
    </div>
  );
}

// --- TAB 3: HISTORY ---
function ExportModal({ workouts, weeklyPlan, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
  const [from, setFrom] = React.useState(weekAgo);
  const [to, setTo]     = React.useState(today);
  const [aiStatus, setAiStatus] = React.useState('idle'); // 'idle' | 'generating' | 'copied' | 'error'

  const handleGenerateAIReview = async () => {
    setAiStatus('generating');
    try {
      // Build weightHistory from Recovery workouts
      const weightHistory = workouts
        .filter(w => w.type === 'Recovery' && w.weight)
        .map(w => ({ date: w.date, weight: w.weight }));

      // Build athleteBrain from available data (goals, limitations, preferences, experience, notes)
      const athleteBrain = {};

      const result = runTrainingPipeline({
        athleteBrain,
        workouts,
        weightHistory,
        weeklyPlan,
        currentDate: new Date(),
      });

      const fullPrompt = result.aiRequest.systemPrompt + '\n\n' + result.aiRequest.userPrompt;
      await navigator.clipboard.writeText(fullPrompt);
      setAiStatus('copied');
      setTimeout(() => setAiStatus('idle'), 3000);
    } catch (err) {
      console.error('AI Review generation failed:', err);
      setAiStatus('error');
      setTimeout(() => setAiStatus('idle'), 3000);
    }
  };

  const filtered = workouts.filter(w => w.date >= from && w.date <= to)
    .sort((a,b) => a.date.localeCompare(b.date));
  const runs = filtered.filter(w => w.type === 'Lari');
  const gyms = filtered.filter(w => w.type === 'Gym');

  const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  const fmtPace = (p) => {
    if (!p || p <= 0) return '-';
    const min = Math.floor(p), sec = Math.round((p - min) * 60);
    return `${min}:${sec.toString().padStart(2,'0')} /km`;
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=960,height=700');
    const runRows = runs.map(w => `<tr>
      <td>${fmtDate(w.date)}</td><td>${w.category||'-'}</td>
      <td>${w.distance||'-'} km</td><td>${w.duration||'-'} mnt</td>
      <td>${fmtPace(w.pace)}</td><td>${w.hr||'-'}</td>
      <td>${w.cadence||'-'}</td><td>${w.rpe||'-'}</td>
      <td>${(w.notes||'-').substring(0,60)}</td></tr>`).join('');

    const gymRows = gyms.flatMap(w => (w.exercises||[]).map((ex,ei) => `<tr>
      ${ei===0?`<td rowspan="${(w.exercises||[]).length}">${fmtDate(w.date)}</td>`:''}
      ${ei===0?`<td rowspan="${(w.exercises||[]).length}">${w.category||'-'}</td>`:''}
      <td>${ex.exercise||'-'}</td>
      <td>${(ex.sets||[]).map(s=>`${s.weight}kg×${s.reps}`).join(', ')}</td>
      <td>${(ex.sets||[]).reduce((a,s)=>a+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0).toFixed(0)} kg</td>
      ${ei===0?`<td rowspan="${(w.exercises||[]).length}">${w.rpe||'-'}</td>`:''}
      ${ei===0?`<td rowspan="${(w.exercises||[]).length}">${(w.notes||'-').substring(0,60)}</td>`:''}
    </tr>`)).join('');

    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Workout Report ${from} – ${to}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#1a1a2e;background:#fff;padding:28px 32px}
h1{font-size:22px;font-weight:800;color:#1a1a2e;margin-bottom:3px}
.sub{font-size:11px;color:#666;margin-bottom:20px}
.summary{display:flex;gap:12px;margin-bottom:22px;flex-wrap:wrap}
.sbox{background:#f4f6ff;border:1px solid #dde2f5;border-radius:8px;padding:8px 16px;min-width:80px}
.sval{font-size:22px;font-weight:800;color:#1a1a2e;line-height:1.1}
.slbl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px}
h2{font-size:13px;font-weight:700;margin:18px 0 6px;padding-bottom:4px;border-bottom:2px solid #e8e8f0}
table{width:100%;border-collapse:collapse;font-size:10.5px}
th{background:#1a1a2e;color:#fff;padding:6px 7px;text-align:left;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
td{padding:5px 7px;border-bottom:1px solid #eee;vertical-align:top}
tr:nth-child(even) td{background:#f8f8fc}
.empty{color:#999;font-style:italic;padding:10px 0;font-size:11px}
.footer{margin-top:28px;padding-top:10px;border-top:1px solid #eee;font-size:9px;color:#aaa}
@media print{body{padding:12px 16px}button{display:none!important}}
</style></head><body>
<h1>🏃 Workout Report</h1>
<p class="sub">Periode: <strong>${fmtDate(from)}</strong> — <strong>${fmtDate(to)}</strong> &nbsp;|&nbsp; Digenerate: ${new Date().toLocaleString('id-ID')}</p>
<div class="summary">
  <div class="sbox"><div class="sval">${runs.length}</div><div class="slbl">Sesi Lari</div></div>
  <div class="sbox"><div class="sval">${runs.reduce((a,w)=>a+(parseFloat(w.distance)||0),0).toFixed(1)} km</div><div class="slbl">Total Jarak</div></div>
  <div class="sbox"><div class="sval">${runs.reduce((a,w)=>a+(parseInt(w.duration)||0),0)} mnt</div><div class="slbl">Total Waktu</div></div>
  <div class="sbox"><div class="sval">${gyms.length}</div><div class="slbl">Sesi Gym</div></div>
  <div class="sbox"><div class="sval">${gyms.filter(w=>w.category==='Push').length}P / ${gyms.filter(w=>w.category==='Pull').length}Pl / ${gyms.filter(w=>w.category==='Legs').length}L</div><div class="slbl">Push/Pull/Legs</div></div>
</div>

<h2>🏃 Sesi Lari</h2>
${runs.length===0?'<p class="empty">Tidak ada sesi lari pada periode ini.</p>':`
<table><thead><tr>
  <th>Tanggal</th><th>Tipe</th><th>Jarak</th><th>Durasi</th>
  <th>Pace</th><th>HR</th><th>Kadens</th><th>RPE</th><th>Catatan</th>
</tr></thead><tbody>${runRows}</tbody></table>`}

<h2>🏋️ Sesi Gym</h2>
${gyms.length===0?'<p class="empty">Tidak ada sesi gym pada periode ini.</p>':`
<table><thead><tr>
  <th>Tanggal</th><th>Kategori</th><th>Gerakan</th>
  <th>Set × Reps</th><th>Volume (kg)</th><th>RPE</th><th>Catatan</th>
</tr></thead><tbody>${gymRows}</tbody></table>`}

<p class="footer">HybridTrack Export • ${new Date().toLocaleString('id-ID')}</p>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="bg-[#0d2137] border border-[#CBD5E1] rounded-3xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
            <FileDown className="w-5 h-5 text-[#14B8A6]"/>
            Export Laporan PDF
          </h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A] p-1 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wide mb-1.5">Dari</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#14B8A6] transition-colors"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wide mb-1.5">Sampai</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#14B8A6] transition-colors"/>
          </div>
        </div>

        <div className="flex gap-2">
          {[{label:'7 Hari',days:7},{label:'14 Hari',days:14},{label:'30 Hari',days:30}].map(({label,days}) => (
            <button key={days} onClick={() => {
              setTo(new Date().toISOString().split('T')[0]);
              setFrom(new Date(Date.now()-days*86400000).toISOString().split('T')[0]);
            }} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#FFFFFF] text-[#0F172A] hover:bg-[#DCE3EA] hover:text-[#0F172A] transition-all">
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex gap-5">
            <span><span className="font-black text-[#c76360] text-sm">{runs.length}</span> <span className="text-[10px] text-[#64748B]">lari</span></span>
            <span><span className="font-black text-[#14B8A6] text-sm">{gyms.length}</span> <span className="text-[10px] text-[#64748B]">gym</span></span>
            <span><span className="font-black text-[#0F172A] text-sm">{filtered.length}</span> <span className="text-[10px] text-[#64748B]">total sesi</span></span>
          </div>
          <span className="text-[9px] text-[#64748B] italic">ditemukan</span>
        </div>

        <button onClick={handlePrint} disabled={filtered.length === 0}
          className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-[#14B8A6] to-[#99F6E4] text-[#05131c] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center justify-center gap-2">
          <FileDown className="w-4 h-4"/>
          Export PDF — {filtered.length} sesi
        </button>

        <button onClick={handleGenerateAIReview} disabled={aiStatus === 'generating'}
          className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all flex items-center justify-center gap-2">
          <BrainCircuit className="w-4 h-4"/>
          {aiStatus === 'generating' ? 'Generating...' : aiStatus === 'copied' ? '✅ Copied!' : aiStatus === 'error' ? '❌ Failed' : '🤖 Generate AI Review'}
        </button>
      </div>
    </div>
  );
}


function ImportTrainingBlockModal({ onClose, user, onImportSuccess }) {
  const [jsonText, setJsonText] = React.useState('');
  const [validationResult, setValidationResult] = React.useState(null); // null | { valid, errors, warnings }
  const [normalizedBlock, setNormalizedBlock] = React.useState(null);
  const [importStatus, setImportStatus] = React.useState('idle'); // 'idle' | 'ready'
  const [parseError, setParseError] = React.useState('');
  const [importError, setImportError] = React.useState('');

  const handleValidate = () => {
    setParseError('');
    setValidationResult(null);
    setNormalizedBlock(null);
    setImportStatus('idle');
    setImportError('');

    // 1. Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch (e) {
      setParseError('Invalid JSON format.');
      return;
    }

    // 2. Validate
    const result = validateTrainingBlock(parsed);
    setValidationResult(result);

    if (result.valid) {
      // 3. Normalize
      const normalized = normalizeTrainingBlock(parsed);
      setNormalizedBlock(normalized);
    }
  };

  const handleImport = async () => {
    if (!normalizedBlock || !user) return;
    setImportError('');
    try {
      const trainingBlocksRef = collection(db, 'users', user.uid, 'trainingBlocks');
      const docRef = doc(trainingBlocksRef); // auto ID
      await setDoc(docRef, {
        ...normalizedBlock,
        importedAt: serverTimestamp(),
        status: 'active',
        importVersion: 1,
        source: 'AI',
      });
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to import Training Block:', err);
      setImportError('Failed to import Training Block.');
    }
  };

  const block = normalizedBlock?.trainingBlock;
  const sessionCount = block?.sessions?.length || 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
      <div className="bg-[#0d2137] border border-[#CBD5E1] rounded-3xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#14B8A6]"/>
            Import Training Block
          </h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A] p-1 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <textarea
          value={jsonText}
          onChange={e => { setJsonText(e.target.value); setParseError(''); setValidationResult(null); setNormalizedBlock(null); setImportStatus('idle'); }}
          rows={10}
          placeholder="Paste the JSON generated by DeepSeek..."
          className="w-full bg-[#fbfcfe] border border-[#CBD5E1] rounded-3xl px-3 py-2.5 text-xs text-[#0F172A] font-mono focus:border-[#14B8A6] outline-none resize-none leading-relaxed"
        />

        {/* Parse error */}
        {parseError && (
          <p className="text-xs text-[#d92d20] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0"/> {parseError}
          </p>
        )}

        {/* Validation errors */}
        {validationResult && !validationResult.valid && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl px-3 py-2 space-y-1">
            <p className="text-[10px] font-bold text-[#991B1B] uppercase tracking-wider">Validation Errors</p>
            {validationResult.errors.map((err, i) => (
              <p key={i} className="text-[11px] text-[#991B1B] flex items-start gap-1.5">
                <span className="text-[#991B1B] mt-0.5">•</span> {err}
              </p>
            ))}
          </div>
        )}

        {/* Validation warnings */}
        {validationResult && validationResult.warnings.length > 0 && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl px-3 py-2 space-y-1">
            <p className="text-[10px] font-bold text-[#92400E] uppercase tracking-wider">Warnings</p>
            {validationResult.warnings.map((warn, i) => (
              <p key={i} className="text-[11px] text-[#92400E] flex items-start gap-1.5">
                <span className="text-[#92400E] mt-0.5">•</span> {warn}
              </p>
            ))}
          </div>
        )}

        {/* Valid preview */}
        {validationResult && validationResult.valid && normalizedBlock && (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#14B8A6]"/>
              <span className="text-xs font-bold text-[#065F46]">Training Block Valid</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#64748B]">Name:</span>{' '}
                <span className="font-bold text-[#0F172A]">{block?.name || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B]">Goal:</span>{' '}
                <span className="font-bold text-[#0F172A]">{block?.goal || '—'}</span>
              </div>
              <div>
                <span className="text-[#64748B]">Sessions:</span>{' '}
                <span className="font-bold text-[#0F172A]">{sessionCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Import ready */}
        {importStatus === 'ready' && (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#14B8A6]"/>
            <span className="text-xs font-bold text-[#065F46]">Ready for import</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 border border-[#CBD5E1] rounded-3xl text-[#0F172A] text-sm font-bold hover:text-[#0F172A] hover:bg-[#FFFFFF] transition-colors">
            Cancel
          </button>
          <button onClick={handleValidate} disabled={!jsonText.trim()}
            className="flex-1 py-2 bg-[#0F172A] text-[#0F172A] font-black text-sm rounded-3xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
            Validate
          </button>
          <button onClick={handleImport} disabled={!normalizedBlock || importStatus === 'ready'}
            className="flex-1 py-2 bg-gradient-to-r from-[#14B8A6] to-[#99F6E4] text-[#05131c] font-black text-sm rounded-3xl disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all">
            Import
          </button>
        </div>
      </div>
    </div>
  );
}


function History({ workouts, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState({});
  const [showExport, setShowExport] = React.useState(false);
  const [showImportBlock, setShowImportBlock] = React.useState(false);
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const sorted = [...workouts].sort((a,b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (b.id || 0) - (a.id || 0);
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-[#64748B] animate-in fade-in">
        <List className="w-12 h-12 mx-auto mb-3 opacity-20"/>
        <p className="font-bold text-[#64748B]">Belum ada log</p>
        <p className="text-xs mt-1">Mulai catat sesi pertamamu!</p>
      </div>
    );
  }

  const typeStyle = {
    Lari:     { icon: Activity, gradient: 'from-[#14B8A6]/20 to-[#14B8A6]/0', text: 'text-[#14B8A6]', badge: 'bg-[#14B8A6]/20 text-[#f0d090]', border: 'border-[#14B8A6]/20' },
    Gym:      { icon: Dumbbell, gradient: 'from-[#8B5CF6]/20 to-[#8B5CF6]/0', text: 'text-[#64748B]', badge: 'bg-[#FFFFFF] text-[#14B8A6]', border: 'border-[#CBD5E1]/20' },
    Recovery: { icon: Moon, gradient: 'from-[#14B8A6]/20 to-[#22a898]/0', text: 'text-[#14B8A6]', badge: 'bg-[#14B8A6]/20 text-[#5ae0c0]', border: 'border-[#14B8A6]/20' },
  };

  // Group by date
  const grouped = sorted.reduce((acc, w) => {
    const key = w.date; if (!acc[key]) acc[key] = []; acc[key].push(w); return acc;
  }, {});
  const groupedDates = Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a));
  const formatDateHeader = (ds) => {
    const d = new Date(ds + 'T12:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    const t = new Date(ds + 'T00:00:00');
    if (t.toDateString() === today.toDateString()) return 'Hari Ini';
    if (t.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  };
  const dayIcon = (ds) => {
    const sessions = grouped[ds] || [];
    const types = sessions.map(s => s.type);
    if (types.includes('Gym') && types.includes('Lari')) return '🏋️🏃';
    if (types.includes('Gym')) return '🏋️';
    if (types.includes('Lari')) return '🏃';
    return '😴';
  };

  return (
    <div className="space-y-1 animate-in fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center">
          <List className="w-5 h-5 mr-2 text-[#14B8A6]"/> Riwayat Sesi
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportBlock(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-[#ECFDF5] text-[#14B8A6] hover:bg-[#99F6E4] hover:text-[#0F172A] transition-all border border-[#CBD5E1]/40">
            <Plus className="w-3.5 h-3.5"/>
            Import Block
          </button>
          <button onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-[#FFFFFF] text-[#0F172A] hover:bg-[#99F6E4]/20 hover:text-[#14B8A6] transition-all border border-[#CBD5E1]/40">
            <FileDown className="w-3.5 h-3.5"/>
            Export PDF
          </button>
        </div>
      </div>
      {showExport && <ExportModal workouts={workouts} weeklyPlan={weeklyPlan} onClose={() => setShowExport(false)}/>}
      {showImportBlock && <ImportTrainingBlockModal user={user} onImportSuccess={() => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); }} onClose={() => setShowImportBlock(false)}/>}
      {groupedDates.map(dateKey => (
        <div key={dateKey} className="mb-2">
          {/* Date separator */}
          <div className="flex items-center gap-2 px-1 py-2 mb-1.5">
            <span className="text-base">{dayIcon(dateKey)}</span>
            <span className="text-xs font-black text-[#14B8A6] uppercase tracking-wider">{formatDateHeader(dateKey)}</span>
            <div className="flex-1 h-px bg-[#8B5CF6]"/>
            <span className="text-[10px] text-[#64748B] font-medium">{grouped[dateKey].length} sesi</span>
          </div>
          <div className="space-y-2 pl-2">
          {grouped[dateKey].map(w => {
        const style = typeStyle[w.type] || typeStyle.Recovery;
        const Icon = style.icon;
        const isGymSession = w.type === 'Gym' && w.exercises && w.exercises.length > 0;
        const isOpen = expanded[w.id];

        return (
          <div key={w.id} className={`bg-white border ${style.border} rounded-3xl overflow-hidden`}>
            {/* Card header row */}
            <div className={`flex items-center gap-3 p-3.5 bg-gradient-to-r ${style.gradient}`}>
              <div className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl ${style.badge}`}>
                <Icon className="w-4 h-4"/>
              </div>

              <div className="flex-1 min-w-0">
                {/* Title */}
                <p className="font-bold text-[#0F172A] text-sm truncate">
                  {isGymSession
                    ? `${w.category || 'Gym'} Session`
                    : w.type === 'Gym' ? (w.exercise || 'Gym')
                    : w.type === 'Lari' ? (w.category || 'Lari')
                    : 'Recovery'}
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {w.type !== 'Recovery' ? `RPE: ${w.rpe}` : `Fatigue: ${w.fatigue}`}
                </p>
                {/* HR Zone badge for runs */}
                {w.type === 'Lari' && w.hr && (() => { const z = getHRZone(w.hr); return z ? <span className={`inline-flex items-center text-[8px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 ${z.color}`}>{z.zone} · {z.label} · {w.hr}bpm</span> : null; })()}
              </div>

              {/* Right side: metric + actions */}
              <div className="flex items-center gap-1.5">
                {/* Metric */}
                <div className="text-right min-w-[52px]">
                  {w.type === 'Lari' && <><p className={`font-bold text-sm ${style.text}`}>{w.distance}km</p><p className="text-[10px] text-[#64748B]">{formatPace(w.duration, w.distance)}</p></>}
                  {w.type === 'Gym' && (() => { const d = gymDisplayInfo(w); return <><p className={`font-bold text-sm ${style.text}`}>{d.main}</p><p className="text-[10px] text-[#64748B]">{d.sub}</p></>; })()}
                  {w.type === 'Recovery' && <><p className={`font-bold text-sm ${style.text}`}>{w.sleep}j</p><p className="text-[10px] text-[#64748B]">Tidur</p></>}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1 ml-1">
                  {isGymSession && (
                    <button onClick={() => toggleExpand(w.id)} className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#FFFFFF] rounded-lg transition-colors">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
                    </button>
                  )}
                  {!isGymSession && (
                    <button onClick={() => onEdit(w)} className="p-1.5 text-[#64748B] hover:text-[#14B8A6] hover:bg-[#14B8A6]/10 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5"/>
                    </button>
                  )}
                  <button onClick={() => onDelete(w.id)} className="p-1.5 text-[#64748B] hover:text-[#d07573] hover:bg-[#c76360]/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded gym session detail */}
            {isGymSession && isOpen && (
              <div className="border-t border-[#CBD5E1]/10 divide-y divide-[#DCE3EA]">
                {w.exercises.map((ex, eIdx) => {
                  const bestW = ex.sets && ex.sets.length > 0 ? Math.max(...ex.sets.map(s => parseFloat(s.weight)||0)) : 0;
                  return (
                    <div key={eIdx} className="px-4 py-2.5 flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded bg-[#FFFFFF] text-[9px] font-black text-[#64748B] mt-0.5">{eIdx+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">{ex.exercise}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(ex.sets||[]).map((s, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-white border border-[#CBD5E1] text-[#0F172A] px-2.5 py-1 rounded-full font-bold shadow-sm">
                              S{sIdx+1}: {s.weight}kg×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                      {bestW > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black text-[#14B8A6]">{bestW}kg</p>
                          <p className="text-[9px] text-[#64748B]">best</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Total volume for session */}
                <div className="px-4 py-2 flex justify-between bg-[#ECFDF5]">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase">Total Volume Sesi</span>
                  <span className="text-[10px] font-black text-[#64748B]">{gymVolume(w).toLocaleString()} kg</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
          </div>{/* close pl-2 */}
        </div>
      ))}
    </div>
  );
}

// --- TAB 4: PROGRESSION TRACKER ---

// Helper: get last N weeks of aggregated data
function getWeeklyRunData(workouts, weeks = 7) {
  const now = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const wEnd = new Date(now);
    wEnd.setDate(now.getDate() - (weeks - 1 - i) * 7);
    const wStart = new Date(wEnd);
    wStart.setDate(wEnd.getDate() - 6);
    const filtered = workouts.filter(w => {
      if (w.type !== 'Lari' || !w.date) return false;
      const d = new Date(w.date);
      return d >= wStart && d <= wEnd;
    });
    const km = parseFloat(filtered.reduce((a, c) => a + (c.distance || 0), 0).toFixed(1));
    const sessions = filtered.length;
    const avgPace = sessions > 0
      ? filtered.filter(w => w.pace).reduce((a, c) => a + c.pace, 0) / filtered.filter(w => w.pace).length
      : null;
    // Week label: "30/4" style from wEnd date
    const label = `${wEnd.getDate()}/${wEnd.getMonth() + 1}`;
    return { label, km, sessions, avgPace };
  });
}

function getWeeklyGymData(workouts, weeks = 7) {
  const now = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const wEnd = new Date(now);
    wEnd.setDate(now.getDate() - (weeks - 1 - i) * 7);
    const wStart = new Date(wEnd);
    wStart.setDate(wEnd.getDate() - 6);
    const filtered = workouts.filter(w => {
      if (w.type !== 'Gym' || !w.date) return false;
      const d = new Date(w.date);
      return d >= wStart && d <= wEnd;
    });
    const vol = filtered.reduce((a, c) => a + gymVolume(c), 0);
    const sessions = filtered.length;
    const label = `${wEnd.getDate()}/${wEnd.getMonth() + 1}`;
    return { label, vol, sessions };
  });
}

// Pure CSS vertical bar chart component
function BarChart({ bars, color, unit, height = 80, formatVal }) {
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: `${height + 32}px` }}>
      {bars.map((bar, i) => {
        const pct = maxVal > 0 ? (bar.value / maxVal) * 100 : 0;
        const barH = Math.max(pct * height / 100, bar.value > 0 ? 4 : 0);
        const isLast = i === bars.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: `${height + 32}px` }}>
            {/* Value label on top */}
            <span className={`text-[9px] font-bold leading-none ${bar.value > 0 ? (isLast ? 'text-[#0F172A]' : 'text-[#0F172A]') : 'text-transparent'}`}>
              {bar.value > 0 ? (formatVal ? formatVal(bar.value) : bar.value) : '·'}
            </span>
            {/* Bar */}
            <div className="w-full flex items-end" style={{ height: `${height}px` }}>
              <div
                className={`w-full rounded-t-md transition-all duration-700 ${isLast ? color.active : color.base}`}
                style={{ height: `${barH}px` }}
              />
            </div>
            {/* Date label */}
            <span className={`text-[8px] font-bold ${isLast ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}


function AllTimeStats({ workouts }) {
  const totalRun = workouts
    .filter(w => w.type === 'Lari')
    .reduce((a, w) => a + (parseFloat(w.distance) || 0), 0);

  const gymSessions = workouts.filter(w => w.type === 'Gym');

  const gymByCategory = { Push: 0, Pull: 0, Legs: 0 };
  gymSessions.forEach(w => {
    const cat = w.category;
    if (cat === 'Push') gymByCategory.Push++;
    else if (cat === 'Pull') gymByCategory.Pull++;
    else if (cat === 'Legs') gymByCategory.Legs++;
  });
  const totalGym = gymSessions.length;

  const CAT_STYLE = {
    Push: { color: '#8B5CF6', bg: 'bg-[#FFFFFF]', border: 'border-[#CBD5E1]/40', label: 'Push' },
    Pull: { color: '#14B8A6', bg: 'bg-[#14B8A6]/15', border: 'border-[#14B8A6]/40', label: 'Pull' },
    Legs: { color: '#99F6E4', bg: 'bg-[#99F6E4]/15', border: 'border-[#CBD5E1]', label: 'Legs' },
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Total Lari */}
      <div className="bg-white border border-[#c76360]/30 rounded-3xl p-3 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[#c76360] mb-1">
          <Activity className="w-3.5 h-3.5 flex-shrink-0"/>
          <span className="text-[9px] font-bold uppercase tracking-wider">Total Lari</span>
        </div>
        <p className="text-2xl font-black text-[#0F172A] leading-none">
          {totalRun % 1 === 0 ? totalRun : totalRun.toFixed(1)}
          <span className="text-xs font-semibold text-[#c76360] ml-1">km</span>
        </p>
        <p className="text-[9px] text-[#64748B] mt-0.5">all time</p>
      </div>

      {/* Total Gym */}
      <div className="bg-white border border-[#CBD5E1]/40 rounded-3xl p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[#0F172A] mb-0.5">
          <Dumbbell className="w-3.5 h-3.5 flex-shrink-0"/>
          <span className="text-[9px] font-bold uppercase tracking-wider">Total Gym</span>
          <span className="ml-auto text-[9px] font-black text-[#0F172A]">{totalGym} sesi</span>
        </div>
        <div className="flex gap-1.5">
          {Object.entries(CAT_STYLE).map(([cat, s]) => (
            <div key={cat} className={`flex-1 ${s.bg} border ${s.border} rounded-lg px-1.5 py-1 text-center`}>
              <p className="text-[11px] font-black leading-none" style={{color: s.color}}>
                {gymByCategory[cat]}
              </p>
              <p className="text-[8px] font-bold text-[#64748B] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function ProgressionTracker({ workouts }) {
  const gyms = workouts.filter(w => w.type === 'Gym');
  const runs = workouts.filter(w => w.type === 'Lari');

  const weeklyRun = useMemo(() => getWeeklyRunData(workouts, 7), [workouts]);
  const weeklyGym = useMemo(() => getWeeklyGymData(workouts, 7), [workouts]);
  const runBars  = weeklyRun.map(w => ({ label: w.label, value: w.km }));
  const gymBars  = weeklyGym.map(w => ({ label: w.label, value: w.vol }));

  const prs = useMemo(() => getGymPRs(workouts), [workouts]);
  const exerciseOptions = useMemo(() => prs.map(p => p.exercise), [prs]);
  const [selectedExercise, setSelectedExercise] = useState('');

  useEffect(() => {
    if (!selectedExercise && exerciseOptions.length > 0) {
      setSelectedExercise(exerciseOptions[0]);
    }
  }, [selectedExercise, exerciseOptions]);

  const selectedExerciseData = useMemo(
    () => getExercisePerformance(workouts, selectedExercise),
    [workouts, selectedExercise]
  );

  const maxDistance = runs.length > 0 ? Math.max(...runs.map(r => r.distance || 0)) : 0;
  const allPaces = runs.filter(r => r.pace && r.pace > 0).map(r => r.pace);
  const bestPace = allPaces.length > 0 ? Math.min(...allPaces) : null;
  const totalRunSessions  = runs.length;
  const totalGymSessions  = gyms.length;
  const totalKm           = runs.reduce((a, c) => a + (c.distance || 0), 0).toFixed(1);
  const totalGymVol       = gyms.reduce((a, c) => a + gymVolume(c), 0);

  const selectedPR = prs.find(p => p.exercise === selectedExercise) || null;

  return (
    <div className="space-y-5 animate-in fade-in">
      <h2 className="text-lg font-bold text-[#0F172A] flex items-center">
        <Award className="w-5 h-5 mr-2 text-[#14B8A6]"/> Progres Analisis
      </h2>

      <AllTimeStats workouts={workouts} />

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-white to-[#FFFFFF] border border-[#CBD5E1] p-3 rounded-3xl shadow-sm">
          <h3 className="text-[8px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">🏋️ Total PR</h3>
          <p className="text-xl font-black text-[#0F172A]">{prs.length}<span className="text-xs font-medium text-[#64748B] ml-1">exercise</span></p>
        </div>
        <div className="bg-gradient-to-br from-white to-[#FFFFFF] border border-[#CBD5E1] p-3 rounded-3xl shadow-sm">
          <h3 className="text-[8px] font-bold text-[#14B8A6] uppercase tracking-wider mb-1.5">🏃 Terjauh</h3>
          <p className="text-xl font-black text-[#0F172A]">{maxDistance > 0 ? maxDistance : '—'}<span className="text-xs font-medium text-[#64748B] ml-1">km</span></p>
        </div>
        <div className="bg-gradient-to-br from-white to-[#FFFFFF] border border-[#CBD5E1] p-3 rounded-3xl shadow-sm">
          <h3 className="text-[8px] font-bold text-[#14B8A6] uppercase tracking-wider mb-1.5">⚡ Best Pace</h3>
          <p className="text-lg font-black text-[#0F172A] leading-tight">{bestPace ? formatPace(bestPace * 1, 1) : '—'}</p>
        </div>
      </div>

      <div className="bg-white border border-[#CBD5E1] rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Personal Records</h3>
            <p className="text-[11px] text-[#64748B]">PR dihitung dari set terbaik per exercise berdasarkan beban lalu reps.</p>
          </div>
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{prs.length} exercises tracked</div>
        </div>

        {prs.length === 0 ? (
          <div className="text-sm text-[#64748B] bg-[#F5F7F9] rounded-2xl px-4 py-3 border border-[#DCE3EA]">
            Belum ada data gym yang cukup untuk menghitung PR.
          </div>
        ) : (
          <div className="space-y-2">
            {prs.map((pr, idx) => (
              <div key={pr.exercise} className="flex items-center justify-between gap-3 bg-[#F5F7F9] border border-[#DCE3EA] rounded-2xl px-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-5 h-5 rounded-md bg-[#14B8A6]/10 text-[#14B8A6] text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                    <p className="text-sm font-bold text-[#0F172A] truncate">{pr.exercise}</p>
                  </div>
                  <p className="text-[11px] text-[#64748B]">{formatDateID(pr.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-[#0F172A]">{pr.weight}kg <span className="text-xs text-[#64748B]">× {pr.reps}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#CBD5E1] rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Exercise Performance</h3>
            <p className="text-[11px] text-[#64748B]">Lihat perkembangan set terbaik untuk satu exercise dari waktu ke waktu.</p>
          </div>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-2 text-sm text-[#0F172A] font-bold focus:outline-none focus:border-[#14B8A6]"
          >
            {exerciseOptions.length === 0 ? <option value="">No exercise</option> : exerciseOptions.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        {selectedPR && (
          <div className="flex items-center justify-between bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl px-3 py-2.5">
            <span className="text-[11px] font-bold text-[#14B8A6] uppercase tracking-wider">Current PR</span>
            <span className="text-sm font-black text-[#0F172A]">{selectedPR.weight}kg × {selectedPR.reps}</span>
          </div>
        )}

        {selectedExerciseData.length === 0 ? (
          <div className="text-sm text-[#64748B] bg-[#F5F7F9] rounded-2xl px-4 py-3 border border-[#DCE3EA]">
            Belum ada histori untuk exercise ini.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedExerciseData.map((item, idx) => {
              const isPR = selectedPR && item.weight === selectedPR.weight && item.reps === selectedPR.reps && item.date === selectedPR.date;
              return (
                <div key={`${item.date}-${idx}`} className="flex items-center justify-between gap-3 bg-[#F5F7F9] border border-[#DCE3EA] rounded-2xl px-3 py-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{item.label}</p>
                    <p className="text-[11px] text-[#64748B]">Volume set: {item.volume} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#0F172A]">{item.weight}kg × {item.reps}</p>
                    {isPR && <p className="text-[10px] font-bold text-[#14B8A6] uppercase tracking-wider">PR</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#CBD5E1] p-5 rounded-3xl">
        <h3 className="text-sm font-bold text-[#64748B] mb-4 flex items-center">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#99F6E4] to-[#5a90b8] mr-2 inline-block"></span>
          Total Kumulatif Semua Waktu
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F7F9] rounded-xl p-3 border border-[#CBD5E1]">
            <p className="text-[9px] text-[#64748B] uppercase font-bold mb-1">Sesi Lari</p>
            <p className="text-xl font-black text-[#14B8A6]">{totalRunSessions}<span className="text-xs font-medium text-[#64748B] ml-1">sesi</span></p>
          </div>
          <div className="bg-[#F5F7F9] rounded-xl p-3 border border-[#CBD5E1]">
            <p className="text-[9px] text-[#64748B] uppercase font-bold mb-1">Sesi Gym</p>
            <p className="text-xl font-black text-[#64748B]">{totalGymSessions}<span className="text-xs font-medium text-[#64748B] ml-1">sesi</span></p>
          </div>
          <div className="bg-[#F5F7F9] rounded-xl p-3 border border-[#CBD5E1]">
            <p className="text-[9px] text-[#64748B] uppercase font-bold mb-1">Total Jarak</p>
            <p className="text-xl font-black text-[#f0d090]">{totalKm}<span className="text-xs font-medium text-[#64748B] ml-1">km</span></p>
          </div>
          <div className="bg-[#F5F7F9] rounded-xl p-3 border border-[#CBD5E1]">
            <p className="text-[9px] text-[#64748B] uppercase font-bold mb-1">Total Volume</p>
            <p className="text-xl font-black text-[#14B8A6]">{totalGymVol.toLocaleString()}<span className="text-xs font-medium text-[#64748B] ml-1">kg</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MODAL COACH INSIGHT ---
function formatPace(durationMin, distanceKm) {
  if (!durationMin || !distanceKm || distanceKm === 0) return '--:--';
  const paceDecimal = durationMin / distanceKm;
  const paceMin = Math.floor(paceDecimal);
  const paceSec = Math.round((paceDecimal - paceMin) * 60);
  return `${paceMin}:${paceSec.toString().padStart(2, '0')} /km`;
}

function getHRZone(hr) {
  if (!hr) return null;
  const zones = [
    { max: 114, zone: 'Z1', label: 'Very Light', color: 'text-[#0F172A] bg-[#FFFFFF] border-[#CBD5E1]/20' },
    { max: 134, zone: 'Z2', label: 'Easy',       color: 'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/20' },
    { max: 154, zone: 'Z3', label: 'Moderate',   color: 'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/20' },
    { max: 174, zone: 'Z4', label: 'Hard',        color: 'text-[#14B8A6] bg-[#FFFFFF] border-[#99F6E4]/20' },
    { max: Infinity, zone: 'Z5', label: 'Max',   color: 'text-[#d07573] bg-[#c76360]/10 border-[#c76360]/20' },
  ];
  return zones.find(z => hr <= z.max) || null;
}


// --- GYM HELPERS (fully backward-compatible: old single, v2 sets[], v3 exercises[]) ---
function gymVolume(w) {
  if (w.exercises) {
    return w.exercises.reduce((total, ex) =>
      total + (ex.sets || []).reduce((a, s) => a + ((parseFloat(s.weight) * parseInt(s.reps)) || 0), 0), 0);
  }
  if (Array.isArray(w.sets)) {
    return w.sets.reduce((a, s) => a + ((parseFloat(s.weight) * parseInt(s.reps)) || 0), 0);
  }
  return ((w.weight * w.sets * w.reps) || 0);
}

function gymDisplayInfo(w) {
  if (w.exercises && w.exercises.length > 0) {
    return { main: `${w.exercises.length} gerakan`, sub: `${w.category || 'Gym'} session` };
  }
  if (Array.isArray(w.sets)) {
    const validSets = w.sets.filter(s => s.weight && s.reps);
    if (validSets.length === 0) return { main: '—', sub: '0 sets' };
    const weights = validSets.map(s => parseFloat(s.weight));
    const minW = Math.min(...weights), maxW = Math.max(...weights);
    return { main: minW === maxW ? `${minW} kg` : `${minW}–${maxW} kg`, sub: `${validSets.length} set` };
  }
  return { main: `${w.weight} kg`, sub: `${w.sets}×${w.reps}` };
}

// Helper: best weight across all exercises in a session
function gymBestWeights(w) {
  if (w.exercises) {
    return w.exercises.map(ex => ({
      exercise: ex.exercise,
      bestWeight: ex.sets && ex.sets.length > 0 ? Math.max(...ex.sets.map(s => parseFloat(s.weight)||0)) : 0,
      sets: ex.sets || [],
    }));
  }
  return [];
}


// --- EXERCISE FIELD (Dropdown + Tambah Baru) ---
function ExerciseField({ value, onChange, workouts, activeColor, category, templates = [], onTemplateSelect }) {
  const [isNew, setIsNew] = useState(false);

  // Collect unique exercise names from history
  const knownExercises = useMemo(() => {
    const names = workouts
      .filter(w => w.type === 'Gym' && (!category || w.category === category) && Array.isArray(w.exercises))
      .flatMap(w => w.exercises.map(ex => (ex.exercise || ex.name || '').trim()))
      .filter(Boolean);
    return [...new Set(names)].sort();
  }, [workouts, category]);

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setIsNew(true);
      onChange('');
    } else {
      onChange(val);
    }
  };

  if (knownExercises.length === 0 || isNew) {
    return (
      <div>
        {templates.length > 0 && (
          <div className="mb-2">
            <label className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">Template {category || 'Gym'}</label>
            <div className="relative mb-2">
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) { onTemplateSelect && onTemplateSelect(e.target.value); onChange(e.target.value); } }}
                className={`w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-3 text-[#0F172A] text-sm font-medium focus:outline-none transition-colors appearance-none ${activeColor || 'focus:border-[#CBD5E1]'}`}
              >
                <option value="">Pilih dari latihan {category || 'Gym'} sebelumnya...</option>
                {templates.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>
        )}
        <label className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">Gerakan</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Contoh: Chest Press"
            required
            className={`flex-1 bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3.5 text-[#0F172A] text-sm focus:outline-none transition-colors placeholder:text-[#94A3B8] ${activeColor || 'focus:border-[#CBD5E1]'}`}
          />
          {knownExercises.length > 0 && (
            <button
              type="button"
              onClick={() => { setIsNew(false); onChange(''); }}
              className="px-3 py-3.5 bg-[#8B5CF6] rounded-xl text-[#0F172A] hover:text-[#0F172A] text-xs font-bold transition-colors"
            >
              ↩
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {templates.length > 0 && (
        <div className="mb-2">
          <label className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">Template {category || 'Gym'}</label>
          <div className="relative mb-2">
            <select
              defaultValue=""
              onChange={e => { if (e.target.value) { onTemplateSelect && onTemplateSelect(e.target.value); onChange(e.target.value); } }}
              className={`w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-3 text-[#0F172A] text-sm font-medium focus:outline-none transition-colors appearance-none ${activeColor || 'focus:border-[#CBD5E1]'}`}
            >
              <option value="">Pilih dari latihan {category || 'Gym'} sebelumnya...</option>
              {templates.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
          </div>
        </div>
      )}
      <label className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">Gerakan</label>
      <div className="relative">
        <select
          value={value || ''}
          onChange={handleSelect}
          required
          className={`w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3.5 text-[#0F172A] text-sm focus:outline-none transition-colors appearance-none ${activeColor || 'focus:border-[#CBD5E1]'} ${!value ? 'text-[#64748B]' : ''}`}
        >
          <option value="" disabled>Pilih gerakan...</option>
          {knownExercises.map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
          <option value="__new__">➕ Tambah Gerakan Baru...</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
      </div>
    </div>
  );
}

// --- EDIT MODAL -------------------------------------------------------------
function EditModal({ workout, onClose, onSave }) {
  const [date, setDate]         = useState(workout.date || '');
  const [notes, setNotes]       = useState(workout.notes || '');

  // Lari
  const [dist, setDist]         = useState(workout.distance?.toString() || '');
  const [dur, setDur]           = useState(workout.duration?.toString() || '');
  const [hr, setHr]             = useState(workout.hr?.toString() || '');
  const [cadence, setCadence]   = useState(workout.cadence?.toString() || '');
  const [runRpe, setRunRpe]     = useState(workout.rpe?.toString() || '5');
  const [runCat, setRunCat]     = useState(workout.category || 'Easy Run');
  const [planStatus, setPlanStatus] = useState(workout.planStatus || 'Sesuai Plan');

  // Gym
  const [exercise, setExercise] = useState(workout.exercise || '');
  // Parse workout.sets: exercises[] (v3), sets[] (v2), or number (v1)
  const initEditExercises = () => {
    if (workout.exercises && workout.exercises.length > 0) {
      return workout.exercises.map(e => ({
        exercise: e.exercise || '',
        sets: (e.sets || []).map(s => ({ weight: s.weight?.toString() || '', reps: s.reps?.toString() || '' })),
      }));
    }
    // v2 format: single exercise with sets array
    if (Array.isArray(workout.sets)) {
      return [{ exercise: workout.exercise || '', sets: workout.sets.map(s => ({ weight: s.weight?.toString()||'', reps: s.reps?.toString()||'' })) }];
    }
    // v1 format: single exercise single set
    return [{ exercise: workout.exercise || '', sets: [{ weight: workout.weight?.toString()||'', reps: workout.reps?.toString()||'' }] }];
  };
  const [editExercises, setEditExercises] = useState(initEditExercises);
  const [editSets, setEditSets] = useState([]); // kept for non-gym use
  const [gymRpe, setGymRpe]     = useState(workout.rpe?.toString() || '7');
  const [gymCat, setGymCat]     = useState(workout.category || 'Push');

  // Recovery
  const [sleep, setSleep]         = useState(workout.sleep?.toString() || '');
  const [soreness, setSoreness]   = useState(workout.soreness?.toString() || '5');
  const [fatigue, setFatigue]     = useState(workout.fatigue?.toString() || '5');
  const [bodyWeight, setBodyWeight] = useState(workout.weight?.toString() || '');

  const typeColors = {
    Lari:     'from-[#14B8A6]/20 to-[#14B8A6]/10 border-[#0d2d45]/40',
    Gym:      'from-[#8B5CF6]/20 to-[#5a90b8]/10 border-[#0d2d45]/40',
    Recovery: 'from-[#14B8A6]/20 to-[#22a898]/10 border-[#0a2a28]/40',
  };
  const headerColor = typeColors[workout.type] || typeColors.Recovery;

  const handleSave = () => {
    let updated = { ...workout, date, notes };
    if (workout.type === 'Lari') {
      const d = parseFloat(dist), m = parseInt(dur);
      const pace = (d > 0 && m > 0) ? parseFloat((m / d).toFixed(4)) : null;
      updated = { ...updated, category: runCat, distance: d, duration: m, hr: parseInt(hr)||null, cadence: parseInt(cadence)||null, rpe: parseInt(runRpe), planStatus, pace };
    } else if (workout.type === 'Gym') {
      const validExercises = editExercises
        .filter(e => e.exercise && e.sets.some(s => s.weight && s.reps))
        .map(e => ({ exercise: e.exercise, sets: e.sets.filter(s=>s.weight&&s.reps).map(s=>({ weight: parseFloat(s.weight), reps: parseInt(s.reps) })) }));
      updated = { ...updated, category: gymCat, exercises: validExercises, rpe: parseInt(gymRpe) };
    } else {
      updated = { ...updated, sleep: parseFloat(sleep), soreness: parseInt(soreness), fatigue: parseInt(fatigue) };
    }
    onSave(updated);
  };

  const inputCls = (focus) => `w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3 text-[#0F172A] text-sm focus:outline-none transition-colors placeholder:text-[#94A3B8] ${focus}`;
  const labelCls = "block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#F5F7F9]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-t sm:border border-[#CBD5E1] w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className={`p-4 flex items-center justify-between shrink-0 bg-gradient-to-r ${headerColor} border-b`}>
          <div className="flex items-center space-x-2">
            <Pencil className="w-4 h-4 text-[#0F172A]" />
            <h3 className="font-bold text-[#0F172A] text-sm">Edit {workout.type === 'Lari' ? 'Lari' : workout.type === 'Gym' ? workout.exercise : 'Recovery'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#DCE3EA] text-[#0F172A]"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Date */}
          <div>
            <label className={labelCls}>Tanggal</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inputCls('focus:border-[#14B8A6]')} />
          </div>

          {/* LARI FIELDS */}
          {workout.type === 'Lari' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Sesi</label>
                <select value={runCat} onChange={e=>setRunCat(e.target.value)} className={inputCls('focus:border-[#14B8A6]') + ' appearance-none'}>
                  {['Easy Run','Tempo','Interval','Long Run','Recovery'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Jarak (km)</label><input type="number" step="0.01" value={dist} onChange={e=>setDist(e.target.value)} className={inputCls('focus:border-[#14B8A6]')} /></div>
                <div><label className={labelCls}>Waktu (mnt)</label><input type="number" value={dur} onChange={e=>setDur(e.target.value)} className={inputCls('focus:border-[#14B8A6]')} /></div>
                <div><label className={labelCls}>Avg HR</label><input type="number" value={hr} onChange={e=>setHr(e.target.value)} className={inputCls('focus:border-[#14B8A6]')} /></div>
                <div><label className={labelCls}>Cadence</label><input type="number" value={cadence} onChange={e=>setCadence(e.target.value)} className={inputCls('focus:border-[#14B8A6]')} /></div>
              </div>
              {dist && dur && parseFloat(dist) > 0 && parseInt(dur) > 0 && (
                <div className="flex items-center justify-between bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-xl px-4 py-2">
                  <span className="text-[10px] font-bold text-[#14B8A6] uppercase">⚡ Pace</span>
                  <span className="font-black text-[#f0d090]">{formatPace(parseInt(dur), parseFloat(dist))}</span>
                </div>
              )}
              {hr && getHRZone(parseInt(hr)) && (() => { const z = getHRZone(parseInt(hr)); return (
                <div className={`flex items-center justify-between rounded-xl px-4 py-2 border ${z.color}`}>
                  <span className="text-[10px] font-bold uppercase">{z.zone} · {z.label}</span>
                  <span className="font-bold text-sm">{hr} bpm</span>
                </div>
              ); })()}
              <SliderField label="RPE (Kesulitan)" value={runRpe} onChange={e=>setRunRpe(e.target.value)} accentColor="accent-[#14B8A6]" />
              <div>
                <label className={labelCls}>Status Eksekusi</label>
                <select value={planStatus} onChange={e=>setPlanStatus(e.target.value)} className={inputCls('focus:border-[#14B8A6]') + ' appearance-none'}>
                  {['Sesuai Plan','Terlalu Berat','Terlalu Ringan','Missed Plan'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* GYM FIELDS */}
          {workout.type === 'Gym' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Fokus Sesi</label>
                <select value={gymCat} onChange={e=>setGymCat(e.target.value)} className={inputCls('focus:border-[#CBD5E1]') + ' appearance-none'}>
                  {['Push','Pull','Legs','Upper','Lower','Full Body'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Exercise list */}
              {editExercises.map((ex, eIdx) => (
                <div key={eIdx} className="bg-[#F5F7F9] border border-[#CBD5E1]/15 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#FFFFFF] border-b border-[#CBD5E1]/10">
                    <span className="text-[9px] font-black text-[#64748B] uppercase">Gerakan {eIdx+1}</span>
                    {editExercises.length > 1 && (
                      <button type="button" onClick={() => setEditExercises(prev => prev.filter((_,i)=>i!==eIdx))}
                        className="text-[#64748B] hover:text-[#d07573]"><X className="w-3 h-3"/></button>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <input type="text" value={ex.exercise} placeholder="Nama gerakan"
                      onChange={e => setEditExercises(prev => prev.map((x,i)=>i===eIdx?{...x,exercise:e.target.value}:x))}
                      className={inputCls('focus:border-[#CBD5E1]') + ' py-2'} />
                    {ex.sets.map((s, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded bg-[#8B5CF6] text-[9px] font-black text-[#64748B]">S{sIdx+1}</div>
                        <div className="flex-1 relative">
                          <input type="number" step="0.5" placeholder="kg" value={s.weight}
                            onChange={e => setEditExercises(prev => prev.map((x,i)=>i===eIdx?{...x,sets:x.sets.map((ss,j)=>j===sIdx?{...ss,weight:e.target.value}:ss)}:x))}
                            className={inputCls('focus:border-[#CBD5E1]') + ' py-2 pr-8'} />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#64748B]">kg</span>
                        </div>
                        <span className="text-[#64748B] text-xs">×</span>
                        <div className="w-14">
                          <input type="number" placeholder="reps" value={s.reps}
                            onChange={e => setEditExercises(prev => prev.map((x,i)=>i===eIdx?{...x,sets:x.sets.map((ss,j)=>j===sIdx?{...ss,reps:e.target.value}:ss)}:x))}
                            className={inputCls('focus:border-[#CBD5E1]') + ' py-2'} />
                        </div>
                        {sIdx > 0 && (
                          <button type="button" onClick={() => setEditExercises(prev=>prev.map((x,i)=>i===eIdx?{...x,sets:x.sets.filter((_,j)=>j!==sIdx)}:x))}
                            className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[#64748B] hover:text-[#d07573]"><X className="w-3 h-3"/></button>
                        )}
                        {sIdx === 0 && <div className="w-6 flex-shrink-0"/>}
                      </div>
                    ))}
                    {ex.sets.length < 4 && (
                      <button type="button" onClick={() => setEditExercises(prev=>prev.map((x,i)=>i===eIdx?{...x,sets:[...x.sets,{weight:'',reps:''}]}:x))}
                        className="w-full py-1.5 rounded-lg border border-dashed border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] text-[10px] font-bold transition-all">
                        + Set {ex.sets.length + 1}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {editExercises.length < 5 && (
                <button type="button" onClick={() => setEditExercises(prev=>[...prev,{exercise:'',sets:[{weight:'',reps:''}]}])}
                  className="w-full py-2.5 rounded-xl border border-dashed border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] text-xs font-bold transition-all">
                  + Tambah Gerakan {editExercises.length + 1}
                </button>
              )}
              <SliderField label="RPE Sesi" value={gymRpe} onChange={e=>setGymRpe(e.target.value)} accentColor="accent-[#8B5CF6]" />
            </div>
          )}
          {/* RECOVERY FIELDS */}
          {workout.type === 'Recovery' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Tidur (Jam)</label><input type="number" step="0.5" value={sleep} onChange={e=>setSleep(e.target.value)} className={inputCls('focus:border-[#14B8A6]')} /></div>
                <div><label className={labelCls}>Berat (kg)</label><input type="number" step="0.1" value={bodyWeight} onChange={e=>setBodyWeight(e.target.value)} className={inputCls('focus:border-[#14B8A6]')} /></div>
              </div>
              <SliderField label="Rasa Pegal (DOMS)" value={soreness} onChange={e=>setSoreness(e.target.value)} invertColors accentColor="accent-[#14B8A6]" />
              <SliderField label="Tingkat Lelah" value={fatigue} onChange={e=>setFatigue(e.target.value)} invertColors accentColor="accent-[#14B8A6]" />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={labelCls}>Catatan Sesi</label>
            <textarea rows="2" value={notes} onChange={e=>setNotes(e.target.value)}
              className="w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-4 py-3 text-[#0F172A] text-sm focus:outline-none focus:border-[#14B8A6] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#CBD5E1] shrink-0 grid grid-cols-2 gap-3 pb-8 sm:pb-4">
          <button onClick={onClose} className="py-3.5 rounded-xl bg-[#8B5CF6] hover:bg-[#2d3f72] text-[#0F172A] font-bold transition-all active:scale-95 text-sm">Batal</button>
          <button onClick={handleSave} className="py-3.5 rounded-xl bg-gradient-to-r from-[#99F6E4] to-[#14B8A6] text-[#0F172A] font-bold shadow-lg shadow-[#99F6E4]/20 transition-all active:scale-95 text-sm">Simpan</button>
        </div>
      </div>
    </div>
  );
}


// --- UTILITY COMPONENTS ---
function InputField({ label, type, value, onChange, placeholder, step, required, activeColor }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">{label}</label>
      <input 
        type={type} value={value} onChange={onChange} placeholder={placeholder} step={step} required={required}
        className={`w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3.5 text-[#0F172A] text-sm focus:outline-none transition-colors placeholder:text-[#94A3B8] ${activeColor || 'focus:border-[#14B8A6]'}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, activeColor }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#0F172A] mb-1.5 uppercase tracking-wider">{label}</label>
      <select 
        value={value} onChange={onChange}
        className={`w-full bg-[#F5F7F9] border border-[#CBD5E1] rounded-xl px-3 py-3.5 text-[#0F172A] text-sm focus:outline-none transition-colors appearance-none ${activeColor || 'focus:border-[#14B8A6]'}`}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function SliderField({ label, value, onChange, invertColors = false, accentColor = 'accent-[#99F6E4]' }) {
  const numVal = parseInt(value);
  let colorClass = 'text-yellow-400';
  if (numVal < 4) colorClass = 'text-[#14B8A6]';
  else if (numVal > 7) colorClass = 'text-[#d07573]';

  return (
    <div className="pt-2 border-t border-[#CBD5E1]/50">
      <div className="flex justify-between mb-2">
        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">{label}</label>
        <span className={`font-black text-sm ${colorClass}`}>{value}/10</span>
      </div>
      <input 
        type="range" min="1" max="10" value={value} onChange={onChange}
        className={`w-full h-1.5 bg-[#8B5CF6] rounded-lg appearance-none cursor-pointer ${accentColor}`}
      />
    </div>
  );
}function PerformanceTicker({ workouts }) {
  const runs = [...workouts]
    .filter(w => w.type === 'Lari' && w.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const formatPaceTicker = (p) => {
    if (!p || p <= 0) return '--:--';
    const min = Math.floor(p);
    const sec = Math.round((p - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const buildSmoothPath = (pts) => {
    if (!pts.length) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  if (runs.length === 0) {
    return (
      <div className="overflow-hidden rounded-[26px] border border-[#18324b] bg-[#06111f] shadow-[0_24px_60px_rgba(2,8,20,0.46)] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.10),transparent_28%)] pointer-events-none" />
        <div className="px-5 py-5 relative z-10">
          <div className="flex items-center gap-2 text-[#67e8f9]">
            <span className="h-5 w-1 rounded-full bg-[#facc15]" />
            <span className="text-sm font-black tracking-[0.14em] uppercase">Run Pulse</span>
          </div>
          <p className="mt-2 text-sm text-[#94a3b8]">Belum ada data lari untuk ditampilkan.</p>
        </div>
      </div>
    );
  }

  const validRuns = runs.filter(r => r.distance && r.pace && r.pace > 0);
  const sourceRuns = (validRuns.length >= 2 ? validRuns : runs.filter(r => r.distance && r.distance > 0)).slice(-12);

  const distanceSeries = sourceRuns.map(r => parseFloat(r.distance || 0));
  const paceSeriesRaw = sourceRuns.map(r => parseFloat(r.pace || 0)).filter(v => v > 0);
  const distMin = Math.min(...distanceSeries);
  const distMax = Math.max(...distanceSeries);
  const paceMin = paceSeriesRaw.length ? Math.min(...paceSeriesRaw) : 0;
  const paceMax = paceSeriesRaw.length ? Math.max(...paceSeriesRaw) : 0;

  const normalize = (value, min, max, invert = false) => {
    if (!Number.isFinite(value)) return 170;
    if (max === min) return 170;
    const t = (value - min) / (max - min);
    return 28 + (invert ? t : 1 - t) * 214;
  };

  const points = sourceRuns.map((run, idx) => {
    const x = sourceRuns.length === 1 ? 880 : 90 + (idx / (sourceRuns.length - 1)) * 790;
    const distance = parseFloat(run.distance || 0);
    const pace = parseFloat(run.pace || 0);
    const distY = normalize(distance, distMin, distMax, false);
    const paceY = pace > 0 ? normalize(pace, paceMin, paceMax, true) : distY;
    const wave = Math.sin(idx * 0.9) * 8 + Math.cos(idx * 0.55) * 5;
    const y = Math.max(22, Math.min(242, distY * 0.62 + paceY * 0.38 + wave));
    return { x, y, distance, pace, date: run.date, category: run.category || 'Run' };
  });

  const smoothPath = buildSmoothPath(points);
  const areaPath = `${smoothPath} L ${points[points.length - 1].x} 270 L ${points[0].x} 270 Z`;

  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const latestRun = sourceRuns[sourceRuns.length - 1];
  const totalDistance = runs.reduce((sum, run) => sum + parseFloat(run.distance || 0), 0);
  const bestPace = paceSeriesRaw.length ? Math.min(...paceSeriesRaw) : 0;
  const distanceDelta = previous ? latest.distance - previous.distance : 0;
  const paceDelta = previous && previous.pace > 0 && latest.pace > 0 ? latest.pace - previous.pace : 0;
  const isBetter = previous && latest.pace > 0 && previous.pace > 0 ? latest.pace < previous.pace : null;

  const deltaLabel = previous ? `${distanceDelta >= 0 ? '+' : ''}${distanceDelta.toFixed(1)} km` : `${latest.distance.toFixed(1)} km`;
  const deltaSub = previous
    ? (paceDelta === 0 ? 'pace tetap' : `${isBetter ? '-' : '+'}${formatPaceTicker(Math.abs(paceDelta))}`)
    : (latest.pace > 0 ? `${formatPaceTicker(latest.pace)}/km` : 'pace belum ada');

  return (
    <div className="overflow-hidden rounded-[26px] border border-[#18324b] bg-[#06111f] shadow-[0_24px_60px_rgba(2,8,20,0.46)] relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_center,rgba(8,47,73,0.28),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.08),transparent_30%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1d4ed8]/40 to-transparent" />

      <div className="relative z-10 px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[#67e8f9]">
              <span className="h-5 w-1 rounded-full bg-[#facc15]" />
              <span className="text-sm font-black tracking-[0.14em] uppercase">Run Pulse</span>
            </div>
            <p className="mt-2 text-[12px] text-[#dbeafe]">
              {formatDateShort(latestRun.date)} — {latestRun.category || 'Run'} {latest.distance.toFixed(1)} km — {latest.pace > 0 ? `${formatPaceTicker(latest.pace)}/km` : 'pace belum ada'}
            </p>
          </div>
          <div className={`min-w-[94px] rounded-xl border px-3 py-2 text-right shadow-sm ${previous ? (distanceDelta >= 0 ? 'border-[#134e4a] bg-[#082f2b] text-[#86efac]' : 'border-[#4b5563] bg-[#111827] text-[#cbd5e1]') : 'border-[#334155] bg-[#111827] text-[#cbd5e1]'}`}>
            <div className="text-sm font-black leading-none">{deltaLabel}</div>
            <div className="mt-1 text-[10px] font-bold tracking-wide uppercase opacity-80">{deltaSub}</div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 pt-3 relative z-10">
        <div className="rounded-[20px] border border-[#1e3a5f] bg-[linear-gradient(180deg,rgba(5,12,22,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-3 sm:p-4 overflow-hidden">
          <div className="relative h-[220px] sm:h-[260px]">
            <svg viewBox="0 0 1000 270" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="runPulseLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="55%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>
                <linearGradient id="runPulseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.34)" />
                  <stop offset="55%" stopColor="rgba(29,78,216,0.18)" />
                  <stop offset="100%" stopColor="rgba(2,6,23,0.00)" />
                </linearGradient>
                <filter id="runGlow">
                  <feGaussianBlur stdDeviation="7" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d={areaPath} fill="url(#runPulseFill)" />
              <path d={smoothPath} fill="none" stroke="url(#runPulseLine)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#runGlow)" />
              {points.slice(0, -1).map((point, idx) => (
                <circle key={idx} cx={point.x} cy={point.y} r="1.8" fill="#7dd3fc" opacity="0.35" />
              ))}
              <circle cx={latest.x} cy={latest.y} r="13" fill="#67e8f9" opacity="0.18" />
              <circle cx={latest.x} cy={latest.y} r="6.5" fill="#93c5fd" stroke="#07111e" strokeWidth="3" />
            </svg>

            <div className="absolute right-0 top-0 rounded-xl border border-[#223a59] bg-[#0d1727]/92 px-3 py-2 text-right shadow-sm backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#94a3b8]">Pace</div>
              <div className="mt-1 text-sm font-black text-[#eff6ff]">{latest.pace > 0 ? `${formatPaceTicker(latest.pace)}/km` : '--:--'}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-[#1f334d] bg-[#091423] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-widest text-[#64748b]">Jarak terakhir</div>
              <div className="mt-1 text-sm font-black text-[#f8fafc]">{latest.distance.toFixed(1)} km</div>
            </div>
            <div className="rounded-xl border border-[#1f334d] bg-[#091423] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-widest text-[#64748b]">Pace terakhir</div>
              <div className="mt-1 text-sm font-black text-[#f8fafc]">{latest.pace > 0 ? `${formatPaceTicker(latest.pace)}/km` : '--:--'}</div>
            </div>
            <div className="rounded-xl border border-[#1f334d] bg-[#091423] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-widest text-[#64748b]">Best pace</div>
              <div className="mt-1 text-sm font-black text-[#67e8f9]">{bestPace > 0 ? `${formatPaceTicker(bestPace)}/km` : '--:--'}</div>
            </div>
            <div className="rounded-xl border border-[#1f334d] bg-[#091423] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-widest text-[#64748b]">Total jarak</div>
              <div className="mt-1 text-sm font-black text-[#f8fafc]">{totalDistance.toFixed(1)} km</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
