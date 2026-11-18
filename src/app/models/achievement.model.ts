/**
 * Achievements are cosmetic and come only from natural progression: nothing is
 * missable or conditional (docs/GAME_DESIGN.md, pillar 11). The list grows as
 * stages are built.
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt?: number;
}

export enum AchievementCategory {
  JOURNEY = 'Journey',
  STAGE1 = 'Stellar Network',
}

const define = (id: string, name: string, description: string, icon: string, category: AchievementCategory): Achievement =>
  ({ id, name, description, icon, category, unlocked: false });

export const ACHIEVEMENTS: Achievement[] = [
  define('welcome', 'First Light', 'Start your journey', '✨', AchievementCategory.JOURNEY),
  define('stage1_beaten', 'Network Online', 'Beat Stage 1', '◇', AchievementCategory.JOURNEY),

  define('first_node', 'First Steps', 'Buy your first node', '✦', AchievementCategory.STAGE1),
  define('energy_1m', 'Energy Surge', 'Hold 1M Energy', '⚡', AchievementCategory.STAGE1),
  define('first_warp', 'Warp Drive', 'Warp for the first time', '➶', AchievementCategory.STAGE1),
  define('tier_3', 'Synthesis', 'Reach Tier 3', '◆', AchievementCategory.STAGE1),
  define('energy_1t', 'Cosmic Battery', 'Hold 1T Energy', '🔋', AchievementCategory.STAGE1),
  define('tier_5', 'Ultimate Synthesis', 'Reach Tier 5', '✶', AchievementCategory.STAGE1),
];
