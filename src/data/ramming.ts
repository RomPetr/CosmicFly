export const ramming = {
  playerDamagePercent: 0.1,
  enemyDamagePercent: 0.33,
  bubbleSmallEnemyDamagePercent: 0.66,
  contactCooldownMs: 400,
  separatePaddingPx: 2,
  playerImpulse: 160,
  enemyImpulse: 180,
  bubblePlayerImpulse: 90,
  bubbleSmallEnemyImpulse: 420,
  bubbleMiddleEnemyImpulse: 160,
  knockbackStunMs: 280,
  bubbleSmallKnockbackStunMs: 520,
  bubbleSmallSpinTurns: [1, 1.5, 2],
} as const;

export function playerRamDamage(maxHealth: number): number {
  return Math.round(maxHealth * ramming.playerDamagePercent);
}

export function enemyRamDamage(maxHull: number): number {
  return Math.round(maxHull * ramming.enemyDamagePercent);
}

export function bubbleSmallEnemyRamDamage(maxHull: number): number {
  return Math.round(maxHull * ramming.bubbleSmallEnemyDamagePercent);
}
