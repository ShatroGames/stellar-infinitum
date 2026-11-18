/**
 * Player profiles (docs/GAME_DESIGN.md: idle vs active is about how you play,
 * not whether the tab is visible).
 */
export interface Profile {
  name: string;
  /** Seconds between moments the player looks at the game and acts */
  checkInterval: number;
}

export const PROFILES: Profile[] = [
  { name: 'active', checkInterval: 5 },
  { name: 'idle', checkInterval: 45 * 60 },
];

export interface StageResult {
  /** Seconds of game time until the stage is beaten (Infinity if not within the limit) */
  seconds: number;
  /** Named milestones: [label, seconds] */
  milestones: [string, number][];
  /** Number of check-ins where the player did something */
  actions: number;
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return 'not reached';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const h = seconds / 3600;
  return h < 1 ? `${(seconds / 60).toFixed(1)} min` : `${h.toFixed(2)} h`;
}
