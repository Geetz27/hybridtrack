import assert from 'node:assert/strict';
import test from 'node:test';
import { getFuelingPlan } from '../../src/data/fuelingPlan.js';
import {
  createFuelingReview,
  sanitizeFuelingReview,
} from '../../src/utils/fuelingReview.js';

test('fueling plan only applies to running sessions', () => {
  assert.equal(getFuelingPlan('2026-11-28', 'Strength'), null);
  assert.equal(getFuelingPlan('2026-11-28', 'Rest'), null);
  assert.ok(getFuelingPlan('2026-11-28', 'Run'));
  assert.ok(getFuelingPlan('2026-11-28', 'Lari'));
});

test('dated Base 1 plan keeps the first EJ Sport test explicit', () => {
  const plan = getFuelingPlan('2026-11-28', 'Run');
  assert.equal(plan.preview, 'Fuel: EJ Sport @ menit 40-45 / KM 6');
  assert.equal(plan.isScheduledTest, true);
  assert.match(plan.duringRun.join(' '), /30 g karbohidrat/);
  assert.match(plan.duringRun.join(' '), /Jangan gabungkan dengan Pocari/);
});

test('collapsed summary stays empty when no specific fueling action is planned', () => {
  assert.equal(getFuelingPlan('2026-11-21', 'Run').preview, '');
  assert.equal(getFuelingPlan('2026-12-12', 'Run').preview, '');
  assert.equal(getFuelingPlan('2027-01-09', 'Run').preview, '');
  assert.match(getFuelingPlan('2026-12-05', 'Run').preview, /Pocari/);
});

test('an undated run gets the profile baseline without a distance rule or list preview', () => {
  const plan = getFuelingPlan('2027-02-13', 'Run');
  assert.equal(plan.preview, '');
  assert.equal(plan.isScheduledTest, false);
  assert.equal(plan.preRun.food, '1 pisang + 1 sdm madu');
  assert.match(plan.duringRun.join(' '), /rencana tanggal tersebut/);
});

test('review sanitization preserves optional values and rejects invalid ranges', () => {
  assert.deepEqual(sanitizeFuelingReview({
    gelType: ' EJ Sport ', gelAmount: ' 1 sachet ', waterMl: '350',
    sportsDrinkType: '', sportsDrinkMl: '', stomachResponse: 'OK', energy: '4', notes: ' Nyaman ',
  }), {
    gelType: 'EJ Sport', gelAmount: '1 sachet', waterMl: 350,
    sportsDrinkType: '', sportsDrinkMl: null, stomachResponse: 'OK', energy: 4, notes: 'Nyaman',
  });
  assert.equal(sanitizeFuelingReview({ energy: '9', waterMl: '-10' }), null);
});

test('saved review can be reopened without changing its fields', () => {
  const saved = { gelType: 'EJ Sport', gelAmount: '1 sachet', waterMl: 300, energy: 5 };
  assert.deepEqual(createFuelingReview(saved), {
    gelType: 'EJ Sport',
    gelAmount: '1 sachet',
    waterMl: '300',
    sportsDrinkType: '',
    sportsDrinkMl: '',
    stomachResponse: '',
    energy: '5',
    notes: '',
  });
});
