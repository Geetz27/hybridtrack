import assert from 'node:assert/strict';
import test from 'node:test';
import { getWeekStartKey, parseWeeklyTargetsInput, resolveWeeklyTargets } from '../../src/utils/weeklyTargets.js';
import { getWeeklyTrainingTracker } from '../../src/utils/dashboard.js';

const raceWeekday = new Date('2026-11-04T09:00:00');
const raceWeekWorkouts = [
  { type: 'Gym', category: 'Push', date: '2026-11-03' },
  { type: 'Lari', date: '2026-11-02' },
  { type: 'Lari', date: '2026-11-04' },
];

test('week keys snap to Monday, including Sunday', () => {
  assert.equal(getWeekStartKey(raceWeekday), '2026-11-02');
  assert.equal(getWeekStartKey(new Date('2026-11-08T20:00:00')), '2026-11-02');
  assert.equal(getWeekStartKey(new Date('2026-11-09T00:00:00')), '2026-11-09');
});

test('a week without custom targets uses the default 1/1/1/3', () => {
  const tracker = getWeeklyTrainingTracker(raceWeekWorkouts, raceWeekday);
  assert.equal(tracker.isCustom, false);
  assert.equal(tracker.weekStart, '2026-11-02');
  assert.deepEqual(tracker.items.map(item => [item.label, item.target]), [['Push', 1], ['Pull', 1], ['Legs', 1], ['Run', 3]]);
  assert.equal(tracker.target, 6);
});

test('custom targets replace the defaults for that week, and Legs 0 drops out of the total', () => {
  const tracker = getWeeklyTrainingTracker(raceWeekWorkouts, raceWeekday, { Push: 1, Pull: 1, Legs: 0, Run: 2 });
  assert.equal(tracker.isCustom, true);
  assert.equal(tracker.target, 4);
  assert.equal(tracker.completed, 3);
  const legs = tracker.items.find(item => item.label === 'Legs');
  assert.deepEqual([legs.target, legs.completed], [0, 0]);
});

test('sessions above a target still cap at the target', () => {
  const extraLegs = [...raceWeekWorkouts, { type: 'Gym', category: 'Legs', date: '2026-11-05' }];
  const legs = getWeeklyTrainingTracker(extraLegs, raceWeekday, { Push: 1, Pull: 1, Legs: 0, Run: 2 })
    .items.find(item => item.label === 'Legs');
  assert.deepEqual([legs.actual, legs.completed], [1, 0]);
});

test('input parsing accepts whole numbers 0 to 14 only', () => {
  assert.deepEqual(parseWeeklyTargetsInput({ Push: '1', Pull: '1', Legs: '0', Run: '3' }).targets, { Push: 1, Pull: 1, Legs: 0, Run: 3 });
  for (const bad of ['', '-1', '15', '2.5', 'abc']) {
    assert.ok(parseWeeklyTargetsInput({ Push: 1, Pull: 1, Legs: bad, Run: 3 }).error, `expected error for "${bad}"`);
  }
});

test('malformed stored targets fall back to the defaults', () => {
  assert.deepEqual(resolveWeeklyTargets({ Push: 1, Legs: 'x' }), { targets: { Push: 1, Pull: 1, Legs: 1, Run: 3 }, isCustom: false });
});
