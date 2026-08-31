import { describe, expect, it } from 'vitest';
import { laserHeat } from '../data/laserHeat';
import { pulseBeamWeapon } from '../data/weapons';
import { LaserHeatModel } from './LaserHeatModel';

const STEP_MS = 1;
const TIMING_TOLERANCE_MS = 50;

const heatTimeToMaxMs = (laserHeat.heatMax / laserHeat.heatRisePerSecond) * 1000;
const coolLockoutExitMs =
  ((laserHeat.lockoutEnter - laserHeat.lockoutExit) / laserHeat.heatCoolPerSecond) * 1000;

describe('LaserHeatModel', () => {
  it('reaches heat 100 and lockout after heating at 28 per second', () => {
    const model = new LaserHeatModel();
    const elapsedMs = advanceUntil(model, true, () => model.isLockout());

    expect(elapsedMs).toBeGreaterThanOrEqual(heatTimeToMaxMs - TIMING_TOLERANCE_MS);
    expect(elapsedMs).toBeLessThanOrEqual(heatTimeToMaxMs + TIMING_TOLERANCE_MS);
    expect(model.getHeat()).toBe(laserHeat.heatMax);
    expect(model.isLockout()).toBe(true);
    expect(model.canFirePulse()).toBe(false);
  });

  it('keeps lockout true while cooling until heat is at most 80', () => {
    const model = new LaserHeatModel();
    advanceUntil(model, true, () => model.isLockout());

    const partialCoolMs = 400;
    advance(model, partialCoolMs, false);

    expect(model.getHeat()).toBeGreaterThan(laserHeat.lockoutExit);
    expect(model.isLockout()).toBe(true);
    expect(model.canFirePulse()).toBe(false);
  });

  it('exits lockout after cooling from 100 to 80 at 22 per second', () => {
    const model = new LaserHeatModel();
    advanceUntil(model, true, () => model.isLockout());

    const elapsedMs = advanceUntil(model, false, () => !model.isLockout());

    expect(elapsedMs).toBeGreaterThanOrEqual(coolLockoutExitMs - TIMING_TOLERANCE_MS);
    expect(elapsedMs).toBeLessThanOrEqual(coolLockoutExitMs + TIMING_TOLERANCE_MS);
    expect(model.getHeat()).toBeLessThanOrEqual(laserHeat.lockoutExit);
    expect(model.isLockout()).toBe(false);
    expect(model.canFirePulse()).toBe(true);
  });

  it('stays at 0 heat when pulse is not held', () => {
    const model = new LaserHeatModel();
    advance(model, 2000, false);

    expect(model.getHeat()).toBe(laserHeat.heatMin);
    expect(model.isLockout()).toBe(false);
  });

  it('lerps pulse interval from 140 to 420 by heat', () => {
    expect(laserHeat.baseIntervalMs).toBe(pulseBeamWeapon.intervalMs);

    const cold = new LaserHeatModel();
    expect(cold.getPulseIntervalMs()).toBe(laserHeat.baseIntervalMs);

    const mid = heatTo(laserHeat.heatMax * 0.5);
    expect(mid.getHeat()).toBeCloseTo(50, 5);
    expect(mid.getPulseIntervalMs()).toBeCloseTo(280, 5);

    const hot = heatTo(laserHeat.heatMax);
    expect(hot.getHeat()).toBe(laserHeat.heatMax);
    expect(hot.getPulseIntervalMs()).toBe(laserHeat.maxIntervalMs);
  });

  it('lerps fill color across heat stops', () => {
    expect(heatTo(0).getFillColor()).toBe(0x4aa3ff);
    expect(heatTo(laserHeat.heatMax * 0.3).getFillColor()).toBe(0x3ecf6a);
    expect(heatTo(laserHeat.heatMax * 0.6).getFillColor()).toBe(0xf0d44a);
    expect(heatTo(laserHeat.heatMax * 0.9).getFillColor()).toBe(0xff4a3c);
  });

  it('reset clears heat and lockout', () => {
    const model = new LaserHeatModel();
    advanceUntil(model, true, () => model.isLockout());
    model.reset();

    expect(model.getHeat()).toBe(laserHeat.heatMin);
    expect(model.getHeatRatio()).toBe(0);
    expect(model.isLockout()).toBe(false);
    expect(model.canFirePulse()).toBe(true);
  });
});

function heatTo(heat: number): LaserHeatModel {
  const model = new LaserHeatModel();
  if (heat > laserHeat.heatMin) {
    model.update((heat / laserHeat.heatRisePerSecond) * 1000, true);
  }
  return model;
}

function advance(model: LaserHeatModel, durationMs: number, isPulseHeld: boolean): void {
  let elapsed = 0;
  while (elapsed < durationMs) {
    const deltaMs = Math.min(STEP_MS, durationMs - elapsed);
    model.update(deltaMs, isPulseHeld);
    elapsed += deltaMs;
  }
}

function advanceUntil(
  model: LaserHeatModel,
  isPulseHeld: boolean,
  predicate: () => boolean,
  limitMs = 10_000,
): number {
  let elapsed = 0;
  while (!predicate() && elapsed < limitMs) {
    model.update(STEP_MS, isPulseHeld);
    elapsed += STEP_MS;
  }
  return elapsed;
}
