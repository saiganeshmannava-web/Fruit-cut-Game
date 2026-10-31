export type GameMode = 'classic' | 'arcade' | 'zen';

export type FruitId = 
  | 'watermelon' 
  | 'orange' 
  | 'strawberry' 
  | 'pineapple' 
  | 'banana' 
  | 'dragonfruit' 
  | 'kiwi' 
  | 'coconut'
  | 'frenzy_banana'
  | 'golden_dragon'
  | 'bomb';

export interface FruitConfig {
  id: FruitId;
  name: string;
  points: number;
  radius: number;
  primaryColor: string;
  secondaryColor: string;
  juiceColor: string;
  glowColor: string;
  isSpecial?: boolean;
  specialType?: 'frenzy' | 'bonus' | 'bomb';
}

export interface CutHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  cutAngle: number;
  side: 1 | -1;
  opacity: number;
}

export interface FlyingObject {
  id: string;
  type: FruitId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  radius: number;
  isCut: boolean;
  cutTime?: number;
  halves?: [CutHalf, CutHalf];
  halvesCreated?: boolean;
  hasBeenMissed?: boolean;
}

export interface SlicePoint {
  x: number;
  y: number;
  time: number;
}

export interface JuiceSplat {
  x: number;
  y: number;
  color: string;
  radius: number;
  points: { dx: number; dy: number; r: number }[];
  alpha: number;
  maxAlpha: number;
  createdTime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  glow?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  glowColor: string;
  scale: number;
  alpha: number;
  vy: number;
  createdAt: number;
}

export interface BladeStyle {
  id: string;
  name: string;
  glowColor: string;
  coreColor: string;
  particleColor: string;
  description: string;
  unlockedAt: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  mode: GameMode;
  date: string;
  maxCombo: number;
  slicedCount: number;
}

export interface GameStats {
  score: number;
  maxCombo: number;
  currentCombo: number;
  slicedTotal: number;
  slicedByType: Record<string, number>;
  bombsHit: number;
  timePlayedSeconds: number;
}
