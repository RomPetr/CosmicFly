/** 50 Emeralds restore 100% hull, so each Emerald is worth 2% of maxHealth. */
export const emeraldRepair = {
  emeraldsForFullHealth: 50,
  packSmall: 1,
  packLarge: 10,
} as const;

export const HEALTH_PERCENT_PER_EMERALD =
  100 / emeraldRepair.emeraldsForFullHealth;

export type EmeraldRepairQuote = {
  readonly spend: number;
  readonly heal: number;
};

export type EmeraldRepairRequest = {
  readonly emeralds: number;
  readonly currentHealth: number;
  readonly maxHealth: number;
  readonly requestedEmeralds: number;
};

export function hullPointsPerEmerald(maxHealth: number): number {
  return (HEALTH_PERCENT_PER_EMERALD / 100) * maxHealth;
}

export function quoteEmeraldRepair(request: EmeraldRepairRequest): EmeraldRepairQuote {
  const maxHealth = Math.max(0, request.maxHealth);
  const currentHealth = Math.max(0, Math.min(maxHealth, request.currentHealth));
  const missing = maxHealth - currentHealth;
  const wallet = Math.max(0, Math.floor(request.emeralds));
  const requested = Math.max(0, Math.floor(request.requestedEmeralds));
  const perEmerald = hullPointsPerEmerald(maxHealth);

  if (missing <= 0 || wallet <= 0 || requested <= 0 || perEmerald <= 0) {
    return { spend: 0, heal: 0 };
  }

  const needed = Math.ceil(missing / perEmerald);
  const spend = Math.min(requested, wallet, needed);
  const heal = Math.min(missing, spend * perEmerald);

  return { spend, heal };
}

export type EmeraldSellRequest = {
  readonly currentHealth: number;
  readonly maxHealth: number;
  /** Hull sold for this many Emeralds (default: packSmall = 1 → −2%). */
  readonly requestedEmeralds?: number;
};

export type EmeraldSellQuote = {
  readonly refund: number;
  readonly damage: number;
  /** True when the sale would leave hull at ≤ 0%. */
  readonly blockedAsSuicide: boolean;
};

/**
 * Sell hull for Emeralds (−2% per Emerald). Refuses any sale that would leave ≤ 0% hull.
 */
export function quoteEmeraldSell(request: EmeraldSellRequest): EmeraldSellQuote {
  const maxHealth = Math.max(0, request.maxHealth);
  const currentHealth = Math.max(0, Math.min(maxHealth, request.currentHealth));
  const requested = Math.max(
    0,
    Math.floor(request.requestedEmeralds ?? emeraldRepair.packSmall),
  );
  const perEmerald = hullPointsPerEmerald(maxHealth);

  if (requested <= 0 || perEmerald <= 0 || currentHealth <= 0) {
    return { refund: 0, damage: 0, blockedAsSuicide: false };
  }

  const damage = requested * perEmerald;
  if (currentHealth - damage <= 0) {
    return { refund: 0, damage: 0, blockedAsSuicide: true };
  }

  return { refund: requested, damage, blockedAsSuicide: false };
}
