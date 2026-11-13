const DAY_MS = 86400000;

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function getPhaseForDate(phases, dateKey) {
  return (phases || []).find(phase => dateKey >= phase.start && dateKey <= phase.end) || null;
}

// Week number inside the whole plan (week 1 = first phase start), or null outside the plan.
export function getPlanWeek(phases, dateKey) {
  if (!phases?.length) return null;
  const first = parseDateKey(phases[0].start);
  const last = phases[phases.length - 1].end;
  const date = parseDateKey(dateKey);
  if (!first || !date || dateKey < phases[0].start || dateKey > last) return null;
  return Math.floor((date - first) / (7 * DAY_MS)) + 1;
}

export function getPlanWeekCount(phases) {
  if (!phases?.length) return 0;
  return getPlanWeek(phases, phases[phases.length - 1].end) || 0;
}

export function getWeeksUntil(dateKey, today = new Date()) {
  const target = parseDateKey(dateKey);
  if (!target) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return Math.max(0, Math.ceil((target - start) / (7 * DAY_MS)));
}

export function getPhasesInMonth(phases, month) {
  const first = toDateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const last = toDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  return (phases || []).filter(phase => phase.start <= last && phase.end >= first);
}

export function addDays(dateKey, days) {
  const date = parseDateKey(dateKey);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function stateFor(todayKey, start, end) {
  if (todayKey < start) return 'ahead';
  if (todayKey > end) return 'done';
  return 'now';
}

/**
 * Roadmap data: every phase with its weeks and state against today.
 * detail: { phaseId, weeks: [{ n, start, light, runs: [{ label, km }] }] } with real per-week runs for one phase.
 * Phases without detail only carry the rough ranges from the plan, no invented weekly numbers.
 */
export function buildRoadmap({ plan, detail, todayKey }) {
  const phases = plan?.phases || [];
  const milestones = plan?.milestones || [];
  const detailByStart = {};
  for (const week of detail?.weeks || []) detailByStart[week.start] = week;

  const built = phases.map(phase => {
    const first = parseDateKey(phase.start);
    const last = parseDateKey(phase.end);
    const weekCount = first && last ? Math.round((last - first) / DAY_MS / 7 + 1 / 7) : 0;
    const weeks = Array.from({ length: weekCount }, (_, i) => {
      const start = addDays(phase.start, i * 7);
      const end = addDays(start, 6);
      const extra = phase.id === detail?.phaseId ? detailByStart[start] : null;
      const runs = extra?.runs || null;
      return {
        planWeek: getPlanWeek(phases, start),
        inPhase: i + 1,
        start,
        end,
        state: stateFor(todayKey, start, end),
        light: Boolean(extra?.light),
        runs,
        sessions: extra?.sessions || [],
        totalKm: runs ? runs.reduce((sum, run) => sum + run.km, 0) : null,
      };
    });
    return {
      ...phase,
      weekCount,
      weeks,
      hasDetail: weeks.some(week => week.runs),
      state: stateFor(todayKey, phase.start, phase.end),
      milestones: milestones.filter(item => item.date >= phase.start && item.date <= phase.end),
    };
  });

  return { phases: built, totalWeeks: getPlanWeekCount(phases) };
}

export function summarizePlannedSession(session) {
  const prescription = session?.prescription || {};
  if (session?.type === 'Run') {
    const parts = [];
    if (Number.isFinite(prescription.distance)) parts.push(`${prescription.distance} km`);
    if (Number.isFinite(prescription.duration)) parts.push(`${prescription.duration} menit`);
    return parts.join(' · ');
  }
  if (session?.type === 'Strength') {
    const count = Array.isArray(prescription.exercises) ? prescription.exercises.length : 0;
    return count > 0 ? `${count} gerakan` : '';
  }
  return '';
}

/**
 * Build one month of the plan calendar.
 * workouts: logged workouts ({ type: 'Lari' | 'Gym', date, distance }).
 * plannedSessions: [{ dateKey, session }] from the active training block.
 */
export function buildPlanMonth({ month, workouts, plannedSessions, plan }) {
  const year = month.getFullYear();
  const index = month.getMonth();
  const count = new Date(year, index + 1, 0).getDate();
  const phases = plan?.phases || [];
  const raceDates = plan?.race?.dates || [];
  const milestones = plan?.milestones || [];

  const doneByDate = {};
  for (const workout of workouts || []) {
    if (!workout || !['Lari', 'Gym'].includes(workout.type)) continue;
    if (!parseDateKey(workout.date)) continue;
    (doneByDate[workout.date] ||= []).push(workout);
  }
  const plannedByDate = {};
  for (const item of plannedSessions || []) {
    if (!item?.dateKey || item.session?.type === 'Rest') continue;
    (plannedByDate[item.dateKey] ||= []).push(item.session);
  }

  const cells = Array.from({ length: count }, (_, i) => {
    const date = toDateKey(new Date(year, index, i + 1));
    const phase = getPhaseForDate(phases, date);
    return {
      date,
      day: i + 1,
      phase,
      week: getPlanWeek(phases, date),
      done: doneByDate[date] || [],
      planned: plannedByDate[date] || [],
      isRace: raceDates.includes(date),
      milestone: milestones.find(item => item.date === date) || null,
    };
  });

  return { cells, offset: (new Date(year, index, 1).getDay() + 6) % 7 };
}
