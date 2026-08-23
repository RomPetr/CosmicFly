import Phaser from 'phaser';

export type HealthBarStyle = {
  readonly width: number;
  readonly height: number;
  readonly gapPx: number;
  readonly backgroundColor: number;
  readonly healthyColor: number;
  readonly woundedColor: number;
  readonly woundedRatio: number;
  readonly backgroundDepth: number;
  readonly fillDepth: number;
};

export const enemyHealthBarStyle: HealthBarStyle = {
  width: 30,
  height: 3,
  gapPx: 6,
  backgroundColor: 0x141820,
  healthyColor: 0x3ecf6a,
  woundedColor: 0xe6a23c,
  woundedRatio: 1 / 3,
  backgroundDepth: 6,
  fillDepth: 7,
};

export const playerHealthBarStyle: HealthBarStyle = {
  width: 40,
  height: 4,
  gapPx: 9,
  backgroundColor: 0x101828,
  healthyColor: 0x5fd4ff,
  woundedColor: 0xff6b5c,
  woundedRatio: 0.3,
  backgroundDepth: 8,
  fillDepth: 9,
};

export class HealthBar {
  private readonly style: HealthBarStyle;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;

  public constructor(scene: Phaser.Scene, style: HealthBarStyle) {
    this.style = style;

    this.background = scene.add.rectangle(0, 0, style.width, style.height, style.backgroundColor);
    this.background.setOrigin(0.5, 0.5);
    this.background.setDepth(style.backgroundDepth);
    this.background.setVisible(false);

    this.fill = scene.add.rectangle(0, 0, style.width, style.height, style.healthyColor);
    this.fill.setOrigin(0, 0.5);
    this.fill.setDepth(style.fillDepth);
    this.fill.setVisible(false);
  }

  public setVisible(visible: boolean): void {
    this.background.setVisible(visible);
    this.fill.setVisible(visible);
  }

  public positionAbove(centerX: number, topY: number): void {
    const barY = topY - this.style.gapPx;
    this.background.setPosition(centerX, barY);
    this.fill.setPosition(centerX - this.style.width / 2, barY);
  }

  public setRatio(ratio: number): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    this.fill.width = this.style.width * clamped;
    this.fill.setFillStyle(
      clamped <= this.style.woundedRatio ? this.style.woundedColor : this.style.healthyColor,
    );
  }

  public destroy(): void {
    this.background.destroy();
    this.fill.destroy();
  }
}
