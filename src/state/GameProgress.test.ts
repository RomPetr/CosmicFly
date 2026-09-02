import { describe, expect, it } from 'vitest';
import { GameProgress } from './GameProgress';

describe('GameProgress', () => {
  it('unlocks Base 100 and overwrites the dock snapshot on later visits', () => {
    const progress = new GameProgress();
    progress.reset();

    const first = progress.recordCheckpoint(100, { emeralds: 12, rubies: 3, health: 64 });
    expect(first).toBe(true);
    expect(progress.getCheckpointSnapshot(100)).toEqual({
      emeralds: 12,
      rubies: 3,
      health: 64,
    });
    expect(progress.getStartPoints().map((point) => point.displayName)).toEqual([
      'New flight',
      'Continue from Base 100',
    ]);

    const second = progress.recordCheckpoint(100, { emeralds: 8, rubies: 3, health: 84 });
    expect(second).toBe(false);
    expect(progress.getCheckpointSnapshot(100)).toEqual({
      emeralds: 8,
      rubies: 3,
      health: 84,
    });
  });

  it('unlocks Base 200 as a separate continue option', () => {
    const progress = new GameProgress();
    progress.reset();
    progress.recordCheckpoint(100, { emeralds: 4, rubies: 1, health: 80 });
    progress.recordCheckpoint(200, { emeralds: 20, rubies: 6, health: 40 });

    expect(progress.getStartPoints().map((point) => point.distanceKm)).toEqual([0, 100, 200]);
    expect(progress.getCheckpointSnapshot(200).emeralds).toBe(20);
  });
});
