export const stageCompleteConfig = {
  durationMs: 5000,
  overlayColor: 0x0b0d12,
  overlayAlpha: 0.72,
  depth: 1900,
  titleColor: '#f4f7fb',
  accentColor: '#7fd4ff',
  titleFontSize: '52px',
  subtitleFontSize: '20px',
  subtitleColor: '#9aa7b8',
  pulseRadPerSec: 2.4,
  minAlpha: 0.82,
  maxAlpha: 1,
  fanfareVolume: 0.11,
} as const;

export type StageCompleteFanfareNote = {
  readonly frequencyHz: number;
  readonly startMs: number;
  readonly durationMs: number;
};

/** Short triumphant arpeggio that fits the 5 s base-arrival pause. */
export const stageCompleteFanfare: readonly StageCompleteFanfareNote[] = [
  { frequencyHz: 261.63, startMs: 0, durationMs: 520 },
  { frequencyHz: 329.63, startMs: 280, durationMs: 520 },
  { frequencyHz: 392.0, startMs: 560, durationMs: 520 },
  { frequencyHz: 523.25, startMs: 840, durationMs: 720 },
  { frequencyHz: 392.0, startMs: 1200, durationMs: 900 },
  { frequencyHz: 493.88, startMs: 1500, durationMs: 900 },
  { frequencyHz: 659.25, startMs: 1800, durationMs: 1200 },
  { frequencyHz: 523.25, startMs: 2300, durationMs: 1400 },
  { frequencyHz: 659.25, startMs: 2800, durationMs: 1600 },
  { frequencyHz: 783.99, startMs: 3300, durationMs: 1700 },
];

export function formatStageCompleteLabel(stageNumber: number): string {
  return `Stage ${stageNumber} Complete`;
}
