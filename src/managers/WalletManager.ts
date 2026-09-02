import { EnemyIds, type EnemyId } from '../data/enemies';
import type { WalletSnapshot } from '../state/GameProgress';

export class WalletManager {
  private emeralds: number;
  private rubies: number;

  public constructor(initial: WalletSnapshot = { emeralds: 0, rubies: 0 }) {
    this.emeralds = Math.max(0, Math.floor(initial.emeralds));
    this.rubies = Math.max(0, Math.floor(initial.rubies));
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

  public getSnapshot(): WalletSnapshot {
    return {
      emeralds: this.emeralds,
      rubies: this.rubies,
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

  public reset(): void {
    this.emeralds = 0;
    this.rubies = 0;
  }
}
