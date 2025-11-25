import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  ProbabilityForgeState, 
  ProbabilityOutcome, 
  FateWeight, 
  PullResult, 
  OutcomeRarity,
  PROBABILITY_OUTCOMES,
  FATE_WEIGHTS
} from '../models/probability-forge.model';
import { ArtifactService } from './artifact.service';
@Injectable({
  providedIn: 'root'
})
export class ProbabilityForgeService {
  private artifactService = inject(ArtifactService);
  private readonly UNLOCK_THRESHOLD = 1_000_000_000_000_000_000; // 1 Quintillion Quanta
  private readonly BASE_TOKEN_RATE = 1; // 1 Fate Token per second base
  private readonly TOKEN_BONUS_PER_DISCOVERY = 0.02; // +2% per discovered outcome
  private readonly BASE_PULL_COST = 10; // Starting cost for first pull
  private readonly PULL_COST_SCALING = 1.05; // 5% increase per discovery
  private state = signal<ProbabilityForgeState>({
    systemUnlocked: false,
    fateTokens: 0,
    totalPulls: 0,
    discoveredOutcomes: new Set<string>(),
    outcomeObtainedCounts: new Map<string, number>(),
    unlockedWeights: new Set<string>(),
    weightLevels: new Map<string, number>(),
    currentStreak: 0,
    bestStreak: 0,
    pullsSinceMythic: 0,
    rarityPullCounts: new Map<OutcomeRarity, number>([
      [OutcomeRarity.COMMON, 0],
      [OutcomeRarity.UNCOMMON, 0],
      [OutcomeRarity.RARE, 0],
      [OutcomeRarity.EPIC, 0],
      [OutcomeRarity.MYTHIC, 0]
    ]),
    totalMultiplierGained: 1
  });
  public systemUnlocked = computed(() => this.state().systemUnlocked);
  public fateTokens = computed(() => this.state().fateTokens);
  public totalPulls = computed(() => this.state().totalPulls);
  public discoveredCount = computed(() => this.state().discoveredOutcomes.size);
  public currentStreak = computed(() => this.state().currentStreak);
  public totalMultiplier = computed(() => this.state().totalMultiplierGained);
  public tokenGenerationRate = computed(() => {
    const discovered = this.discoveredCount();
    const bonus = discovered * this.TOKEN_BONUS_PER_DISCOVERY;
    return this.BASE_TOKEN_RATE * (1 + bonus);
  });
  public pullCost = computed(() => {
    const discovered = this.discoveredCount();
    return Math.ceil(this.BASE_PULL_COST * Math.pow(this.PULL_COST_SCALING, discovered));
  });
  public canAffordPull = computed(() => this.fateTokens() >= this.pullCost());
  private outcomes: ProbabilityOutcome[] = [...PROBABILITY_OUTCOMES];
  private fateWeights: FateWeight[] = [...FATE_WEIGHTS];
  private baseProbabilities = {
    [OutcomeRarity.COMMON]: 60,
    [OutcomeRarity.UNCOMMON]: 25,
    [OutcomeRarity.RARE]: 10,
    [OutcomeRarity.EPIC]: 4,
    [OutcomeRarity.MYTHIC]: 1
  };
  constructor() {
    this.loadState();
  }
  checkUnlock(totalQuantaGenerated: number): void {
    if (this.state().systemUnlocked) return; // Already unlocked
    const quantaRequirementMet = totalQuantaGenerated >= this.UNLOCK_THRESHOLD;
    const artifactsRequirementMet = this.artifactService.hasAllBranchesTier10();
    if (quantaRequirementMet && artifactsRequirementMet) {
      this.state.update(s => ({ ...s, systemUnlocked: true }));
      this.saveState();
    }
  }
  generateFateTokens(deltaTime: number): void {
    if (!this.state().systemUnlocked) return;
    const tokensPerSecond = this.tokenGenerationRate();
    const tokensGained = tokensPerSecond * deltaTime;
    this.state.update(s => ({
      ...s,
      fateTokens: s.fateTokens + tokensGained
    }));
  }
  private calculateProbabilities(): Map<OutcomeRarity, number> {
    const probs = new Map<OutcomeRarity, number>();
    probs.set(OutcomeRarity.COMMON, this.baseProbabilities[OutcomeRarity.COMMON]);
    probs.set(OutcomeRarity.UNCOMMON, this.baseProbabilities[OutcomeRarity.UNCOMMON]);
    probs.set(OutcomeRarity.RARE, this.baseProbabilities[OutcomeRarity.RARE]);
    probs.set(OutcomeRarity.EPIC, this.baseProbabilities[OutcomeRarity.EPIC]);
    probs.set(OutcomeRarity.MYTHIC, this.baseProbabilities[OutcomeRarity.MYTHIC]);
    this.fateWeights
      .filter(w => w.type === 'rarity_shift' && w.unlocked && w.level > 0)
      .forEach(weight => {
        const currentProb = probs.get(weight.effect.rarity) || 0;
        const increase = weight.effect.increase * weight.level;
        probs.set(weight.effect.rarity, currentProb + increase);
      });
    const expoWeight = this.fateWeights.find(w => w.id === 'expo_scaling');
    if (expoWeight?.unlocked) {
      const m1Count = this.state().outcomeObtainedCounts.get('m1') || 0;
      const m2Count = this.state().outcomeObtainedCounts.get('m2') || 0;
      const mythicsFound = m1Count + m2Count;
      const mythicBonus = mythicsFound * expoWeight.effect.perMythic;
      const currentMythic = probs.get(OutcomeRarity.MYTHIC) || 0;
      probs.set(OutcomeRarity.MYTHIC, currentMythic + mythicBonus);
    }
    const total = Array.from(probs.values()).reduce((sum, p) => sum + p, 0);
    probs.forEach((prob, rarity) => {
      probs.set(rarity, (prob / total) * 100);
    });
    return probs;
  }
  pull(): PullResult {
    if (!this.state().systemUnlocked) {
      throw new Error('Probability Forge not unlocked');
    }
    const cost = this.pullCost();
    if (this.fateTokens() < cost) {
      throw new Error('Not enough Fate Tokens');
    }
    this.state.update(s => ({
      ...s,
      fateTokens: s.fateTokens - cost
    }));
    const probs = this.calculateProbabilities();
    const forcedRarity = this.checkPity();
    const rarity = forcedRarity || this.rollRarity(probs);
    const outcome = this.selectOutcome(rarity);
    const isNew = !this.state().discoveredOutcomes.has(outcome.id);
    const isRareOrBetter = [OutcomeRarity.RARE, OutcomeRarity.EPIC, OutcomeRarity.MYTHIC].includes(rarity);
    let streakBonus = 0;
    if (isRareOrBetter) {
      const streakWeight = this.fateWeights.find(w => w.id === 'streak_bonus');
      if (streakWeight?.unlocked && streakWeight.level > 0) {
        streakBonus = this.state().currentStreak * streakWeight.effect.bonusPerLevel * streakWeight.level;
      }
    }
    const finalMultiplier = outcome.multiplier * (1 + streakBonus / 100);
    this.state.update(s => {
      const newDiscovered = new Set(s.discoveredOutcomes);
      newDiscovered.add(outcome.id);
      const newObtainedCounts = new Map(s.outcomeObtainedCounts);
      newObtainedCounts.set(outcome.id, (newObtainedCounts.get(outcome.id) || 0) + 1);
      const newRarityCounts = new Map(s.rarityPullCounts);
      newRarityCounts.set(rarity, (newRarityCounts.get(rarity) || 0) + 1);
      const newStreak = isRareOrBetter ? s.currentStreak + 1 : 0;
      const newBestStreak = Math.max(s.bestStreak, newStreak);
      const pullsSinceM = rarity === OutcomeRarity.MYTHIC ? 0 : s.pullsSinceMythic + 1;
      return {
        ...s,
        totalPulls: s.totalPulls + 1,
        discoveredOutcomes: newDiscovered,
        outcomeObtainedCounts: newObtainedCounts,
        rarityPullCounts: newRarityCounts,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        pullsSinceMythic: pullsSinceM,
        totalMultiplierGained: s.totalMultiplierGained * finalMultiplier
      };
    });
    const outcomeIndex = this.outcomes.findIndex(o => o.id === outcome.id);
    if (outcomeIndex >= 0) {
      this.outcomes[outcomeIndex] = {
        ...this.outcomes[outcomeIndex],
        discovered: true,
        obtainedCount: this.state().outcomeObtainedCounts.get(outcome.id) || 0
      };
    }
    this.saveState();
    return {
      outcome,
      isNew,
      streakBonus,
      finalMultiplier
    };
  }
  private checkPity(): OutcomeRarity | null {
    const state = this.state();
    const mythicPity = this.fateWeights.find(w => w.id === 'pity_mythic');
    if (mythicPity?.unlocked && state.pullsSinceMythic >= mythicPity.effect.threshold) {
      return OutcomeRarity.MYTHIC;
    }
    return null;
  }
  private rollRarity(probs: Map<OutcomeRarity, number>): OutcomeRarity {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [rarity, prob] of probs.entries()) {
      cumulative += prob;
      if (rand <= cumulative) {
        return rarity;
      }
    }
    return OutcomeRarity.COMMON; // Fallback
  }
  private selectOutcome(rarity: OutcomeRarity): ProbabilityOutcome {
    const rarityOutcomes = this.outcomes.filter(o => o.rarity === rarity);
    const dupeProtection = this.fateWeights.find(w => w.id === 'dupe_protection');
    if (dupeProtection?.unlocked) {
      const newOutcomes = rarityOutcomes.filter(o => !this.state().discoveredOutcomes.has(o.id));
      if (newOutcomes.length > 0) {
        const rand = Math.random();
        if (rand < 0.75) { // 75% chance to get new outcome
          return newOutcomes[Math.floor(Math.random() * newOutcomes.length)];
        }
      }
    }
    return rarityOutcomes[Math.floor(Math.random() * rarityOutcomes.length)];
  }
  unlockWeight(weightId: string): boolean {
    const weight = this.fateWeights.find(w => w.id === weightId);
    if (!weight) return false;
    if (this.state().fateTokens < weight.cost) return false;
    this.state.update(s => {
      const newUnlocked = new Set(s.unlockedWeights);
      newUnlocked.add(weightId);
      return {
        ...s,
        unlockedWeights: newUnlocked,
        fateTokens: s.fateTokens - weight.cost
      };
    });
    const weightIndex = this.fateWeights.findIndex(w => w.id === weightId);
    if (weightIndex >= 0) {
      this.fateWeights[weightIndex] = { ...this.fateWeights[weightIndex], unlocked: true };
    }
    this.saveState();
    return true;
  }
  upgradeWeight(weightId: string): boolean {
    const weight = this.fateWeights.find(w => w.id === weightId);
    if (!weight || !weight.unlocked) return false;
    const currentLevel = this.state().weightLevels.get(weightId) || 0;
    if (currentLevel >= weight.maxLevel) return false;
    const upgradeCost = weight.cost * Math.pow(2, currentLevel);
    if (this.state().fateTokens < upgradeCost) return false;
    this.state.update(s => {
      const newLevels = new Map(s.weightLevels);
      newLevels.set(weightId, currentLevel + 1);
      return {
        ...s,
        weightLevels: newLevels,
        fateTokens: s.fateTokens - upgradeCost
      };
    });
    const weightIndex = this.fateWeights.findIndex(w => w.id === weightId);
    if (weightIndex >= 0) {
      this.fateWeights[weightIndex] = { 
        ...this.fateWeights[weightIndex], 
        level: currentLevel + 1 
      };
    }
    this.saveState();
    return true;
  }
  getOutcomes(): ProbabilityOutcome[] {
    return this.outcomes;
  }
  getOutcomesByRarity(rarity: OutcomeRarity): ProbabilityOutcome[] {
    return this.outcomes.filter(o => o.rarity === rarity);
  }
  getFateWeights(): FateWeight[] {
    return this.fateWeights;
  }
  getCurrentProbabilities(): Map<OutcomeRarity, number> {
    return this.calculateProbabilities();
  }
  getCollectionProgress(): { discovered: number; total: number; percentage: number } {
    const discovered = this.state().discoveredOutcomes.size;
    const total = this.outcomes.length;
    const percentage = (discovered / total) * 100;
    return { discovered, total, percentage };
  }
  private saveState(): void {
    const state = this.state();
    localStorage.setItem('probabilityForgeState', JSON.stringify({
      ...state,
      discoveredOutcomes: Array.from(state.discoveredOutcomes),
      outcomeObtainedCounts: Array.from(state.outcomeObtainedCounts.entries()),
      unlockedWeights: Array.from(state.unlockedWeights),
      weightLevels: Array.from(state.weightLevels.entries()),
      rarityPullCounts: Array.from(state.rarityPullCounts.entries())
    }));
    localStorage.setItem('probabilityOutcomes', JSON.stringify(this.outcomes));
    localStorage.setItem('fateWeights', JSON.stringify(this.fateWeights));
  }
  private loadState(): void {
    const saved = localStorage.getItem('probabilityForgeState');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.state.set({
        ...parsed,
        discoveredOutcomes: new Set(parsed.discoveredOutcomes),
        outcomeObtainedCounts: new Map(parsed.outcomeObtainedCounts),
        unlockedWeights: new Set(parsed.unlockedWeights),
        weightLevels: new Map(parsed.weightLevels),
        rarityPullCounts: new Map(parsed.rarityPullCounts)
      });
    }
    const savedOutcomes = localStorage.getItem('probabilityOutcomes');
    if (savedOutcomes) {
      this.outcomes = JSON.parse(savedOutcomes);
    }
    const savedWeights = localStorage.getItem('fateWeights');
    if (savedWeights) {
      this.fateWeights = JSON.parse(savedWeights);
    }
  }
  reset(): void {
    localStorage.removeItem('stellarInfinitum_probabilityForge');
    this.state.set({
      systemUnlocked: false,
      fateTokens: 0,
      totalPulls: 0,
      discoveredOutcomes: new Set<string>(),
      outcomeObtainedCounts: new Map<string, number>(),
      unlockedWeights: new Set<string>(),
      weightLevels: new Map<string, number>(),
      currentStreak: 0,
      bestStreak: 0,
      pullsSinceMythic: 0,
      rarityPullCounts: new Map<OutcomeRarity, number>([
        [OutcomeRarity.COMMON, 0],
        [OutcomeRarity.UNCOMMON, 0],
        [OutcomeRarity.RARE, 0],
        [OutcomeRarity.EPIC, 0],
        [OutcomeRarity.MYTHIC, 0]
      ]),
      totalMultiplierGained: 1
    });
    this.outcomes = [...PROBABILITY_OUTCOMES];
    this.fateWeights = [...FATE_WEIGHTS];
  }
}