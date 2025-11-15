import { Injectable, signal, inject } from '@angular/core';
import { Resource, INITIAL_RESOURCES } from '../models/resource.model';
import { Decimal } from '../utils/numbers';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private resources = signal<Map<string, Resource>>(new Map());
  private lastUpdate = Date.now();
  private gameLoopInterval?: number;

  constructor() {
    this.initializeResources();
    this.startGameLoop();
    this.loadGameState();
  }

  private initializeResources(): void {
    const resourceMap = new Map<string, Resource>();
    INITIAL_RESOURCES.forEach(resource => {
      resourceMap.set(resource.id, { ...resource });
    });
    this.resources.set(resourceMap);
  }

  getResources() {
    return this.resources.asReadonly();
  }

  getResource(id: string): Resource | undefined {
    return this.resources().get(id);
  }

  addResource(resourceId: string, amount: Decimal | number): void {
    const resourceMap = new Map(this.resources());
    const resource = resourceMap.get(resourceId);
    if (resource) {
      const amountDecimal = amount instanceof Decimal ? amount : new Decimal(amount);
      resource.amount = resource.amount.plus(amountDecimal);
      resourceMap.set(resourceId, resource);
      this.resources.set(resourceMap);
    }
  }

  canAfford(resourceId: string, cost: Decimal | number): boolean {
    const resource = this.resources().get(resourceId);
    const costDecimal = cost instanceof Decimal ? cost : new Decimal(cost);
    return resource ? resource.amount.gte(costDecimal) : false;
  }

  spend(resourceId: string, cost: Decimal | number): boolean {
    if (this.canAfford(resourceId, cost)) {
      const costDecimal = cost instanceof Decimal ? cost : new Decimal(cost);
      this.addResource(resourceId, costDecimal.neg());
      return true;
    }
    return false;
  }

  setProductionRate(resourceId: string, rate: Decimal | number): void {
    const resourceMap = new Map(this.resources());
    const resource = resourceMap.get(resourceId);
    if (resource) {
      resource.productionRate = rate instanceof Decimal ? rate : new Decimal(rate);
      resourceMap.set(resourceId, resource);
      this.resources.set(resourceMap);
    }
  }

  addProductionRate(resourceId: string, additionalRate: number): void {
    const resource = this.resources().get(resourceId);
    if (resource) {
      this.setProductionRate(resourceId, resource.productionRate.plus(additionalRate));
    }
  }

  private startGameLoop(): void {
    this.gameLoopInterval = window.setInterval(() => {
      this.tick();
    }, 100); // Update 10 times per second
  }

  private tick(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    // Apply production rates
    const resourceMap = new Map(this.resources());
    resourceMap.forEach((resource, id) => {
      if (resource.productionRate.gt(0)) {
        resource.amount = resource.amount.plus(resource.productionRate.times(deltaTime));
        resourceMap.set(id, resource);
      }
    });
    this.resources.set(resourceMap);

    // Auto-save every 10 seconds
    if (Math.random() < 0.01) {
      this.saveGameState();
    }
  }

  saveGameState(): void {
    const state = {
      resources: Array.from(this.resources().entries()),
      lastUpdate: this.lastUpdate,
      timestamp: Date.now()
    };
    localStorage.setItem('treefinite_save', JSON.stringify(state));
  }

  loadGameState(): void {
    const saved = localStorage.getItem('treefinite_save');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const resourceMap = new Map<string, Resource>(state.resources);
        
        // Calculate offline progress
        const offlineTime = (Date.now() - state.timestamp) / 1000; // seconds
        resourceMap.forEach((resource, id) => {
          // Convert loaded values to Decimal if they aren't already
          resource.amount = new Decimal(resource.amount);
          resource.productionRate = new Decimal(resource.productionRate);
          
          if (resource.productionRate.gt(0)) {
            resource.amount = resource.amount.plus(resource.productionRate.times(offlineTime));
            resourceMap.set(id, resource);
          }
        });
        
        this.resources.set(resourceMap);
        this.lastUpdate = Date.now();
      } catch (e) {
        console.error('Failed to load game state:', e);
      }
    }
  }

  resetGame(): void {
    localStorage.removeItem('treefinite_save');
    this.initializeResources();
    this.lastUpdate = Date.now();
  }

  ngOnDestroy(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    this.saveGameState();
  }
}
