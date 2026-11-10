import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildPlanMonth,
  getPhaseForDate,
  getPlanWeek,
  getPlanWeekCount,
  getPhasesInMonth,
  parseDateKey,
  toDateKey,
} from '../../src/utils/planCalendar.js';

const plan = JSON.parse(readFileSync(new URL('../../src/data/racePlan.json', import.meta.url), 'utf8'));
const phases = plan.phases;

test('phases are contiguous with no gap or overlap', () => {
  for (let i = 1; i < phases.length; i += 1) {
    const previousEnd = parseDateKey(phases[i - 1].end);
    previousEnd.setDate(previousEnd.getDate() + 1);
    assert.equal(toDateKey(previousEnd), phases[i].start, `${phases[i - 1].id} -> ${phases[i].id}`);
  }
});

test('every phase starts on a Monday and ends on a Sunday', () => {
  for (const phase of phases) {
    assert.equal(parseDateKey(phase.start).getDay(), 1, `${phase.id} start`);
    assert.equal(parseDateKey(phase.end).getDay(), 0, `${phase.id} end`);
  }
});

test('plan ends on the last race date and the race dates are valid', () => {
  assert.equal(phases[phases.length - 1].end, plan.race.dates[plan.race.dates.length - 1]);
  for (const date of plan.race.dates) assert.ok(parseDateKey(date), date);
});

test('week numbering covers the whole plan', () => {
  assert.equal(getPlanWeek(phases, '2026-11-09'), 1);
  assert.equal(getPlanWeek(phases, '2026-11-15'), 1);
  assert.equal(getPlanWeek(phases, '2026-11-16'), 2);
  assert.equal(getPlanWeek(phases, '2026-11-08'), null);
  assert.equal(getPlanWeek(phases, '2027-10-25'), null);
  assert.equal(getPlanWeekCount(phases), 50);
});

test('getPhaseForDate honours phase boundaries', () => {
  assert.equal(getPhaseForDate(phases, '2026-11-16').id, 'base-1');
  assert.equal(getPhaseForDate(phases, '2027-01-10').id, 'base-1');
  assert.equal(getPhaseForDate(phases, '2027-01-11').id, 'base-2');
  assert.equal(getPhaseForDate(phases, '2026-11-01'), null);
});

test('getPhasesInMonth lists phases that touch the month', () => {
  const names = getPhasesInMonth(phases, new Date(2027, 0, 1)).map(phase => phase.id);
  assert.deepEqual(names, ['base-1', 'base-2']);
});

test('buildPlanMonth places workouts, planned sessions, race and milestone', () => {
  const nov = buildPlanMonth({
    month: new Date(2026, 10, 1),
    workouts: [{ id: 'a', type: 'Lari', date: '2026-11-11', distance: 4.2 }, { id: 'b', type: 'Other', date: '2026-11-12' }],
    plannedSessions: [
      { dateKey: '2026-11-13', session: { type: 'Rest', title: 'Rest' } },
      { dateKey: '2026-11-14', session: { type: 'Run', title: 'Easy 6 km' } },
    ],
    plan,
  });
  assert.equal(nov.cells.length, 30);
  assert.equal(nov.offset, 6); // 1 Nov 2026 is a Sunday
  assert.equal(nov.cells[10].done.length, 1);
  assert.equal(nov.cells[11].done.length, 0);
  assert.equal(nov.cells[12].planned.length, 0); // rest days are not shown
  assert.equal(nov.cells[13].planned.length, 1);

  const apr = buildPlanMonth({ month: new Date(2027, 3, 1), workouts: [], plannedSessions: [], plan });
  assert.equal(apr.cells[24].milestone.title, 'Tes 10K');

  const oct = buildPlanMonth({ month: new Date(2027, 9, 1), workouts: [], plannedSessions: [], plan });
  assert.equal(oct.cells[23].isRace, true);
  assert.equal(oct.cells[20].isRace, true);
  assert.equal(oct.cells[22].isRace, false);
});
