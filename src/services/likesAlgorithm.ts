import { LessonItem } from '../types';

/**
 * Deterministic pseudo-random float between 0 and 1 based on an integer seed.
 * Ensures consistent growth targets per post ID.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Computes the deterministic target like count for a post at the end of the initial 15-hour phase.
 * Lands organically between 1068 and 7977 likes.
 */
export function getInitialPhase15hTarget(postId: string): number {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = (hash << 5) - hash + postId.charCodeAt(i);
    hash |= 0;
  }
  const factor = seededRandom(Math.abs(hash) + 42);
  const minLikes = 1068;
  const maxLikes = 7977;
  return Math.floor(minLikes + factor * (maxLikes - minLikes));
}

/**
 * Computes deterministic daily increment for days after the initial 15-hour window.
 * Lands between 39 and 97 likes per day.
 */
export function getDailyIncrement(postId: string, dayIndex: number): number {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = (hash << 5) - hash + postId.charCodeAt(i);
    hash |= 0;
  }
  const factor = seededRandom(Math.abs(hash) + dayIndex * 1337);
  const minDaily = 39;
  const maxDaily = 97;
  return Math.floor(minDaily + factor * (maxDaily - minDaily + 1));
}

/**
 * Automated Like Growth Algorithm (Backend & Firestore Persistent Sync):
 * 1. Initial 15-Hour Growth Phase:
 *    Increment progressively from 0 to target (between 1068 and 7977 likes).
 * 2. Subsequent Daily Growth Phase:
 *    After 15 hours, increment daily by a random organic amount between 39 and 97 likes per day.
 * 3. Real User Integration:
 *    User-generated likes (userLikes) are added permanently on top of the calculated automated base.
 * 4. Never drops or resets:
 *    The calculated like count is strictly monotonic (cannot decrease below previous saved likesCount).
 */
export function calculateAutomatedLikes(lesson: LessonItem, currentNow = Date.now()): number {
  const postTimestamp = lesson.timestamp && !isNaN(lesson.timestamp) && lesson.timestamp > 0
    ? lesson.timestamp
    : currentNow;

  const elapsedMs = Math.max(0, currentNow - postTimestamp);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const target15h = getInitialPhase15hTarget(lesson.id);
  let automatedBase = 0;

  if (elapsedHours <= 0) {
    // Strictly 0 likes at moment of publication
    automatedBase = 0;
  } else if (elapsedHours < 15) {
    // Initial 15-hour window: Smooth organic S-curve (sigmoidal/smoothstep)
    // Starts strictly at 0 likes at t=0, climbing realistically to target15h at t=15h
    const t = Math.min(1, Math.max(0, elapsedHours / 15));
    // Smoothstep: 3*t^2 - 2*t^3. At t=0 gives 0, smooth organic acceleration, gentle deceleration near 15h
    const smoothProgress = (3 * t * t) - (2 * t * t * t);
    automatedBase = Math.floor(target15h * smoothProgress);
  } else {
    // After 15 hours: target15h + daily increments of 39-97 likes per day
    const extraHours = elapsedHours - 15;
    const fullDaysPassed = Math.floor(extraHours / 24);
    const partialDayProgress = (extraHours % 24) / 24;

    let accumulatedDailyLikes = 0;
    for (let day = 1; day <= fullDaysPassed; day++) {
      accumulatedDailyLikes += getDailyIncrement(lesson.id, day);
    }
    // Partial day progressive smooth interpolation
    const currentDayIncrement = getDailyIncrement(lesson.id, fullDaysPassed + 1);
    accumulatedDailyLikes += Math.floor(currentDayIncrement * partialDayProgress);

    automatedBase = target15h + accumulatedDailyLikes;
  }

  // Real visitor/user likes on top of automated base
  const userLikes = typeof lesson.userLikes === 'number'
    ? lesson.userLikes
    : (lesson.isLiked ? 1 : 0);

  const totalCalculated = automatedBase + userLikes;

  // Monotonic safety: Never decrease below existing likesCount stored in Firestore
  const previousLikes = typeof lesson.likesCount === 'number' ? lesson.likesCount : 0;
  return Math.max(previousLikes, totalCalculated);
}

/**
 * Updates an array of lessons by recalculating their automated likes.
 * Returns true if any lesson's likesCount increased.
 */
export function applyAutomatedLikesToLessons(lessons: LessonItem[], now = Date.now()): {
  updatedLessons: LessonItem[];
  hasChanges: boolean;
} {
  let hasChanges = false;
  const updatedLessons = lessons.map(lesson => {
    const newLikesCount = calculateAutomatedLikes(lesson, now);
    if (newLikesCount !== lesson.likesCount) {
      hasChanges = true;
      return {
        ...lesson,
        likesCount: newLikesCount,
        lastLikesSyncedAt: now,
      };
    }
    return lesson;
  });

  return { updatedLessons, hasChanges };
}
