import { bases } from '../data/bases';

const STORAGE_KEY = 'cosmicfly.progress.v1';
const CURRENT_VERSION = 2;

export type WalletSnapshot = {
  readonly emeralds: number;
  readonly rubies: number;
};

type ProgressShape = {
  version: number;
  reachedCheckpointsKm: number[];
  checkpointWallets: Record<string, WalletSnapshot>;
};

export type StartPoint = {
  readonly id: string;
  readonly displayName: string;
  readonly distanceKm: number;
};

const NEW_FLIGHT_START: StartPoint = {
  id: 'new-flight',
  displayName: 'New flight',
  distanceKm: 0,
};

const EMPTY_WALLET: WalletSnapshot = { emeralds: 0, rubies: 0 };

export class GameProgress {
  private reachedCheckpointsKm: Set<number>;
  private checkpointWallets: Map<number, WalletSnapshot>;

  public constructor() {
    this.reachedCheckpointsKm = new Set<number>();
    this.checkpointWallets = new Map<number, WalletSnapshot>();
    this.load();
  }

  public hasCheckpoint(km: number): boolean {
    return this.reachedCheckpointsKm.has(km);
  }

  public recordCheckpoint(km: number, wallet: WalletSnapshot): boolean {
    if (this.reachedCheckpointsKm.has(km)) {
      return false;
    }

    this.reachedCheckpointsKm.add(km);
    this.checkpointWallets.set(km, {
      emeralds: Math.max(0, Math.floor(wallet.emeralds)),
      rubies: Math.max(0, Math.floor(wallet.rubies)),
    });
    this.save();
    return true;
  }

  public getCheckpointWallet(km: number): WalletSnapshot {
    return this.checkpointWallets.get(km) ?? EMPTY_WALLET;
  }

  public getStartPoints(): readonly StartPoint[] {
    const unlocked: StartPoint[] = [NEW_FLIGHT_START];

    for (const base of bases) {
      if (this.reachedCheckpointsKm.has(base.unlockAtKm)) {
        unlocked.push({
          id: `checkpoint-${base.id}`,
          displayName: `Continue from ${base.displayName} (${base.unlockAtKm} km)`,
          distanceKm: base.unlockAtKm,
        });
      }
    }

    return unlocked;
  }

  public reset(): void {
    this.reachedCheckpointsKm.clear();
    this.checkpointWallets.clear();
    this.save();
  }

  private load(): void {
    const storage = this.tryGetStorage();
    if (storage === null) {
      return;
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return;
    }

    const parsed = this.tryParse(raw);
    if (parsed === null) {
      return;
    }

    this.reachedCheckpointsKm = new Set(parsed.reachedCheckpointsKm);
    this.checkpointWallets = new Map(
      Object.entries(parsed.checkpointWallets).map(([km, wallet]) => [
        Number(km),
        wallet,
      ]),
    );
  }

  private save(): void {
    const storage = this.tryGetStorage();
    if (storage === null) {
      return;
    }

    const checkpointWallets: Record<string, WalletSnapshot> = {};
    for (const [km, wallet] of this.checkpointWallets) {
      checkpointWallets[String(km)] = wallet;
    }

    const shape: ProgressShape = {
      version: CURRENT_VERSION,
      reachedCheckpointsKm: Array.from(this.reachedCheckpointsKm).sort((a, b) => a - b),
      checkpointWallets,
    };

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(shape));
    } catch {
      // Ignore quota or private-mode failures; progress remains in-memory.
    }
  }

  private tryGetStorage(): Storage | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private tryParse(raw: string): ProgressShape | null {
    try {
      const value = JSON.parse(raw) as unknown;
      if (typeof value !== 'object' || value === null) {
        return null;
      }

      const candidate = value as Partial<ProgressShape> & { version?: number };
      if (candidate.version !== 1 && candidate.version !== CURRENT_VERSION) {
        return null;
      }

      if (!Array.isArray(candidate.reachedCheckpointsKm)) {
        return null;
      }

      const values = candidate.reachedCheckpointsKm.filter(
        (item): item is number => typeof item === 'number' && Number.isFinite(item),
      );

      const checkpointWallets: Record<string, WalletSnapshot> = {};
      if (candidate.version === CURRENT_VERSION && typeof candidate.checkpointWallets === 'object' && candidate.checkpointWallets !== null) {
        for (const [key, wallet] of Object.entries(candidate.checkpointWallets)) {
          if (
            typeof wallet === 'object' &&
            wallet !== null &&
            typeof wallet.emeralds === 'number' &&
            typeof wallet.rubies === 'number' &&
            Number.isFinite(wallet.emeralds) &&
            Number.isFinite(wallet.rubies)
          ) {
            checkpointWallets[key] = {
              emeralds: Math.max(0, Math.floor(wallet.emeralds)),
              rubies: Math.max(0, Math.floor(wallet.rubies)),
            };
          }
        }
      }

      return {
        version: CURRENT_VERSION,
        reachedCheckpointsKm: values,
        checkpointWallets,
      };
    } catch {
      return null;
    }
  }
}

export const gameProgress = new GameProgress();
