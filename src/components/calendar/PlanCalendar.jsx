import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flag, Target } from 'lucide-react';
import racePlan from '../../data/racePlan.json';
import {
  buildPlanMonth,
  getPhaseForDate,
  getPhasesInMonth,
  getPlanWeek,
  getPlanWeekCount,
  getWeeksUntil,
  parseDateKey,
  summarizePlannedSession,
  toDateKey,
} from '../../utils/planCalendar';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const monthLabel = date => date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const shortDate = key => parseDateKey(key)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || key;
const longDate = key => parseDateKey(key)?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || key;
const range = values => (Array.isArray(values) ? `${values[0]}-${values[1]}` : null);

const lastRaceKey = racePlan.race.dates[racePlan.race.dates.length - 1];
const raceMonth = parseDateKey(lastRaceKey);

function Marker({ kind, done }) {
  const base = kind === 'run' ? 'rounded-full border-[#1D4ED8]' : 'rounded-[2px] border-[#334155]';
  const fill = done ? (kind === 'run' ? 'bg-[#1D4ED8]' : 'bg-[#334155]') : 'bg-transparent';
  return <span aria-hidden="true" className={`inline-block h-2 w-2 border-[1.5px] ${base} ${fill}`} />;
}

export default function PlanCalendar({ workouts, plannedSessions }) {
  const [today] = useState(() => new Date());
  const todayKey = toDateKey(today);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(todayKey);

  const phases = racePlan.phases;
  const data = useMemo(
    () => buildPlanMonth({ month, workouts, plannedSessions, plan: racePlan }),
    [month, workouts, plannedSessions],
  );
  const selectedCell = data.cells.find(cell => cell.date === selected) || null;
  const currentPhase = getPhaseForDate(phases, todayKey);
  const weeksLeft = getWeeksUntil(lastRaceKey, today);
  const totalWeeks = getPlanWeekCount(phases);
  const todayWeek = getPlanWeek(phases, todayKey);
  const monthPhases = getPhasesInMonth(phases, month);
  const atLastMonth = month.getFullYear() === raceMonth.getFullYear() && month.getMonth() === raceMonth.getMonth();

  const goToMonth = date => {
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelected(null);
  };
  const changeMonth = delta => goToMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  const iconButton = 'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-40';

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-lg font-black text-[#0F172A]">Kalender latihan</h2>
        <p className="mt-1 text-sm leading-5 text-[#475569]">
          {racePlan.race.name} {shortDate(lastRaceKey)}
          {weeksLeft !== null && ` · ${weeksLeft} minggu lagi`}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#64748B]">{racePlan.race.dateNote}</p>
        {currentPhase && todayWeek && (
          <p className="mt-2 text-sm font-bold text-[#1D4ED8]">
            Sekarang: {currentPhase.name} · minggu {todayWeek} dari {totalWeeks}
          </p>
        )}
      </header>

      <section className="rounded-xl border border-[#DCE3EA] bg-white p-3 sm:p-4" aria-label="Kalender bulanan">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" className={iconButton} onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={19} /></button>
          <h3 className="text-center text-sm font-bold text-[#0F172A]" aria-live="polite">{monthLabel(month)}</h3>
          <button type="button" className={iconButton} onClick={() => changeMonth(1)} disabled={atLastMonth} aria-label="Bulan berikutnya"><ChevronRight size={19} /></button>
        </div>

        {monthPhases.length > 0 && (
          <p className="mb-3 text-xs leading-5 text-[#475569]">
            Fase bulan ini: {monthPhases.map(phase => phase.name).join(', ')}
          </p>
        )}

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map(day => <span key={day} className="py-1 text-xs text-[#64748B]">{day}</span>)}
          {Array.from({ length: data.offset }, (_, i) => <span key={`blank-${i}`} />)}
          {data.cells.map(cell => {
            const phaseIndex = cell.phase ? phases.indexOf(cell.phase) : -1;
            const tint = phaseIndex >= 0 && phaseIndex % 2 === 1 ? 'bg-[#F1F5F9]' : 'bg-white';
            const isSelected = selected === cell.date;
            const isToday = cell.date === todayKey;
            // A completed plan session already has its logged workout, so only open sessions get a hollow marker.
            const open = cell.planned.filter(s => s.status !== 'completed' && s.status !== 'skipped');
            const runs = [...cell.done.filter(w => w.type === 'Lari').map(() => true), ...open.filter(s => s.type === 'Run').map(() => false)];
            const gyms = [...cell.done.filter(w => w.type === 'Gym').map(() => true), ...open.filter(s => s.type === 'Strength').map(() => false)];
            const count = cell.done.length + open.length;
            return (
              <button
                type="button"
                key={cell.date}
                onClick={() => setSelected(cell.date)}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${longDate(cell.date)}${cell.isRace ? ', hari lomba' : ''}${count ? `, ${count} sesi` : ''}`}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${tint} ${isSelected ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8]' : isToday ? 'border-[#0F172A]' : 'border-[#E2E8F0]'} ${count || cell.isRace ? 'font-bold text-[#0F172A]' : 'text-[#64748B]'}`}
              >
                <span>{cell.day}</span>
                <span className="flex h-3 items-center gap-1">
                  {cell.isRace && <Flag size={12} className="text-[#0F172A]" aria-hidden="true" />}
                  {cell.milestone && <Target size={12} className="text-[#1D4ED8]" aria-hidden="true" />}
                  {runs.slice(0, 2).map((done, i) => <Marker key={`r${i}`} kind="run" done={done} />)}
                  {gyms.slice(0, 2).map((done, i) => <Marker key={`g${i}`} kind="gym" done={done} />)}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#475569]">
          <li className="flex items-center gap-1.5"><Marker kind="run" done /> Lari selesai</li>
          <li className="flex items-center gap-1.5"><Marker kind="run" /> Lari terjadwal</li>
          <li className="flex items-center gap-1.5"><Marker kind="gym" done /> Gym selesai</li>
          <li className="flex items-center gap-1.5"><Marker kind="gym" /> Gym terjadwal</li>
          <li className="flex items-center gap-1.5"><Flag size={12} aria-hidden="true" /> Lomba</li>
          <li className="flex items-center gap-1.5"><Target size={12} aria-hidden="true" /> Tes</li>
        </ul>

        {selectedCell ? (
          <div className="mt-4 border-t border-[#DCE3EA] pt-3 text-sm" aria-live="polite">
            <p className="font-bold text-[#0F172A]">{longDate(selectedCell.date)}</p>
            <p className="mt-1 text-xs text-[#64748B]">
              {selectedCell.phase ? `${selectedCell.phase.name} · minggu ${selectedCell.week} dari ${totalWeeks}` : 'Di luar peta fase'}
            </p>
            {selectedCell.isRace && <p className="mt-2 font-bold text-[#0F172A]">Hari lomba: {racePlan.race.name}. {racePlan.race.dateNote}</p>}
            {selectedCell.milestone && <p className="mt-2 text-[#334155]"><strong>{selectedCell.milestone.title}.</strong> {selectedCell.milestone.note}</p>}
            {selectedCell.done.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-bold text-[#1D4ED8]">Tercatat</p>
                <ul className="mt-1 space-y-1 text-[#334155]">
                  {selectedCell.done.map((w, i) => (
                    <li key={w.id || i}>
                      {w.type} · {w.category || 'Latihan'}{w.type === 'Lari' && Number.isFinite(Number(w.distance)) && Number(w.distance) > 0 ? ` · ${Number(w.distance)} km` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedCell.planned.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-bold text-[#475569]">Rencana</p>
                <ul className="mt-1 space-y-1 text-[#334155]">
                  {selectedCell.planned.map((session, i) => {
                    const summary = summarizePlannedSession(session);
                    return (
                      <li key={session.id || i}>
                        {session.title}{summary ? ` · ${summary}` : ''}
                        {session.status === 'completed' ? ' · selesai' : session.status === 'skipped' ? ' · dilewati' : ''}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {!selectedCell.done.length && !selectedCell.planned.length && !selectedCell.isRace && !selectedCell.milestone && (
              <p className="mt-2 text-[#64748B]">
                {selectedCell.phase
                  ? 'Belum ada sesi untuk hari ini. Sesi harian muncul setelah blok 8 minggu diimpor lewat tab Input.'
                  : 'Belum ada sesi tercatat.'}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 border-t border-[#DCE3EA] pt-3 text-sm text-[#64748B]">Pilih tanggal untuk melihat fase dan sesinya.</p>
        )}
      </section>

      <section aria-label="Peta fase">
        <h3 className="text-sm font-bold text-[#0F172A]">Peta fase sampai lomba</h3>
        <p className="mt-1 text-xs leading-5 text-[#64748B]">{racePlan.note}</p>
        <ol className="mt-3 divide-y divide-[#DCE3EA] rounded-xl border border-[#DCE3EA] bg-white">
          {phases.map(phase => {
            const active = currentPhase?.id === phase.id;
            const km = range(phase.weeklyKm);
            const longRun = range(phase.longRunKm);
            return (
              <li key={phase.id}>
                <button
                  type="button"
                  onClick={() => { goToMonth(parseDateKey(phase.start)); setSelected(phase.start); }}
                  className="block min-h-11 w-full px-3 py-3 text-left hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-bold text-[#0F172A]">{phase.name}{active && <span className="ml-2 text-xs font-bold text-[#1D4ED8]">Sekarang</span>}</span>
                    <span className="text-xs text-[#64748B]">{shortDate(phase.start)} - {shortDate(phase.end)}</span>
                  </span>
                  <span className="mt-1 block text-xs text-[#334155]">
                    {km ? `${km} km per minggu` : ''}{km && longRun ? ' · ' : ''}{longRun ? `long run ${longRun} km` : ''}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#64748B]">{phase.focus}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
