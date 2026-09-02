import { describe, expect, it } from 'vitest';
import {
  HEALTH_PERCENT_PER_EMERALD,
  emeraldRepair,
  hullPointsPerEmerald,
  quoteEmeraldRepair,
} from './emeraldRepair';

const MAX = 100;

describe('emeraldRepair', () => {
  it('prices full hull at 50 Emeralds (2% each)', () => {
    expect(emeraldRepair.emeraldsForFullHealth).toBe(50);
    expect(HEALTH_PERCENT_PER_EMERALD).toBe(2);
    expect(hullPointsPerEmerald(MAX)).toBe(2);
  });

  it('quotes 1 Emerald as +2 hull points', () => {
    expect(
      quoteEmeraldRepair({
        emeralds: 12,
        currentHealth: 40,
        maxHealth: MAX,
        requestedEmeralds: 1,
      }),
    ).toEqual({ spend: 1, heal: 2 });
  });

  it('quotes 10 Emeralds as +20% hull', () => {
    expect(
      quoteEmeraldRepair({
        emeralds: 30,
        currentHealth: 40,
        maxHealth: MAX,
        requestedEmeralds: 10,
      }),
    ).toEqual({ spend: 10, heal: 20 });
  });

  it('quotes 50 Emeralds as a full refill from empty', () => {
    expect(
      quoteEmeraldRepair({
        emeralds: 50,
        currentHealth: 0,
        maxHealth: MAX,
        requestedEmeralds: 50,
      }),
    ).toEqual({ spend: 50, heal: 100 });
  });

  it('does not overheal or overspend when hull is almost full', () => {
    expect(
      quoteEmeraldRepair({
        emeralds: 40,
        currentHealth: 97,
        maxHealth: MAX,
        requestedEmeralds: 10,
      }),
    ).toEqual({ spend: 2, heal: 3 });
  });

  it('spends only what the wallet holds', () => {
    expect(
      quoteEmeraldRepair({
        emeralds: 4,
        currentHealth: 10,
        maxHealth: MAX,
        requestedEmeralds: 10,
      }),
    ).toEqual({ spend: 4, heal: 8 });
  });

  it('returns nothing at full health or empty wallet', () => {
    expect(
      quoteEmeraldRepair({
        emeralds: 20,
        currentHealth: 100,
        maxHealth: MAX,
        requestedEmeralds: 10,
      }),
    ).toEqual({ spend: 0, heal: 0 });

    expect(
      quoteEmeraldRepair({
        emeralds: 0,
        currentHealth: 50,
        maxHealth: MAX,
        requestedEmeralds: 10,
      }),
    ).toEqual({ spend: 0, heal: 0 });
  });
});
