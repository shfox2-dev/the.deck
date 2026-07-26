// Records today's daily puzzle result so a student can't just replay it for
// a better time. Backed by localStorage for now, same pattern as streak.js.

const STORAGE_KEY = "dailyResults";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadAll() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getTodayResult() {
  const all = loadAll();
  return all[todayStr()] ?? null; // seconds, or null if not done yet
}

export function recordTodayResult(elapsedSeconds) {
  const all = loadAll();
  all[todayStr()] = elapsedSeconds;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}
