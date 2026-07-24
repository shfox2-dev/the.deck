// Local-storage-backed streak tracking. Swap the storage calls for real
// database reads/writes once accounts exist -- the streak math itself
// (computing consecutive days) will not need to change.

const LOG_KEY = "practiceLog";

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local demo only
}

export function getPracticeLog() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function logPracticeToday() {
  const log = getPracticeLog();
  const today = todayStr();
  if (!log.includes(today)) {
    log.push(today);
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }
  return computeStreak(log);
}

export function computeStreak(log = getPracticeLog()) {
  if (log.length === 0) return 0;
  const days = new Set(log);
  let streak = 0;
  let cursor = new Date();
  // Walk backwards from today; a gap of a day ends the streak.
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
