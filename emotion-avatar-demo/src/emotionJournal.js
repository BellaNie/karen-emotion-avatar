import { EXPRESSION_KEYS } from './config.js';

const STORAGE_KEY = 'museumEmotionDailyJournal';
const MAX_RECORDS = 24;

export const EMOTION_META = {
  neutral: { icon: '😐', label: '平稳', tone: 'stable' },
  happy: { icon: '😊', label: '开心', tone: 'warm' },
  sad: { icon: '😔', label: '低落', tone: 'cool' },
  angry: { icon: '😤', label: '烦躁', tone: 'hot' },
  fearful: { icon: '😰', label: '焦虑', tone: 'alert' },
  disgusted: { icon: '😵', label: '倦怠', tone: 'muted' },
  surprised: { icon: '😲', label: '惊讶', tone: 'bright' }
};

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readStoredJournal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredJournal(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function createEmptyJournal(date) {
  return {
    date,
    records: []
  };
}

function normalizeRecord(record) {
  const emotion = EXPRESSION_KEYS.includes(record?.emotion) ? record.emotion : 'neutral';

  return {
    emotion,
    at: record?.at || new Date().toISOString(),
    confidence: Number(record?.confidence || 0),
    reason: record?.reason || 'unknown'
  };
}

function normalizeJournal() {
  const date = todayKey();
  const stored = readStoredJournal();

  if (!stored || stored.date !== date || !Array.isArray(stored.records)) {
    const fresh = createEmptyJournal(date);
    writeStoredJournal(fresh);
    return fresh;
  }

  const normalized = {
    date,
    records: stored.records.map(normalizeRecord).slice(0, MAX_RECORDS)
  };
  writeStoredJournal(normalized);
  return normalized;
}

function countEmotions(records) {
  return EXPRESSION_KEYS.reduce((acc, key) => {
    acc[key] = records.filter(record => record.emotion === key).length;
    return acc;
  }, {});
}

function findDominantEmotion(counts) {
  return EXPRESSION_KEYS.reduce((best, key) => {
    if (!best || counts[key] > counts[best]) {
      return key;
    }
    return best;
  }, 'neutral');
}

function buildSummary(journal) {
  const total = journal.records.length;
  const counts = countEmotions(journal.records);
  const dominantEmotion = total ? findDominantEmotion(counts) : 'neutral';

  return {
    date: journal.date,
    total,
    counts,
    dominantEmotion,
    dominantMeta: EMOTION_META[dominantEmotion],
    records: journal.records
  };
}

export function createEmotionJournal() {
  return {
    getSummary() {
      return buildSummary(normalizeJournal());
    },
    add({ emotion, analysis } = {}) {
      const journal = normalizeJournal();
      const record = normalizeRecord({
        emotion,
        at: new Date().toISOString(),
        confidence: analysis?.confidence,
        reason: analysis?.reason
      });
      const nextJournal = {
        date: journal.date,
        records: [record, ...journal.records].slice(0, MAX_RECORDS)
      };

      writeStoredJournal(nextJournal);
      return buildSummary(nextJournal);
    }
  };
}
