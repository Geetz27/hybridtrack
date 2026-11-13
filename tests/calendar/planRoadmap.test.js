import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const plan = JSON.parse(readFileSync(new URL('../../src/data/racePlan.json', import.meta.url), 'utf8'));
const detail = JSON.parse(readFileSync(new URL('../../src/data/base1Weeks.json', import.meta.url), 'utf8'));

let server;
let PlanRoadmap;

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  PlanRoadmap = (await server.ssrLoadModule('/src/components/calendar/PlanRoadmap.jsx')).default;
});

after(async () => {
  await server.close();
});

const render = todayKey => renderToStaticMarkup(React.createElement(PlanRoadmap, { plan, detail, todayKey, onPick: () => {} }));

test('roadmap lists every phase and ends on the race day', () => {
  const markup = render('2026-11-25');
  for (const phase of plan.phases) assert.ok(markup.includes(phase.name), phase.name);
  assert.match(markup, /Peta jalan 50 minggu/);
  assert.match(markup, /Hari lomba/);
  assert.match(markup, /21 Okt 2027 atau 24 Okt 2027/);
});

test('Base 1 shows real weekly totals and marks light weeks', () => {
  const markup = render('2026-11-25');
  for (const total of ['20,5 km', '23 km', '26 km', '25,5 km', '27 km', '22 km']) assert.ok(markup.includes(total), total);
  assert.equal((markup.match(/ · ringan/g) || []).length, 2);
  assert.match(markup, /Tempo 5,5 · Easy 5 · Long run 10/);
});

test('only the current week is open and flagged as now', () => {
  const markup = render('2026-11-25'); // week 2 of Base 1
  assert.equal((markup.match(/<details[^>]* open/g) || []).length, 1);
  assert.match(markup, /<details open[^>]*>(?:(?!<\/details>).)*Mgg 2/);
});

test('each Base 1 week lists its sessions with km and exercises', () => {
  const markup = render('2026-11-25');
  assert.equal((markup.match(/<details/g) || []).length, 8);
  assert.match(markup, /Tempo 2 x 8 menit/);
  assert.match(markup, /Long run 10 km/);
  assert.match(markup, /Pogo Hop: 3 x 10/);
  assert.match(markup, /Leg Press: 2 x 8 · 50 kg/);
});

test('later phases show ranges and the 10K test, no invented weekly distances', () => {
  const markup = render('2026-11-25');
  assert.match(markup, /30-36 km per minggu/);
  assert.match(markup, /25 Apr 2027: Tes 10K/);
  assert.equal((markup.match(/Mgg \d/g) || []).length, 8); // week cells exist for Base 1 only
});

test('a phase in progress without weekly detail shows which week it is', () => {
  const markup = render('2027-03-24'); // Build 1, week 3 (22-28 Mar)
  assert.match(markup, /Minggu 3 dari 8 di fase ini/);
});

test('roadmap text has no em dash and every control is a labelled button', () => {
  const markup = render('2026-11-25');
  assert.ok(!markup.includes('—'));
  const buttons = markup.match(/<button\b[^>]*>/g) || [];
  assert.equal(buttons.length, plan.phases.length + detail.weeks.length);
  assert.ok(buttons.every(tag => tag.includes('type="button"') && tag.includes('aria-label=')));
});
