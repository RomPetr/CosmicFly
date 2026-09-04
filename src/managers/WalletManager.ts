import { EnemyIds, type EnemyId } from '../data/enemies';
import type { WalletSnapshot } from '../state/GameProgress';

export class WalletManager {
  private emeralds: number;
  private rubies: number;
  private diamonds: number;

  public constructor(initial: WalletSnapshot = { emeralds: 0, rubies: 0, diamonds: 0 }) {
    this.emeralds = Math.max(0, Math.floor(initial.emeralds));
    this.rubies = Math.max(0, Math.floor(initial.rubies));
    this.diamonds = Math.max(0, Math.floor(initial.diamonds));
  }

  public awardForKilledEnemy(enemyId: EnemyId | null): void {
    if (enemyId === EnemyIds.StingDart) {
      this.emeralds += 1;
      return;
    }

    if (enemyId === EnemyIds.MiddleEnemy || enemyId === EnemyIds.MiddleEnemyStage2) {
      this.rubies += 1;
    }
  }

  public getEmeralds(): number {
    return this.emeralds;
  }

  public getRubies(): number {
    return this.rubies;
  }

  public getDiamonds(): number {
    return this.diamonds;
  }

  public getSnapshot(): WalletSnapshot {
    return {
      emeralds: this.emeralds,
      rubies: this.rubies,
      diamonds: this.diamonds,
    };
  }

  public trySpendEmeralds(amount: number): boolean {
    const cost = Math.max(0, Math.floor(amount));
    if (cost <= 0 || this.emeralds < cost) {
      return false;
    }

    this.emeralds -= cost;
    return true;
  }

  public trySpendRubies(amount: number): boolean {
    const cost = Math.max(0, Math.floor(amount));
    if (cost <= 0 || this.rubies < cost) {
      return false;
    }

    this.rubies -= cost;
    return true;
  }

  public awardEmeralds(amount: number): void {
    this.emeralds += Math.max(0, Math.floor(amount));
  }

  public reset(): void {
    this.emeralds = 0;
    this.rubies = 0;
    this.diamonds = 0;
  }
}
