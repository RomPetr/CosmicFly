import { describe, expect, it } from 'vitest';
import { pulseBeamWeapon } from './weapons';
import { enemyHullRules, hitsToKill, meteorHullDamage } from './enemyHull';
import { luminance01, remapStage2Pixel, stage2MiddlePalette } from './stage2MiddleVisual';

describe('stage2 middle hull', () => {
  const maxHull = 5;

  it('takes five pulse-beam hits to kill', () => {
    expect(hitsToKill(maxHull, pulseBeamWeapon.damage.baseDamage)).toBe(
      enemyHullRules.stage2PulseHitsToKill,
    );
  });

  it('takes two meteor contacts at 50% max hull', () => {
    expect(meteorHullDamage(maxHull)).toBe(2.5);
    expect(meteorHullDamage(maxHull) * enemyHullRules.stage2MeteorHitsToKill).toBe(maxHull);
  });
});

describe('stage2 middle recolor', () => {
  it('keeps bright pixels near white', () => {
    const [r, g, b] = remapStage2Pixel(250, 250, 250, 255);
    expect(luminance01(r, g, b)).toBeGreaterThan(0.9);
    expect(r).toBe(channel(stage2MiddlePalette.white, 16));
  });

  it('maps dark pixels to teal shade', () => {
    expect(remapStage2Pixel(12, 12, 12, 255)).toEqual([
      channel(stage2MiddlePalette.shade, 16),
      channel(stage2MiddlePalette.shade, 8),
      channel(stage2MiddlePalette.shade, 0),
      255,
    ]);
  });
});

function channel(color: number, shift: number): number {
  return (color >> shift) & 0xff;
}
