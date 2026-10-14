export type GameScreen = 
  | 'MENU' 
  | 'LEVEL_SELECT' 
  | 'DIFFICULTY_SELECT'
  | 'BABY_TROLL'
  | 'PLAYING' 
  | 'PAUSED' 
  | 'VICTORY' 
  | 'GAME_COMPLETE' 
  | 'SHOP' 
  | 'STATS' 
  | 'SETTINGS' 
  | 'HOW_TO_PLAY';

export type DifficultyMode = 'KOLAY' | 'ORTA' | 'ZOR';

export type CharacterShape = 'cube' | 'orb' | 'crystal' | 'hexagon';

export interface SkinItem {
  id: string;
  name: string;
  type: 'skin';
  price: number;
  primaryColor: string;
  glowColor: string;
  eyeColor: string;
  description: string;
}

export interface TrailItem {
  id: string;
  name: string;
  type: 'trail';
  price: number;
  color: string;
  glowColor: string;
  description: string;
}

export interface ShapeItem {
  id: string;
  name: string;
  type: 'shape';
  shape: CharacterShape;
  price: number;
  description: string;
}

export type ShopItem = SkinItem | TrailItem | ShapeItem;

export interface MovingWallDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'horizontal' | 'vertical';
  distance: number; // distance in grid units or pixels
  speed: number;
  delay?: number;
  color?: string;
  warningTime?: number;
}

export interface TimedGateDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  openDuration: number; // in seconds
  closedDuration: number;
  offset?: number;
}

export interface SwitchDef {
  id: string;
  x: number;
  y: number;
  targetGateId?: string;
  togglesWall?: boolean;
  label?: string;
}

export interface FakeExitDef {
  id: string;
  x: number;
  y: number;
  message?: string;
  triggered?: boolean;
}

export interface FleeRuleDef {
  triggerDistance: number; // tiles away from exit to trigger flee
  nextX: number;
  nextY: number;
  remainingFlees: number;
  hintMessage?: string;
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  gridWidth: number;
  gridHeight: number;
  map: number[][]; // 0: floor, 1: wall, 2: real exit, 3: fake exit, 4: key, 5: locked gate, 6: coin, 7: player start
  movingWalls?: MovingWallDef[];
  timedGates?: TimedGateDef[];
  switches?: SwitchDef[];
  fleeRules?: FleeRuleDef[];
  fakeExits?: FakeExitDef[];
  fakeFinishLine?: {
    x: number;
    y: number;
    width: number;
    height: number;
    realExitSpawn: { x: number; y: number };
  };
  keysRequired?: number;
  parTime: number; // in seconds
  coinReward: number;
}

export interface UserProgress {
  coins: number;
  unlockedLevels: number[];
  completedLevels: number[];
  levelBestTimes: Record<number, number>;
  levelCoinsCollected: Record<number, number[]>; // indices of coins collected in each level
  equippedSkin: string;
  equippedTrail: string;
  equippedShape: CharacterShape;
  ownedItems: string[];
  stats: {
    totalPlayTime: number;
    restartsCount: number;
    coinsCollectedTotal: number;
    fakeExitsTriggered: number;
    fleeTriggersTotal: number;
    levelsClearedTotal: number;
  };
  settings: {
    masterSound: boolean;
    sfxVolume: number;
    musicEnabled: boolean;
    screenShake: boolean;
    particleDensity: 'low' | 'medium' | 'high';
    controlsSensitivity: number;
  };
}
