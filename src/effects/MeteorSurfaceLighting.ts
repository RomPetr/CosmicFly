import Phaser from 'phaser';

type LightingLayerConfig = {
  readonly color: number;
  readonly widthRatio: number;
  readonly heightRatio: number;
  /** Orbit radius multiplier relative to the shared orbit. */
  readonly orbitScale: number;
  readonly baseAlpha: number;
  readonly alphaPulse: number;
  readonly depthOffset: number;
  readonly additive: boolean;
  /** `1` keeps the layer on the lit side, `-1` on the shadowed side. */
  readonly side: 1 | -1;
};

type LightingLayer = {
  readonly config: LightingLayerConfig;
  readonly ellipse: Phaser.GameObjects.Ellipse;
};

/**
 * Ratios are relative to the meteor silhouette diameter. The rock covers about
 * 0.36 of it around the centre, so `orbitRatio * orbitScale + sizeRatio / 2`
 * must stay under that value to keep every layer inside the silhouette.
 */
const ORBIT_X_RATIO = 0.12;
const ORBIT_Y_RATIO = 0.09;
const MIN_ORBIT_SPEED = 0.9;
const MAX_ORBIT_SPEED = 1.7;
const LAYER_SPIN_FACTOR = 0.25;
const ALPHA_PULSE_FREQUENCY = 2;

const SHADOW_LAYER: LightingLayerConfig = {
  color: 0x17110d,
  widthRatio: 0.44,
  heightRatio: 0.36,
  orbitScale: 1,
  baseAlpha: 0.44,
  alphaPulse: 0.05,
  depthOffset: 0.1,
  additive: false,
  side: -1,
};

const TERMINATOR_LAYER: LightingLayerConfig = {
  color: 0xd8c6aa,
  widthRatio: 0.34,
  heightRatio: 0.26,
  orbitScale: 1,
  baseAlpha: 0.3,
  alphaPulse: 0.05,
  depthOffset: 0.2,
  additive: true,
  side: 1,
};

const SPECULAR_LAYER: LightingLayerConfig = {
  color: 0xfff2d8,
  widthRatio: 0.14,
  heightRatio: 0.1,
  orbitScale: 1.5,
  baseAlpha: 0.4,
  alphaPulse: 0.06,
  depthOffset: 0.3,
  additive: true,
  side: 1,
};

const LAYER_CONFIGS: readonly LightingLayerConfig[] = [
  SHADOW_LAYER,
  TERMINATOR_LAYER,
  SPECULAR_LAYER,
];

export class MeteorSurfaceLighting {
  private readonly layers: readonly LightingLayer[];
  private phase: number;
  private orbitSpeed: number;
  private orbitX: number;
  private orbitY: number;

  public constructor(scene: Phaser.Scene) {
    this.layers = LAYER_CONFIGS.map((config) => {
      const ellipse = scene.add.ellipse(0, 0, 1, 1, config.color, config.baseAlpha);
      ellipse.setVisible(false);
      if (config.additive) {
        ellipse.setBlendMode(Phaser.BlendModes.ADD);
      }
      return { config, ellipse };
    });

    this.phase = 0;
    this.orbitSpeed = 0;
    this.orbitX = 0;
    this.orbitY = 0;
  }

  public activate(
    x: number,
    y: number,
    displayWidth: number,
    displayHeight: number,
    spriteDepth: number,
  ): void {
    const diameter = Math.min(displayWidth, displayHeight);
    const direction = Math.random() < 0.5 ? -1 : 1;

    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.orbitSpeed = Phaser.Math.FloatBetween(MIN_ORBIT_SPEED, MAX_ORBIT_SPEED) * direction;
    this.orbitX = diameter * ORBIT_X_RATIO;
    this.orbitY = diameter * ORBIT_Y_RATIO;

    for (const { config, ellipse } of this.layers) {
      ellipse.setDisplaySize(diameter * config.widthRatio, diameter * config.heightRatio);
      ellipse.setDepth(spriteDepth + config.depthOffset);
      ellipse.setVisible(true);
    }

    this.update(0, x, y);
  }

  public update(delta: number, x: number, y: number): void {
    this.phase += this.orbitSpeed * (delta / 1000);

    const offsetX = Math.cos(this.phase) * this.orbitX;
    const offsetY = Math.sin(this.phase) * this.orbitY;
    const pulse = Math.sin(this.phase * ALPHA_PULSE_FREQUENCY);
    const rotation = this.phase * LAYER_SPIN_FACTOR;

    for (const { config, ellipse } of this.layers) {
      const shift = config.side * config.orbitScale;
      ellipse.setPosition(x + offsetX * shift, y + offsetY * shift);
      ellipse.setRotation(rotation);
      ellipse.setAlpha(config.baseAlpha + pulse * config.alphaPulse * config.side);
    }
  }

  public deactivate(): void {
    for (const { ellipse } of this.layers) {
      ellipse.setVisible(false);
    }
  }
}
