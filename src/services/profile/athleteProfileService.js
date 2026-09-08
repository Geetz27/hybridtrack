import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Default Athlete Profile factory.
 * Returns a clean profile object with sensible defaults.
 */
export function createDefaultProfile() {
  return {
    name: '',
    primaryGoal: 'General Fitness',
    targetRace: '',
    targetRaceDate: '',
    experienceLevel: 'Intermediate',
    weeklyAvailability: 5,
    preferredGymSplit: 'Push/Pull/Legs',
    preferredRunningStructure: '3 runs/week',
    coachingPhilosophy: '',
    progressionRules: '',
    recoveryRules: '',
    schemaVersion: 1,
  };
}

/**
 * Load the Athlete Profile from Firestore.
 * @param {object} db - Firestore database instance
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object|null>} The profile object, or null if not found.
 */
export async function loadAthleteProfile(db, uid) {
  if (!uid) return null;
  try {
    const profileDocRef = doc(db, 'users', uid, 'profile', 'athlete');
    const snapshot = await getDoc(profileDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (err) {
    console.error('athleteProfileService: loadAthleteProfile failed', err);
    return null;
  }
}

/**
 * Save the Athlete Profile to Firestore.
 * @param {object} db - Firestore database instance
 * @param {string} uid - Firebase Auth UID
 * @param {object} profile - The profile data to persist
 * @returns {Promise<void>}
 */
export async function saveAthleteProfile(db, uid, profile) {
  if (!uid) throw new Error('uid is required');
  try {
    const profileDocRef = doc(db, 'users', uid, 'profile', 'athlete');
    await setDoc(profileDocRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('athleteProfileService: saveAthleteProfile failed', err);
    throw err;
  }
}
