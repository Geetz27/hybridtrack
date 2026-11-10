import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createFuelingReview } from '../../src/utils/fuelingReview.js';

let server;
let FuelingPlanSection;
let FuelingReviewFields;

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  FuelingPlanSection = (await server.ssrLoadModule('/src/components/fueling/FuelingPlanSection.jsx')).default;
  FuelingReviewFields = (await server.ssrLoadModule('/src/components/fueling/FuelingReviewFields.jsx')).default;
});

after(async () => {
  await server.close();
});

test('running schedule details render the visible fueling plan', () => {
  const markup = renderToStaticMarkup(React.createElement(FuelingPlanSection, {
    dateKey: '2026-11-28',
    sessionType: 'Run',
  }));
  assert.match(markup, /Fueling &amp; hidrasi/);
  assert.match(markup, /EJ Sport/);
  assert.match(markup, /text-sm leading-6/);
});

test('strength schedule details do not render fueling guidance', () => {
  const markup = renderToStaticMarkup(React.createElement(FuelingPlanSection, {
    dateKey: '2026-11-28',
    sessionType: 'Strength',
  }));
  assert.equal(markup, '');
});

test('fueling review is collapsed on first render even when it has saved values', () => {
  const markup = renderToStaticMarkup(React.createElement(FuelingReviewFields, {
    value: createFuelingReview({ gelType: 'EJ Sport', waterMl: 350 }),
    onChange: () => {},
  }));
  assert.match(markup, /^<details /);
  assert.doesNotMatch(markup, /^<details[^>]*\sopen(?:=|\s|>)/);
  assert.match(markup, /Review fueling/);
});
