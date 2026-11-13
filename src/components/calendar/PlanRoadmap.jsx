import { useMemo } from 'react';
import { Flag, Target } from 'lucide-react';
import { buildRoadmap, parseDateKey } from '../../utils/planCalendar';

// Alasan desain: jalur vertikal dengan satu titik per fase meniru roadmap rujukan pengguna,
// tetapi satu kolom supaya tetap terbaca di HP. Biru hanya menandai posisi sekarang.
const km = value => value.toLocaleString('id-ID');
const range = values => (Array.isArray(values) ? `${values[0]}-${values[1]}` : null);
const dayMonth = key => parseDateKey(key)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) || key;
const fullDate = key => parseDateKey(key)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || key;

function weekRange(start, end) {
  const a = parseDateKey(start);
  const b = parseDateKey(end);
  if (!a || !b) return start;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}-${b.getDate()} ${a.toLocaleDateString('id-ID', { month: 'short' })}`;
  return `${dayMonth(start)} - ${dayMonth(end)}`;
}

const NODE = {
  done: 'border-[#334155] bg-[#334155]',
  now: 'border-[#2563EB] bg-[#2563EB] ring-4 ring-[#DBEAFE]',
  ahead: 'border-[#94A3B8] bg-white',
};
const SEGMENT = { done: 'bg-[#334155]', now: 'bg-[#2563EB]', ahead: 'bg-[#E2E8F0]' };
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]';

function planWeekLabel(phase, totalWeeks) {
  const first = phase.weeks[0]?.planWeek;
  const last = phase.weeks[phase.weeks.length - 1]?.planWeek;
  if (!first) return '';
  return first === last ? `minggu ${first} dari ${totalWeeks}` : `minggu ${first}-${last} dari ${totalWeeks}`;
}

const dayName = key => parseDateKey(key)?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) || key;
const weightLabel = weight => (weight ? ` · ${km(weight)} kg` : '');

function SessionItem({ session }) {
  const isRun = session.type === 'Run';
  return (
    <li className="border-t border-[#E2E8F0] py-2 first:border-t-0">
      <p className="text-xs text-[#64748B]">{dayName(session.date)}</p>
      <p className="text-sm font-bold text-[#0F172A]">
        {session.title}
        {isRun && Number.isFinite(session.km) ? ` · ${km(session.km)} km` : ''}
      </p>
      <p className="mt-0.5 text-xs leading-5 text-[#334155]">{session.description}</p>
      {isRun && session.notes && <p className="mt-0.5 text-xs leading-5 text-[#334155]">{session.notes}</p>}
      {session.exercises?.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs leading-5 text-[#334155]">
          {session.exercises.map(item => (
            <li key={item.name}>{item.name}: {item.sets} x {item.reps}{weightLabel(item.weight)}</li>
          ))}
        </ul>
      )}
      {session.coachNotes && <p className="mt-1 text-xs leading-5 text-[#64748B]">Catatan: {session.coachNotes}</p>}
    </li>
  );
}

function WeekRow({ week, phaseName, onPick }) {
  const now = week.state === 'now';
  return (
    <li>
      <details open={now} className={`rounded-lg border ${now ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-white'}`}>
        <summary className={`min-h-11 cursor-pointer rounded-lg p-2.5 ${focusRing}`}>
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-bold text-[#0F172A]">
              Mgg {week.inPhase}{week.light && <span className="font-bold text-[#475569]"> · ringan</span>}
              {now && <span className="ml-2 text-xs font-bold text-[#1D4ED8]">Sekarang</span>}
            </span>
            <span className="text-xs text-[#64748B]">{weekRange(week.start, week.end)}</span>
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-[#334155]">
            {km(week.totalKm)} km · {week.runs.map(run => `${run.label} ${km(run.km)}`).join(' · ')}
          </span>
        </summary>
        <div className="px-2.5 pb-2.5">
          <ul>{(week.sessions || []).map(session => <SessionItem key={session.date + session.title} session={session} />)}</ul>
          <button
            type="button"
            onClick={() => onPick(week.start)}
            aria-label={`Lihat Minggu ${week.inPhase} ${phaseName} di kalender`}
            className={`mt-1 min-h-11 rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs font-bold text-[#334155] hover:bg-[#F1F5F9] ${focusRing}`}
          >
            Lihat di kalender
          </button>
        </div>
      </details>
    </li>
  );
}

export default function PlanRoadmap({ plan, detail, todayKey, onPick }) {
  const roadmap = useMemo(() => buildRoadmap({ plan, detail, todayKey }), [plan, detail, todayKey]);
  const { phases, totalWeeks } = roadmap;

  if (!phases.length) {
    return <p className="text-sm text-[#64748B]">Belum ada peta fase. Isi fase di src/data/racePlan.json.</p>;
  }

  const raceDates = (plan.race?.dates || []).map(fullDate).join(' atau ');

  return (
    <section aria-label="Peta jalan sampai lomba">
      <h3 className="text-sm font-bold text-[#0F172A]">Peta jalan {totalWeeks} minggu</h3>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">{plan.note}</p>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">Jarak per minggu di Base 1 diambil dari blok mingguan. Fase lain masih berupa rentang.</p>

      <ol className="relative mt-4 space-y-3">
        <span aria-hidden="true" className="absolute bottom-6 left-[7px] top-6 w-0.5 bg-[#CBD5E1]" />
        {phases.map(phase => {
          const weeklyKm = range(phase.weeklyKm);
          const longRun = range(phase.longRunKm);
          const nowWeek = phase.weeks.find(week => week.state === 'now');
          return (
            <li key={phase.id} className="relative pl-8">
              <span aria-hidden="true" className={`absolute left-0 top-4 h-4 w-4 rounded-full border-2 ${NODE[phase.state]}`} />
              <div className={`rounded-xl border bg-white ${phase.state === 'now' ? 'border-[#2563EB]' : 'border-[#DCE3EA]'}`}>
                <button
                  type="button"
                  onClick={() => onPick(phase.start)}
                  aria-label={`${phase.name}, ${fullDate(phase.start)} sampai ${fullDate(phase.end)}. Lihat di kalender`}
                  className={`block min-h-11 w-full rounded-xl px-3 py-3 text-left hover:bg-[#F8FAFC] ${focusRing}`}
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-bold text-[#0F172A]">
                      {phase.name}
                      {phase.state === 'now' && <span className="ml-2 text-xs font-bold text-[#1D4ED8]">Sekarang</span>}
                    </span>
                    <span className="text-xs text-[#64748B]">{dayMonth(phase.start)} - {fullDate(phase.end)}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#334155]">
                    {phase.weekCount} minggu ({planWeekLabel(phase, totalWeeks)})
                    {weeklyKm ? ` · ${weeklyKm} km per minggu` : ''}
                    {longRun ? ` · long run ${longRun} km` : ''}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#64748B]">{phase.focus}</span>
                  {!phase.hasDetail && (
                    <>
                      <span aria-hidden="true" className="mt-2 flex gap-0.5">
                        {phase.weeks.map(week => <span key={week.start} className={`h-1.5 flex-1 rounded-sm ${SEGMENT[week.state]}`} />)}
                      </span>
                      {nowWeek && (
                        <span className="mt-1 block text-xs font-bold text-[#1D4ED8]">Minggu {nowWeek.inPhase} dari {phase.weekCount} di fase ini</span>
                      )}
                    </>
                  )}
                </button>

                {phase.milestones.map(item => (
                  <p key={item.date} className="flex items-start gap-1.5 px-3 pb-3 text-xs leading-5 text-[#334155]">
                    <Target size={14} className="mt-0.5 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
                    <span><strong>{fullDate(item.date)}: {item.title}.</strong> {item.note}</span>
                  </p>
                ))}

                {phase.hasDetail && (
                  <ol className="space-y-2 px-3 pb-3" aria-label={`Minggu di ${phase.name}`}>
                    {phase.weeks.map(week => week.runs && <WeekRow key={week.start} week={week} phaseName={phase.name} onPick={onPick} />)}
                  </ol>
                )}
              </div>
            </li>
          );
        })}

        <li className="relative pl-8">
          <Flag size={16} className="absolute left-0 top-3 text-[#0F172A]" aria-hidden="true" />
          <div className="rounded-xl border border-[#0F172A] bg-white px-3 py-3">
            <p className="text-sm font-bold text-[#0F172A]">Hari lomba</p>
            <p className="mt-1 text-xs leading-5 text-[#334155]">{plan.race.name}, {raceDates}</p>
            <p className="mt-1 text-xs leading-5 text-[#64748B]">{plan.race.dateNote}</p>
          </div>
        </li>
      </ol>
    </section>
  );
}
