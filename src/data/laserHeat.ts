import { pulseBeamWeapon } from './weapons';

export type HeatColorStop = {
  readonly ratio: number;
  readonly color: number;
};

export const laserHeat = {
  heatMin: 0,
  heatMax: 100,
  heatRisePerSecond: 28,
  heatCoolPerSecond: 22,
  lockoutEnter: 100,
  lockoutExit: 80,
  /** Matches `pulseBeamWeapon.intervalMs`. */
  baseIntervalMs: pulseBeamWeapon.intervalMs,
  maxIntervalMs: 420,
  colorStops: [
    { ratio: 0.0, color: 0x4aa3ff },
    { ratio: 0.3, color: 0x3ecf6a },
    { ratio: 0.5, color: 0xf0d44a },
    { ratio: 0.7, color: 0xf0d44a },
    { ratio: 0.8, color: 0xff4a3c },
    { ratio: 1.0, color: 0xff4a3c },
  ],
} as const satisfies {
  readonly heatMin: number;
  readonly heatMax: number;
  readonly heatRisePerSecond: number;
  readonly heatCoolPerSecond: number;
  readonly lockoutEnter: number;
  readonly lockoutExit: number;
  readonly baseIntervalMs: number;
  readonly maxIntervalMs: number;
  readonly colorStops: ReadonlyArray<HeatColorStop>;
};
