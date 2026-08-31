import { describe, expect, it } from 'vitest';
import { flareMissilesWeapon } from './weapons';

describe('flareMissilesWeapon', () => {
  it('uses compact missile scale 0.76', () => {
    expect(flareMissilesWeapon.scale).toBe(0.76);
  });
});
