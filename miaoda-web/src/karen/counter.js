import { COUNTER_STORAGE_KEY } from './config.js';

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readStoredCounter() {
  try {
    const raw = localStorage.getItem(COUNTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeStoredCounter(payload) {
  localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(payload));
}

export function createDailyCounter() {
  function normalize() {
    const date = todayKey();
    const stored = readStoredCounter();
    if (!stored || stored.date !== date || !Number.isFinite(stored.count)) {
      const fresh = { date, count: 0 };
      writeStoredCounter(fresh);
      return fresh;
    }
    return { date, count: Math.max(0, Math.floor(stored.count)) };
  }
  return {
    getCount() { return normalize().count; },
    increment() {
      const current = normalize();
      const next = { date: current.date, count: current.count + 1 };
      writeStoredCounter(next);
      return next.count;
    }
  };
}