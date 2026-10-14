import { UserProgress } from '../types/game';

const STORAGE_KEY = 'kacan_cikis_save_v1';

export const DEFAULT_PROGRESS: UserProgress = {
  coins: 0,
  unlockedLevels: [1],
  completedLevels: [],
  levelBestTimes: {},
  levelCoinsCollected: {},
  equippedSkin: 'skin_default',
  equippedTrail: 'trail_default',
  equippedShape: 'cube',
  ownedItems: ['skin_default', 'trail_default', 'shape_cube'],
  stats: {
    totalPlayTime: 0,
    restartsCount: 0,
    coinsCollectedTotal: 0,
    fakeExitsTriggered: 0,
    fleeTriggersTotal: 0,
    levelsClearedTotal: 0,
  },
  settings: {
    masterSound: true,
    sfxVolume: 0.8,
    musicEnabled: true,
    screenShake: true,
    particleDensity: 'high',
    controlsSensitivity: 1.0,
  },
};

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      stats: {
        ...DEFAULT_PROGRESS.stats,
        ...(parsed.stats || {}),
      },
      settings: {
        ...DEFAULT_PROGRESS.settings,
        ...(parsed.settings || {}),
      },
      unlockedLevels: Array.isArray(parsed.unlockedLevels) && parsed.unlockedLevels.length > 0 
        ? parsed.unlockedLevels 
        : [1],
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      ownedItems: Array.isArray(parsed.ownedItems) && parsed.ownedItems.length > 0
        ? parsed.ownedItems
        : ['skin_default', 'trail_default', 'shape_cube'],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage quota or privacy mode safety
  }
}

export function clearUserProgress(): UserProgress {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Safety
  }
  return DEFAULT_PROGRESS;
}
