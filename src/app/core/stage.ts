import { Decimal } from '../utils/numbers';

export type StageId = 'stage1' | 'stage2' | 'stage3';

/** A line in the "while you were away" summary */
export interface SummaryValue {
  label: string;
  value: Decimal;
}

/**
 * A self-contained stage. Each stage has its own currency; beating it starts the
 * next stage's currency at +1/s (the stage chain, see docs/GAME_DESIGN.md).
 */
export interface StageModule {
  readonly id: StageId;
  readonly name: string;
  readonly currencyName: string;

  /** Current amount of this stage's currency */
  currency(): Decimal;
  /** Currency gained per second right now */
  rate(): Decimal;
  /** Currency needed to beat the stage */
  target(): Decimal;
  /** True when the player may beat the stage */
  isComplete(): boolean;

  /** Begin the stage from scratch; baseIncome is the +X/s granted by the previous stage */
  start(baseIncome: number): void;
  /** Simulation step while the game is running */
  tick(seconds: number): void;
  /**
   * Time passed while the player was away (tab closed, hidden or the computer asleep).
   * Only time-based progress happens; nothing is bought or chosen.
   */
  advanceTime(seconds: number): void;
  /** Values compared before and after an absence for the return summary */
  summary(): SummaryValue[];

  serialize(): unknown;
  deserialize(data: unknown): void;
}
