import { signal } from '@angular/core';
import { Decimal } from '../../utils/numbers';
import { StageId, StageModule, SummaryValue } from '../../core/stage';

/**
 * Stand-in for a stage that has not been built yet. Its currency grows at the
 * base income granted by the previous stage, so the stage chain is visible.
 */
export class PlaceholderStage implements StageModule {
  private readonly amount = signal(new Decimal(0));
  private readonly income = signal(0);

  constructor(readonly id: StageId, readonly name: string, readonly currencyName: string) {}

  currency(): Decimal { return this.amount(); }
  rate(): Decimal { return new Decimal(this.income()); }
  target(): Decimal { return new Decimal(Infinity); }
  isComplete(): boolean { return false; }

  start(baseIncome: number): void {
    this.amount.set(new Decimal(0));
    this.income.set(baseIncome);
  }

  tick(seconds: number): void { this.advanceTime(seconds); }

  advanceTime(seconds: number): void {
    this.amount.update(a => a.plus(this.income() * seconds));
  }

  summary(): SummaryValue[] {
    return [{ label: this.currencyName, value: this.amount() }];
  }

  serialize(): unknown {
    return { amount: this.amount().toString(), income: this.income() };
  }

  deserialize(data: unknown): void {
    const save = data as { amount?: string; income?: number } | undefined;
    if (!save) return;
    this.amount.set(new Decimal(save.amount ?? 0));
    this.income.set(save.income ?? 0);
  }
}
