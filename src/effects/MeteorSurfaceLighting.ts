import Phaser from 'phaser';

const HIGHLIGHT_COLOR = 0xd8c6aa;
const SHADOW_COLOR = 0x241f1c;
const HIGHLIGHT_WIDTH_RATIO = 0.26;
const HIGHLIGHT_HEIGHT_RATIO = 0.18;
const SHADOW_WIDTH_RATIO = 0.4;
const SHADOW_HEIGHT_RATIO = 0.3;
const ORBIT_X_RATIO = 0.16;
const ORBIT_Y_RATIO = 0.12;
const MIN_ORBIT_SPEED = 0.9;
const MAX_ORBIT_SPEED = 1.7;
const HIGHLIGHT_BASE_ALPHA = 0.25;
const HIGHLIGHT_ALPHA_PULSE = 0.04;
const SHADOW_BASE_ALPHA = 0.28;
const SHADOW_ALPHA_PULSE = 0.04;

export class MeteorSurfaceLighting {
  private readonly highlight: Phaser.GameObjects.Ellipse;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private phase: number;
  private orbitSpeed: number;
  private orbitX: number;
  private orbitY: number;

  public constructor(scene: Phaser.Scene) {
    this.shadow = scene.add.ellipse(0, 0, 1, 1, SHADOW_COLOR, SHADOW_BASE_ALPHA);
    this.highlight = scene.add.ellipse(0, 0, 1, 1, HIGHLIGHT_COLOR, HIGHLIGHT_BASE_ALPHA);
    this.phase = 0;
    this.orbitSpeed = 0;
    this.orbitX = 0;
    this.orbitY = 0;

    this.shadow.setVisible(false);
    this.highlight.setVisible(false);
    this.highlight.setBlendMode(Phaser.BlendModes.ADD);
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

    this.highlight.setDisplaySize(
      diameter * HIGHLIGHT_WIDTH_RATIO,
      diameter * HIGHLIGHT_HEIGHT_RATIO,
    );
    this.shadow.setDisplaySize(diameter * SHADOW_WIDTH_RATIO, diameter * SHADOW_HEIGHT_RATIO);
    this.shadow.setDepth(spriteDepth + 0.1);
    this.highlight.setDepth(spriteDepth + 0.2);
    this.shadow.setVisible(true);
    this.highlight.setVisible(true);
    this.update(0, x, y);
  }

  public update(delta: number, x: number, y: number): void {
    this.phase += this.orbitSpeed * (delta / 1000);

    const orbitCos = Math.cos(this.phase);
    const orbitSin = Math.sin(this.phase);
    const pulse = Math.sin(this.phase * 2);
    const offsetX = orbitCos * this.orbitX;
    const offsetY = orbitSin * this.orbitY;

    this.highlight.setPosition(x + offsetX, y + offsetY);
    this.shadow.setPosition(x - offsetX, y - offsetY);
    this.highlight.setRotation(this.phase * 0.25);
    this.shadow.setRotation(this.phase * 0.25);
    this.highlight.setAlpha(HIGHLIGHT_BASE_ALPHA + pulse * HIGHLIGHT_ALPHA_PULSE);
    this.shadow.setAlpha(SHADOW_BASE_ALPHA - pulse * SHADOW_ALPHA_PULSE);
  }

  public deactivate(): void {
    this.highlight.setVisible(false);
    this.shadow.setVisible(false);
  }
}
