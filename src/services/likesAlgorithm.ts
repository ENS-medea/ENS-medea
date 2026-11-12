import { LessonItem } from '../types';

/**
 * Deterministic pseudo-random generator based on integer seed.
 * Yields consistent organic progression per post ID and minute.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Integer hash from a string ID
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Calculate rate parameters:
 * Phase 1 (0 to 420 mins / first 7 hours): 30 to 45 likes per minute
 *   Average ~37.5 likes/min
 * Phase 2 (421 to 7200 mins / 7 hours to 5 days): 15 to 22 likes per minute
 *   Average ~18.5 likes/min
 * Phase 3 (> 7200 mins / after 5 days): 4 to 9 likes per minute
 *   Average ~6.5 likes/min
 */
const P1_MIN = 30;
const P1_MAX = 45;
const P1_AVG = (P1_MIN + P1_MAX) / 2; // 37.5
const P1_END_MINS = 420;

const P2_MIN = 15;
const P2_MAX = 22;
const P2_AVG = (P2_MIN + P2_MAX) / 2; // 18.5
const P2_END_MINS = 7200;

const P3_MIN = 4;
const P3_MAX = 9;
const P3_AVG = (P3_MIN + P3_MAX) / 2; // 6.5

/**
 * Calculates simulated likes for a post based on elapsed minutes from createdAt/timestamp:
 * - Starts strictly at 0 simulated likes when minsElapsed <= 0.
 * - Phase 1 (0 to 420 mins): increments between 30 and 45 likes/min.
 * - Phase 2 (421 to 7200 mins): increments between 15 and 22 likes/min.
 * - Phase 3 (> 7200 mins): increments between 4 and 9 likes/min.
 */
export function calculateSimulatedLikes(postId: string, minsElapsed: number): number {
  if (minsElapsed <= 0) {
    return 0;
  }

  const baseHash = hashString(postId);
  // Post-specific rate factor between 0 and 1 so each post has its own unique personality
  const postVariance = seededRandom(baseHash + 77);

  // Phase 1 specific rate for this post: between 30 and 45
  const postP1Rate = P1_MIN + postVariance * (P1_MAX - P1_MIN);
  // Phase 2 specific rate for this post: between 15 and 22
  const postP2Rate = P2_MIN + seededRandom(baseHash + 101) * (P2_MAX - P2_MIN);
  // Phase 3 specific rate for this post: between 4 and 9
  const postP3Rate = P3_MIN + seededRandom(baseHash + 203) * (P3_MAX - P3_MIN);

  let simulated = 0;

  if (minsElapsed <= P1_END_MINS) {
    // Within Phase 1: 0 to 420 mins
    // Add small per-minute deterministic organic jitter
    const wholeMins = Math.floor(minsElapsed);
    const fraction = minsElapsed - wholeMins;
    const baseProgress = wholeMins * postP1Rate;
    const jitter = (seededRandom(baseHash + wholeMins) - 0.5) * 5;
    simulated = baseProgress + (fraction * postP1Rate) + jitter;
  } else if (minsElapsed <= P2_END_MINS) {
    // Within Phase 2: 421 to 7200 mins
    const p1Total = P1_END_MINS * postP1Rate;
    const p2Mins = minsElapsed - P1_END_MINS;
    const wholeMins = Math.floor(p2Mins);
    const fraction = p2Mins - wholeMins;
    const baseProgress = wholeMins * postP2Rate;
    const jitter = (seededRandom(baseHash + 5000 + wholeMins) - 0.5) * 4;
    simulated = p1Total + baseProgress + (fraction * postP2Rate) + jitter;
  } else {
    // Phase 3: > 7200 mins
    const p1Total = P1_END_MINS * postP1Rate;
    const p2Total = (P2_END_MINS - P1_END_MINS) * postP2Rate;
    const p3Mins = minsElapsed - P2_END_MINS;
    const wholeMins = Math.floor(p3Mins);
    const fraction = p3Mins - wholeMins;
    const baseProgress = wholeMins * postP3Rate;
    const jitter = (seededRandom(baseHash + 90000 + wholeMins) - 0.5) * 2;
    simulated = p1Total + p2Total + baseProgress + (fraction * postP3Rate) + jitter;
  }

  return Math.max(0, Math.floor(simulated));
}

/**
 * Calculates unified like count:
 * Simulated likes (calculated dynamically from elapsed minutes) + real user likes (incremented on click)
 * Strictly starts at 0 for freshly created posts.
 * Never drops or decreases below previously saved value.
 */
export function calculateAutomatedLikes(lesson: LessonItem, currentNow = Date.now()): number {
  const postTimestamp = lesson.timestamp && !isNaN(lesson.timestamp) && lesson.timestamp > 0
    ? lesson.timestamp
    : currentNow;

  const elapsedMs = Math.max(0, currentNow - postTimestamp);
  const minsElapsed = elapsedMs / (1000 * 60);

  // If created in the last 15 seconds, strictly return real user likes (or 0)
  const simulatedLikes = minsElapsed <= 0.25 
    ? 0 
    : calculateSimulatedLikes(lesson.id, minsElapsed);

  // Real visitor/user likes (incremented permanently by students)
  const userLikes = typeof lesson.userLikes === 'number'
    ? lesson.userLikes
    : (lesson.isLiked ? 1 : 0);

  const totalCalculated = simulatedLikes + userLikes;

  // Monotonic safety: Never decrease below existing likesCount stored in Firestore
  const previousLikes = typeof lesson.likesCount === 'number' ? lesson.likesCount : 0;
  return Math.max(previousLikes, totalCalculated);
}

/**
 * Updates an array of lessons by recalculating their automated minute-based likes.
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
