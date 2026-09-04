import { bases } from '../data/bases';
import { starterShip } from '../data/ships';

const STORAGE_KEY = 'cosmicfly.progress.v1';
const CURRENT_VERSION = 5;

export type WalletSnapshot = {
  readonly emeralds: number;
  readonly rubies: number;
  readonly diamonds: number;
};

export type CheckpointSnapshot = WalletSnapshot & {
  readonly health: number;
  readonly ownedEquipmentIds: string[];
};

type ProgressShape = {
  version: number;
  reachedCheckpointsKm: number[];
  checkpointSnapshots: Record<string, CheckpointSnapshot>;
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

const EMPTY_SNAPSHOT: CheckpointSnapshot = {
  emeralds: 0,
  rubies: 0,
  diamonds: 0,
  health: starterShip.maxHealth,
  ownedEquipmentIds: [],
};

export class GameProgress {
  private reachedCheckpointsKm: Set<number>;
  private checkpointSnapshots: Map<number, CheckpointSnapshot>;

  public constructor() {
    this.reachedCheckpointsKm = new Set<number>();
    this.checkpointSnapshots = new Map<number, CheckpointSnapshot>();
    this.load();
  }

  public hasCheckpoint(km: number): boolean {
    return this.reachedCheckpointsKm.has(km);
  }

  public recordCheckpoint(km: number, snapshot: CheckpointSnapshot): boolean {
    const isNew = !this.reachedCheckpointsKm.has(km);
    this.reachedCheckpointsKm.add(km);
    this.checkpointSnapshots.set(km, sanitizeSnapshot(snapshot));
    this.save();
    return isNew;
  }

  public getCheckpointSnapshot(km: number): CheckpointSnapshot {
    return this.checkpointSnapshots.get(km) ?? EMPTY_SNAPSHOT;
  }

  public getStartPoints(): readonly StartPoint[] {
    const unlocked: StartPoint[] = [NEW_FLIGHT_START];

    for (const base of bases) {
      if (this.reachedCheckpointsKm.has(base.unlockAtKm)) {
        unlocked.push({
          id: `checkpoint-${base.id}`,
          displayName: `Continue from ${base.displayName}`,
          distanceKm: base.unlockAtKm,
        });
      }
    }

    return unlocked;
  }

  public reset(): void {
    this.reachedCheckpointsKm.clear();
    this.checkpointSnapshots.clear();
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
    this.checkpointSnapshots = new Map(
      Object.entries(parsed.checkpointSnapshots).map(([km, snapshot]) => [
        Number(km),
        snapshot,
      ]),
    );
  }

  private save(): void {
    const storage = this.tryGetStorage();
    if (storage === null) {
      return;
    }

    const checkpointSnapshots: Record<string, CheckpointSnapshot> = {};
    for (const [km, snapshot] of this.checkpointSnapshots) {
      checkpointSnapshots[String(km)] = snapshot;
    }

    const shape: ProgressShape = {
      version: CURRENT_VERSION,
      reachedCheckpointsKm: Array.from(this.reachedCheckpointsKm).sort((a, b) => a - b),
      checkpointSnapshots,
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

      const candidate = value as Record<string, unknown>;
      const version = candidate.version;
      if (typeof version !== 'number' || version < 1 || version > CURRENT_VERSION) {
        return null;
      }

      if (!Array.isArray(candidate.reachedCheckpointsKm)) {
        return null;
      }

      const values = candidate.reachedCheckpointsKm.filter(
        (item): item is number => typeof item === 'number' && Number.isFinite(item),
      );

      return {
        version: CURRENT_VERSION,
        reachedCheckpointsKm: values,
        checkpointSnapshots: readSnapshots(candidate, version),
      };
    } catch {
      return null;
    }
  }
}

export const gameProgress = new GameProgress();

function sanitizeSnapshot(snapshot: CheckpointSnapshot): CheckpointSnapshot {
  return {
    emeralds: Math.max(0, Math.floor(snapshot.emeralds)),
    rubies: Math.max(0, Math.floor(snapshot.rubies)),
    diamonds: Math.max(0, Math.floor(snapshot.diamonds)),
    health: Math.max(0, Math.min(starterShip.maxHealth, Math.floor(snapshot.health))),
    ownedEquipmentIds: sanitizeOwnedEquipmentIds(snapshot.ownedEquipmentIds),
  };
}

function sanitizeOwnedEquipmentIds(ids: readonly string[] | undefined): string[] {
  if (!Array.isArray(ids)) {
    return [];
  }

  const unique = new Set<string>();
  for (const id of ids) {
    if (typeof id === 'string' && id.length > 0) {
      unique.add(id);
    }
  }
  return Array.from(unique);
}

function readSnapshots(
  candidate: Record<string, unknown>,
  version: number,
): Record<string, CheckpointSnapshot> {
  const snapshots: Record<string, CheckpointSnapshot> = {};

  if (version === 2) {
    const wallets = candidate.checkpointWallets;
    if (typeof wallets === 'object' && wallets !== null) {
      for (const [key, wallet] of Object.entries(wallets)) {
        const parsed = parseWallet(wallet);
        if (parsed !== null) {
          snapshots[key] = {
            ...parsed,
            health: starterShip.maxHealth,
            ownedEquipmentIds: [],
          };
        }
      }
    }
    return snapshots;
  }

  // v1 has no wallet snapshots; v3+ use checkpointSnapshots (diamonds optional → 0).
  if (version < 3) {
    return snapshots;
  }

  const stored = candidate.checkpointSnapshots;
  if (typeof stored !== 'object' || stored === null) {
    return snapshots;
  }

  for (const [key, snapshot] of Object.entries(stored)) {
    const parsed = parseWallet(snapshot);
    if (parsed === null) {
      continue;
    }

    const healthValue =
      typeof snapshot === 'object' &&
      snapshot !== null &&
      'health' in snapshot &&
      typeof snapshot.health === 'number' &&
      Number.isFinite(snapshot.health)
        ? snapshot.health
        : starterShip.maxHealth;

    const ownedEquipmentIds =
      version >= 5 &&
      typeof snapshot === 'object' &&
      snapshot !== null &&
      'ownedEquipmentIds' in snapshot
        ? sanitizeOwnedEquipmentIds(snapshot.ownedEquipmentIds as string[])
        : [];

    snapshots[key] = {
      ...parsed,
      health: Math.max(0, Math.min(starterShip.maxHealth, Math.floor(healthValue))),
      ownedEquipmentIds,
    };
  }

  return snapshots;
}

function parseWallet(value: unknown): WalletSnapshot | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const wallet = value as { emeralds?: unknown; rubies?: unknown; diamonds?: unknown };
  if (
    typeof wallet.emeralds !== 'number' ||
    typeof wallet.rubies !== 'number' ||
    !Number.isFinite(wallet.emeralds) ||
    !Number.isFinite(wallet.rubies)
  ) {
    return null;
  }

  const diamonds =
    typeof wallet.diamonds === 'number' && Number.isFinite(wallet.diamonds)
      ? wallet.diamonds
      : 0;

  return {
    emeralds: Math.max(0, Math.floor(wallet.emeralds)),
    rubies: Math.max(0, Math.floor(wallet.rubies)),
    diamonds: Math.max(0, Math.floor(diamonds)),
  };
}
