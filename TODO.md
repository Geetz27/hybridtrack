# TODO

Deferred on 26 Oct 2026. Fix after Bayrun (8 Nov 2026).

## ProgressionTracker uses undefined functions
`ProgressionTracker` in `src/App.jsx` is never rendered, and it calls three functions that are not
defined or imported in `App.jsx`: `getGymPRs`, `getExercisePerformance`, `formatDateID`.
Nothing breaks today because nothing mounts it. Either delete the component or import/write the
missing helpers before rendering it anywhere.

## 27 pre-existing ESLint errors in src/App.jsx
`npx eslint src/App.jsx` reports 27 errors on `release/v1.0.0-alpha` (374e631), the same count with
the Garmin WIP applied:

- 20 × `no-unused-vars`
- 3 × `no-undef` (the ProgressionTracker functions above)
- 1 × `react-hooks/immutability` (`setGymExercises` used in `applyPlanForDate` before its `useState`)
- 1 × `react-hooks/purity` (`Date.now()` during render in `ExportModal`)
- 1 × `react-hooks/set-state-in-effect` (ProgressionTracker)
- 1 × `no-prototype-builtins`
