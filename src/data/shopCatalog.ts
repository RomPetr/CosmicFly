import type { ShopSlotGroupId } from './baseStation';

export const EquipmentIds = {
  DoublePulseBeam: 'double-pulse-beam',
} as const;

export type EquipmentId = (typeof EquipmentIds)[keyof typeof EquipmentIds];

export type ShopItemDef = {
  readonly id: EquipmentId;
  readonly label: string;
  /** Pay by clicking Emerald icon (amount) or Ruby icon (amount) — exclusive. */
  readonly costEmeralds: number;
  readonly costRubies: number;
};

export type ShopSlotDef = {
  readonly item: ShopItemDef | null;
};

export type ShopGroupCatalog = {
  readonly groupId: ShopSlotGroupId;
  readonly slots: readonly ShopSlotDef[];
};

export const DOUBLE_PULSE_BEAM_ITEM: ShopItemDef = {
  id: EquipmentIds.DoublePulseBeam,
  label: 'double pulse-beam',
  costEmeralds: 20,
  costRubies: 5,
};

const emptySlot = (): ShopSlotDef => ({ item: null });

export const shopCatalog: readonly ShopGroupCatalog[] = [
  {
    groupId: 'weapon',
    slots: [{ item: DOUBLE_PULSE_BEAM_ITEM }, emptySlot(), emptySlot()],
  },
  {
    groupId: 'armor',
    slots: [emptySlot(), emptySlot(), emptySlot()],
  },
  {
    groupId: 'engine',
    slots: [emptySlot(), emptySlot(), emptySlot()],
  },
];

export type ShopWalletView = {
  readonly emeralds: number;
  readonly rubies: number;
};

export type ShopSpendChoice = 'emeralds' | 'rubies';

export type ShopPurchaseQuote =
  | { readonly ok: true; readonly spend: ShopSpendChoice; readonly amount: number }
  | { readonly ok: false; readonly reason: 'owned' | 'unaffordable' };

export function canAffordShopItem(item: ShopItemDef, wallet: ShopWalletView): boolean {
  return wallet.emeralds >= item.costEmeralds || wallet.rubies >= item.costRubies;
}

export function canAffordShopSpend(
  item: ShopItemDef,
  wallet: ShopWalletView,
  spend: ShopSpendChoice,
): boolean {
  if (spend === 'emeralds') {
    return wallet.emeralds >= item.costEmeralds;
  }
  return wallet.rubies >= item.costRubies;
}

/** Quote a purchase for an explicit currency click (Emerald or Ruby icon). */
export function quoteShopPurchase(
  item: ShopItemDef,
  wallet: ShopWalletView,
  ownedEquipmentIds: readonly string[],
  spend: ShopSpendChoice,
): ShopPurchaseQuote {
  if (ownedEquipmentIds.includes(item.id)) {
    return { ok: false, reason: 'owned' };
  }

  if (spend === 'emeralds') {
    if (wallet.emeralds >= item.costEmeralds) {
      return { ok: true, spend: 'emeralds', amount: item.costEmeralds };
    }
    return { ok: false, reason: 'unaffordable' };
  }

  if (wallet.rubies >= item.costRubies) {
    return { ok: true, spend: 'rubies', amount: item.costRubies };
  }

  return { ok: false, reason: 'unaffordable' };
}

export function findShopItem(id: string): ShopItemDef | null {
  for (const group of shopCatalog) {
    for (const slot of group.slots) {
      if (slot.item !== null && slot.item.id === id) {
        return slot.item;
      }
    }
  }
  return null;
}
