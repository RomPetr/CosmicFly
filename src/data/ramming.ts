export type RamSoundKind = 'small' | 'middle' | 'meteor';

export const ramming = {
  playerDamagePercent: 0.1,
  playerMiddleDamagePercent: 0.5,
  enemyDamagePercent: 0.33,
  bubbleSmallEnemyDamagePercent: 0.66,
  bubbleMiddleEnemyDamagePercent: 0.66,
  contactCooldownMs: 400,
  separatePaddingPx: 2,
  playerImpulse: 160,
  enemyImpulse: 180,
  bubblePlayerImpulse: 90,
  bubbleSmallEnemyImpulse: 420,
  bubbleMiddleEnemyImpulse: 210,
  knockbackStunMs: 280,
  bubbleSmallKnockbackStunMs: 520,
  bubbleMiddleKnockbackStunMs: 260,
  bubbleSmallSpinTurns: [1, 1.5, 2],
  meteorShrinkFactor: 0.5,
  middleCharge: {
    cooldownMinMs: 4000,
    cooldownMaxMs: 8000,
    durationMinMs: 1000,
    durationMaxMs: 1200,
    speedMultiplier: 2.1,
    orbitStrength: 0.06,
  },
} as const;

export function playerRamDamage(maxHealth: number): number {
  return Math.round(maxHealth * ramming.playerDamagePercent);
}

export function playerMiddleRamDamage(maxHealth: number): number {
  return Math.round(maxHealth * ramming.playerMiddleDamagePercent);
}

export function enemyRamDamage(maxHull: number): number {
  return Math.round(maxHull * ramming.enemyDamagePercent);
}

export function bubbleSmallEnemyRamDamage(maxHull: number): number {
  return Math.round(maxHull * ramming.bubbleSmallEnemyDamagePercent);
}

export function bubbleMiddleEnemyRamDamage(maxHull: number): number {
  return Math.round(maxHull * ramming.bubbleMiddleEnemyDamagePercent);
}
