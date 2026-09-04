import { afterEach, describe, expect, it } from 'vitest';
import { EquipmentIds } from '../data/shopCatalog';
import { GameProgress } from './GameProgress';

const STORAGE_KEY = 'cosmicfly.progress.v1';

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function installMemoryLocalStorage(): MemoryStorage {
  const store = new Map<string, string>();
  const localStorage: MemoryStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };

  Object.defineProperty(globalThis, 'window', {
    value: { localStorage },
    configurable: true,
    writable: true,
  });

  return localStorage;
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
});

describe('GameProgress', () => {
  it('unlocks Base 100 and overwrites the dock snapshot on later visits', () => {
    const progress = new GameProgress();
    progress.reset();

    const first = progress.recordCheckpoint(100, {
      emeralds: 12,
      rubies: 3,
      diamonds: 0,
      health: 64,
      ownedEquipmentIds: [],
    });
    expect(first).toBe(true);
    expect(progress.getCheckpointSnapshot(100)).toEqual({
      emeralds: 12,
      rubies: 3,
      diamonds: 0,
      health: 64,
      ownedEquipmentIds: [],
    });
    expect(progress.getStartPoints().map((point) => point.displayName)).toEqual([
      'New flight',
      'Continue from Base 100',
    ]);

    const second = progress.recordCheckpoint(100, {
      emeralds: 8,
      rubies: 3,
      diamonds: 0,
      health: 84,
      ownedEquipmentIds: [EquipmentIds.DoublePulseBeam],
    });
    expect(second).toBe(false);
    expect(progress.getCheckpointSnapshot(100)).toEqual({
      emeralds: 8,
      rubies: 3,
      diamonds: 0,
      health: 84,
      ownedEquipmentIds: [EquipmentIds.DoublePulseBeam],
    });
  });

  it('unlocks Base 200 as a separate continue option', () => {
    const progress = new GameProgress();
    progress.reset();
    progress.recordCheckpoint(100, {
      emeralds: 4,
      rubies: 1,
      diamonds: 0,
      health: 80,
      ownedEquipmentIds: [],
    });
    progress.recordCheckpoint(200, {
      emeralds: 20,
      rubies: 6,
      diamonds: 0,
      health: 40,
      ownedEquipmentIds: [],
    });

    expect(progress.getStartPoints().map((point) => point.distanceKm)).toEqual([0, 100, 200]);
    expect(progress.getCheckpointSnapshot(200).emeralds).toBe(20);
  });

  it('migrates v3 snapshots missing diamonds to 0 without wiping checkpoints', () => {
    const localStorage = installMemoryLocalStorage();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 3,
        reachedCheckpointsKm: [100, 200],
        checkpointSnapshots: {
          '100': { emeralds: 12, rubies: 3, health: 64 },
          '200': { emeralds: 20, rubies: 6, health: 40 },
        },
      }),
    );

    const progress = new GameProgress();

    expect(progress.getStartPoints().map((point) => point.distanceKm)).toEqual([0, 100, 200]);
    expect(progress.getCheckpointSnapshot(100)).toEqual({
      emeralds: 12,
      rubies: 3,
      diamonds: 0,
      health: 64,
      ownedEquipmentIds: [],
    });
    expect(progress.getCheckpointSnapshot(200)).toEqual({
      emeralds: 20,
      rubies: 6,
      diamonds: 0,
      health: 40,
      ownedEquipmentIds: [],
    });
  });

  it('migrates v4 snapshots missing ownedEquipmentIds to empty arrays', () => {
    const localStorage = installMemoryLocalStorage();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 4,
        reachedCheckpointsKm: [100],
        checkpointSnapshots: {
          '100': { emeralds: 25, rubies: 2, diamonds: 1, health: 70 },
        },
      }),
    );

    const progress = new GameProgress();

    expect(progress.getCheckpointSnapshot(100)).toEqual({
      emeralds: 25,
      rubies: 2,
      diamonds: 1,
      health: 70,
      ownedEquipmentIds: [],
    });
  });

  it('restores ownedEquipmentIds from v5 snapshots on continue', () => {
    const localStorage = installMemoryLocalStorage();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 5,
        reachedCheckpointsKm: [100],
        checkpointSnapshots: {
          '100': {
            emeralds: 5,
            rubies: 1,
            diamonds: 0,
            health: 90,
            ownedEquipmentIds: [EquipmentIds.DoublePulseBeam],
          },
        },
      }),
    );

    const progress = new GameProgress();

    expect(progress.getCheckpointSnapshot(100).ownedEquipmentIds).toEqual([
      EquipmentIds.DoublePulseBeam,
    ]);
  });
});
