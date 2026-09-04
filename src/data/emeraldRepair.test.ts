import { describe, expect, it } from 'vitest';
import {
  HEALTH_PERCENT_PER_EMERALD,
  emeraldRepair,
  hullPointsPerEmerald,
  quoteEmeraldRepair,
  quoteEmeraldSell,
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

describe('quoteEmeraldSell', () => {
  it('sells 2% hull for 1 Emerald when hull stays above 0%', () => {
    expect(
      quoteEmeraldSell({
        currentHealth: 40,
        maxHealth: MAX,
      }),
    ).toEqual({ refund: 1, damage: 2, blockedAsSuicide: false });
  });

  it('blocks sell when −2% would leave hull at 0%', () => {
    expect(
      quoteEmeraldSell({
        currentHealth: 2,
        maxHealth: MAX,
      }),
    ).toEqual({ refund: 0, damage: 0, blockedAsSuicide: true });
  });

  it('blocks sell when hull is already at 1% (would go below 0%)', () => {
    expect(
      quoteEmeraldSell({
        currentHealth: 1,
        maxHealth: MAX,
      }),
    ).toEqual({ refund: 0, damage: 0, blockedAsSuicide: true });
  });

  it('allows sell at 4% hull (leaves 2%)', () => {
    expect(
      quoteEmeraldSell({
        currentHealth: 4,
        maxHealth: MAX,
        requestedEmeralds: 1,
      }),
    ).toEqual({ refund: 1, damage: 2, blockedAsSuicide: false });
  });

  it('returns nothing when hull is already empty', () => {
    expect(
      quoteEmeraldSell({
        currentHealth: 0,
        maxHealth: MAX,
      }),
    ).toEqual({ refund: 0, damage: 0, blockedAsSuicide: false });
  });
});
