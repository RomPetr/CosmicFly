import { describe, expect, it } from 'vitest';
import {
  DOUBLE_PULSE_BEAM_ITEM,
  EquipmentIds,
  canAffordShopItem,
  canAffordShopSpend,
  findShopItem,
  quoteShopPurchase,
} from './shopCatalog';

describe('shopCatalog', () => {
  it('quotes emerald spend only when clicking Emerald path', () => {
    const quote = quoteShopPurchase(
      DOUBLE_PULSE_BEAM_ITEM,
      { emeralds: 20, rubies: 5 },
      [],
      'emeralds',
    );
    expect(quote).toEqual({ ok: true, spend: 'emeralds', amount: 20 });
  });

  it('quotes ruby spend only when clicking Ruby path', () => {
    const quote = quoteShopPurchase(
      DOUBLE_PULSE_BEAM_ITEM,
      { emeralds: 19, rubies: 5 },
      [],
      'rubies',
    );
    expect(quote).toEqual({ ok: true, spend: 'rubies', amount: 5 });
  });

  it('rejects emerald click when short on emeralds even if rubies suffice', () => {
    expect(
      quoteShopPurchase(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 19, rubies: 5 }, [], 'emeralds'),
    ).toEqual({ ok: false, reason: 'unaffordable' });
  });

  it('rejects unaffordable and already-owned purchases', () => {
    expect(
      quoteShopPurchase(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 0, rubies: 4 }, [], 'rubies'),
    ).toEqual({ ok: false, reason: 'unaffordable' });

    expect(
      quoteShopPurchase(
        DOUBLE_PULSE_BEAM_ITEM,
        { emeralds: 99, rubies: 99 },
        [EquipmentIds.DoublePulseBeam],
        'emeralds',
      ),
    ).toEqual({ ok: false, reason: 'owned' });
  });

  it('reports affordability helpers and catalog lookup', () => {
    expect(canAffordShopItem(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 20, rubies: 0 })).toBe(true);
    expect(canAffordShopItem(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 0, rubies: 5 })).toBe(true);
    expect(canAffordShopItem(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 19, rubies: 4 })).toBe(false);
    expect(canAffordShopSpend(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 20, rubies: 0 }, 'emeralds')).toBe(
      true,
    );
    expect(canAffordShopSpend(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 19, rubies: 5 }, 'emeralds')).toBe(
      false,
    );
    expect(canAffordShopSpend(DOUBLE_PULSE_BEAM_ITEM, { emeralds: 0, rubies: 5 }, 'rubies')).toBe(
      true,
    );
    expect(findShopItem(EquipmentIds.DoublePulseBeam)?.label).toBe('double pulse-beam');
    expect(findShopItem('missing')).toBeNull();
  });
});
