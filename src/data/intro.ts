/**
 * Launch cutscene layout. Vertical positions are fractions of the view height so
 * the staging keeps working if the canvas size ever changes.
 */
export const introConfig = {
  holdMs: 3000,
  launchMs: 1000,
  departMs: 2600,
  station: {
    /** Close-up framing: top of the station clips the frame edge. */
    dockedYRatio: 0.35,
    dockedScale: 0.55,
    /** Far enough below the bottom edge that the shrunken station is fully gone. */
    departedYRatio: 1.52,
    departedScale: 0.1,
    depth: -11,
  },
  ship: {
    /**
     * Parked just behind the airlock hatch so the silhouette reveal starts on the
     * slow end of the launch easing curve, not mid-flight.
     */
    dockedYRatio: 0.735,
    /** First point below the station outline, where the ship becomes visible. */
    clearedYRatio: 0.926,
    /** Resting spot once the station is gone and the ship is full size. */
    settledYRatio: 0.5,
    /** The ship leaves the airlock at a fifth of its normal size. */
    scaleDivisor: 5,
    hiddenDepth: -12,
    visibleDepth: 5,
  },
  prompt: {
    text: 'Press W A S D to fly',
    pulseRadPerSec: 3.2,
    minAlpha: 0.35,
    maxAlpha: 1,
    yRatio: 0.78,
    depth: 1000,
    fontSize: '22px',
    color: '#7fd4ff',
  },
} as const;
