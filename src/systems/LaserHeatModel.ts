import { laserHeat } from '../data/laserHeat';

export class LaserHeatModel {
  private heat: number;
  private lockout: boolean;

  public constructor() {
    this.heat = laserHeat.heatMin;
    this.lockout = false;
  }

  public update(deltaMs: number, isPulseHeld: boolean): void {
    if (deltaMs <= 0) {
      return;
    }

    const cooling = this.lockout || !isPulseHeld;
    const rate = cooling ? -laserHeat.heatCoolPerSecond : laserHeat.heatRisePerSecond;
    this.heat = clamp(this.heat + rate * (deltaMs / 1000), laserHeat.heatMin, laserHeat.heatMax);

    if (this.heat >= laserHeat.lockoutEnter) {
      this.lockout = true;
    }
    if (this.heat <= laserHeat.lockoutExit) {
      this.lockout = false;
    }
  }

  public isLockout(): boolean {
    return this.lockout;
  }

  public getHeat(): number {
    return this.heat;
  }

  public getHeatRatio(): number {
    return this.heat / laserHeat.heatMax;
  }

  public canFirePulse(): boolean {
    return !this.lockout;
  }

  public getPulseIntervalMs(): number {
    return lerp(laserHeat.baseIntervalMs, laserHeat.maxIntervalMs, this.getHeatRatio());
  }

  public getFillColor(): number {
    return colorAtRatio(this.getHeatRatio());
  }

  public reset(): void {
    this.heat = laserHeat.heatMin;
    this.lockout = false;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function colorAtRatio(ratio: number): number {
  const stops = laserHeat.colorStops;
  const first = stops[0];
  const last = stops[stops.length - 1];
  const clamped = clamp(ratio, first.ratio, last.ratio);

  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index];
    const to = stops[index + 1];
    if (clamped > to.ratio) {
      continue;
    }

    const span = to.ratio - from.ratio;
    const t = span === 0 ? 0 : (clamped - from.ratio) / span;
    return lerpRgb(from.color, to.color, t);
  }

  return last.color;
}

function lerpRgb(fromColor: number, toColor: number, t: number): number {
  const fromR = (fromColor >> 16) & 0xff;
  const fromG = (fromColor >> 8) & 0xff;
  const fromB = fromColor & 0xff;
  const toR = (toColor >> 16) & 0xff;
  const toG = (toColor >> 8) & 0xff;
  const toB = toColor & 0xff;
  const r = Math.round(lerp(fromR, toR, t));
  const g = Math.round(lerp(fromG, toG, t));
  const b = Math.round(lerp(fromB, toB, t));
  return (r << 16) | (g << 8) | b;
}
