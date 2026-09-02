export const enemyHullRules = {
  stage2PulseHitsToKill: 5,
  stage2MeteorHitsToKill: 2,
} as const;

export function meteorHullDamage(maxHull: number): number {
  return maxHull / enemyHullRules.stage2MeteorHitsToKill;
}

export function hitsToKill(maxHull: number, damagePerHit: number): number {
  if (damagePerHit <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil(maxHull / damagePerHit);
}
