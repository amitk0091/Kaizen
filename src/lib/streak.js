import { addDays } from '@/lib/dates';

// "Never miss twice" streaks: a single missed day is bridged by a streak freeze
// (at most one per 7 days). Two misses in a row end the streak.
const FREEZE_EVERY_DAYS = 7;

export function computeStreak(dates, today) {
  const set = new Set(dates);
  const yesterday = addDays(today, -1);
  // Today is still open, so an unlogged today doesn't break anything yet.
  let d = set.has(today) ? today : yesterday;
  let streak = 0;
  let freezesUsed = 0;
  let lastFreeze = null;

  for (let guard = 0; guard < 3650; guard++) {
    if (set.has(d)) {
      streak++;
    } else {
      const prev = addDays(d, -1);
      const freezeReady = !lastFreeze || daysBetween(d, lastFreeze) >= FREEZE_EVERY_DAYS;
      if (set.has(prev) && freezeReady) {
        freezesUsed++;
        lastFreeze = d;
      } else {
        break;
      }
    }
    d = addDays(d, -1);
  }

  return {
    streak,
    freezesUsed,
    // Yesterday was missed but the chain is still alive: today must not be missed.
    missedYesterday: streak > 0 && !set.has(today) && !set.has(yesterday),
  };
}

// Longest chain ever, using the same freeze rule.
export function bestStreak(dates) {
  const sorted = [...new Set(dates)].sort();
  if (!sorted.length) return 0;
  const set = new Set(sorted);
  let best = 0, cur = 0, lastFreeze = null;
  let d = sorted[0];
  const end = sorted[sorted.length - 1];
  while (d <= end) {
    if (set.has(d)) {
      cur++;
    } else if (set.has(addDays(d, 1)) && (!lastFreeze || daysBetween(d, lastFreeze) >= FREEZE_EVERY_DAYS)) {
      lastFreeze = d;
    } else {
      cur = 0;
      lastFreeze = null;
    }
    best = Math.max(best, cur);
    d = addDays(d, 1);
  }
  return best;
}

function daysBetween(a, b) {
  return Math.abs(Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 864e5;
}
