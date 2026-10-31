import { GameMode, LeaderboardEntry } from '../types/game';

const STORAGE_KEY = 'cyberslash_leaderboard_v1';

const DEFAULT_LEADERBOARDS: LeaderboardEntry[] = [
  { id: '1', name: 'CYBER_NINJA', score: 680, mode: 'classic', date: '2026-10-24', maxCombo: 7, slicedCount: 65 },
  { id: '2', name: 'NEON_VIPER', score: 540, mode: 'classic', date: '2026-10-25', maxCombo: 5, slicedCount: 52 },
  { id: '3', name: 'SYNTH_SLICER', score: 410, mode: 'classic', date: '2026-10-26', maxCombo: 4, slicedCount: 39 },
  { id: '4', name: 'GLITCH_RUNNER', score: 320, mode: 'classic', date: '2026-10-28', maxCombo: 4, slicedCount: 31 },

  { id: '5', name: 'BLITZ_BLADE', score: 790, mode: 'arcade', date: '2026-10-22', maxCombo: 8, slicedCount: 84 },
  { id: '6', name: 'HYPER_SAMURAI', score: 620, mode: 'arcade', date: '2026-10-25', maxCombo: 6, slicedCount: 67 },
  { id: '7', name: 'ZERO_KATANA', score: 480, mode: 'arcade', date: '2026-10-27', maxCombo: 5, slicedCount: 51 },

  { id: '8', name: 'FLOW_MASTER', score: 850, mode: 'zen', date: '2026-10-20', maxCombo: 9, slicedCount: 96 },
  { id: '9', name: 'ZENITH_SLASH', score: 710, mode: 'zen', date: '2026-10-23', maxCombo: 6, slicedCount: 78 },
  { id: '10', name: 'CHILL_WAVE', score: 590, mode: 'zen', date: '2026-10-26', maxCombo: 5, slicedCount: 63 },
];

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARDS));
      return DEFAULT_LEADERBOARDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LEADERBOARDS;
  } catch {
    return DEFAULT_LEADERBOARDS;
  }
}

export function saveLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry[] {
  const current = loadLeaderboard();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString().split('T')[0],
  };

  const updated = [...current, newEntry].sort((a, b) => b.score - a.score);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch {
    // LocalStorage quota fallback
  }
  return updated;
}

export function getHighScoreForMode(mode: GameMode): number {
  const list = loadLeaderboard().filter(e => e.mode === mode);
  if (list.length === 0) return 0;
  return Math.max(...list.map(e => e.score));
}
