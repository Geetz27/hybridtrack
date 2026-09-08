import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  createTestEnvironment,
  USER_A,
  USER_B,
} from './rules-test.config.js';

const workoutPath = uid => `users/${uid}/workouts/workout-1`;
const planPath = (uid, planId = 'current') => `users/${uid}/plan/${planId}`;
const trainingBlockPath = uid => `users/${uid}/trainingBlocks/block-1`;
const profilePath = (uid, profileId = 'athlete') => `users/${uid}/profile/${profileId}`;

const workout = {
  type: 'Lari',
  date: '2026-08-06',
  distance: 5,
  duration: 30,
  createdAt: '1722924000000',
};

const plan = {
  weekStart: '2026-08-03',
  weekEnd: '2026-08-09',
  planVersion: 1,
  days: {},
};

const trainingBlock = {
  schemaVersion: 1,
  status: 'active',
  trainingBlock: { name: 'Baseline', goal: 'Test', sessions: [] },
};

const profile = {
  name: 'Test Athlete',
  schemaVersion: 1,
  aiProvider: 'optional-provider',
  aiModel: 'optional-model',
};

const gymFixtures = [
  {
    type: 'Gym', date: '2026-08-04', exercise: 'Bench Press',
    weight: 80, sets: 3, reps: 8, createdAt: 'gym-v1',
  },
  {
    type: 'Gym', date: '2026-08-05', exercise: 'Bench Press',
    sets: [{ weight: 80, reps: 8 }], createdAt: 'gym-v2',
  },
  {
    type: 'Gym', date: '2026-08-06', category: 'Push',
    exercises: [{ exercise: 'Bench Press', sets: [{ weight: 80, reps: 8 }] }],
    createdAt: 'gym-v3',
  },
];

let testEnvironment;

before(async () => {
  testEnvironment = await createTestEnvironment();
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

after(async () => {
  await testEnvironment.cleanup();
});

describe('Firestore ownership baseline', () => {
  test('rejects unauthenticated reads and writes', async () => {
    const db = testEnvironment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, workoutPath(USER_A))));
    await assertFails(getDocs(collection(db, `users/${USER_A}/workouts`)));
    await assertFails(setDoc(doc(db, workoutPath(USER_A)), workout));
    await assertFails(setDoc(doc(db, planPath(USER_A)), plan));
    await assertFails(setDoc(doc(db, trainingBlockPath(USER_A)), trainingBlock));
    await assertFails(setDoc(doc(db, profilePath(USER_A)), profile));
  });

  test('allows an owner to read, create, and update known paths', async () => {
    const db = testEnvironment.authenticatedContext(USER_A).firestore();
    const pathsAndData = [
      [workoutPath(USER_A), workout],
      [planPath(USER_A), plan],
      [trainingBlockPath(USER_A), trainingBlock],
      [profilePath(USER_A), profile],
    ];

    for (const [path, data] of pathsAndData) {
      const reference = doc(db, path);
      await assertSucceeds(setDoc(reference, data));
      await assertSucceeds(getDoc(reference));
      await assertSucceeds(updateDoc(reference, { auditMarker: true }));
    }
    await assertSucceeds(getDocs(collection(db, `users/${USER_A}/workouts`)));
  });

  test('rejects cross-user reads, writes, and deletes', async () => {
    const userBDb = testEnvironment.authenticatedContext(USER_B).firestore();
    await assertSucceeds(setDoc(doc(userBDb, workoutPath(USER_B)), workout));

    const userADb = testEnvironment.authenticatedContext(USER_A).firestore();
    await assertFails(getDoc(doc(userADb, workoutPath(USER_B))));
    await assertFails(getDocs(collection(userADb, `users/${USER_B}/workouts`)));
    await assertFails(setDoc(doc(userADb, workoutPath(USER_B)), workout));
    await assertFails(deleteDoc(doc(userADb, workoutPath(USER_B))));
  });

  test('allows an owner to delete a workout', async () => {
    const db = testEnvironment.authenticatedContext(USER_A).firestore();
    const reference = doc(db, workoutPath(USER_A));
    await assertSucceeds(setDoc(reference, workout));
    await assertSucceeds(deleteDoc(reference));
  });

  test('rejects deletion of plan, profile, and training block', async () => {
    const db = testEnvironment.authenticatedContext(USER_A).firestore();
    await assertSucceeds(setDoc(doc(db, planPath(USER_A)), plan));
    await assertSucceeds(setDoc(doc(db, profilePath(USER_A)), profile));
    await assertSucceeds(setDoc(doc(db, trainingBlockPath(USER_A)), trainingBlock));

    await assertFails(deleteDoc(doc(db, planPath(USER_A))));
    await assertFails(deleteDoc(doc(db, profilePath(USER_A))));
    await assertFails(deleteDoc(doc(db, trainingBlockPath(USER_A))));
  });

  test('rejects unknown document IDs and paths', async () => {
    const db = testEnvironment.authenticatedContext(USER_A).firestore();
    await assertFails(setDoc(doc(db, planPath(USER_A, 'archive')), plan));
    await assertFails(getDoc(doc(db, planPath(USER_A, 'archive'))));
    await assertFails(setDoc(doc(db, profilePath(USER_A, 'coach')), profile));
    await assertFails(getDoc(doc(db, profilePath(USER_A, 'coach'))));
    await assertFails(setDoc(doc(db, `users/${USER_A}/unknown/document-1`), {}));
    await assertFails(setDoc(doc(db, `users/${USER_A}`), {}));
  });

  test('keeps merge updates scoped to the authenticated owner', async () => {
    const userADb = testEnvironment.authenticatedContext(USER_A).firestore();
    const ownReference = doc(userADb, workoutPath(USER_A));
    await assertSucceeds(setDoc(ownReference, workout));
    await assertSucceeds(setDoc(ownReference, { notes: 'owner update' }, { merge: true }));

    const userBDb = testEnvironment.authenticatedContext(USER_B).firestore();
    await assertSucceeds(setDoc(doc(userBDb, workoutPath(USER_B)), workout));
    await assertFails(setDoc(
      doc(userADb, workoutPath(USER_B)),
      { notes: 'cross-user update' },
      { merge: true },
    ));
  });

  test('allows existing Gym v1, v2, and v3 shapes', async () => {
    const db = testEnvironment.authenticatedContext(USER_A).firestore();
    for (const [index, fixture] of gymFixtures.entries()) {
      await assertSucceeds(setDoc(
        doc(db, `users/${USER_A}/workouts/gym-v${index + 1}`),
        fixture,
      ));
    }
  });
});
