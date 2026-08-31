import Phaser from 'phaser';
import type { LaserHeatState } from '../systems/WeaponSystem';

const BAR_WIDTH = 320;
const BAR_HEIGHT = 12;
const BAR_BOTTOM_MARGIN_PX = 18;
const BACKGROUND_COLOR = 0x101828;
const HUD_DEPTH = 1000;
const WARNING_TEXT = 'Laser Too Hot!';
const WARNING_COLOR = '#ff6b5c';
const WARNING_FONT_SIZE = '16px';
const WARNING_GAP_PX = 8;

export class LaserHeatBar {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly warning: Phaser.GameObjects.Text;
  private barVisible = false;
  private lockout = false;

  public constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    const centerX = width / 2;
    const barY = height - BAR_BOTTOM_MARGIN_PX - BAR_HEIGHT / 2;
    const fillLeftX = centerX - BAR_WIDTH / 2;
    const warningY = barY - BAR_HEIGHT / 2 - WARNING_GAP_PX;

    this.background = scene.add.rectangle(centerX, barY, BAR_WIDTH, BAR_HEIGHT, BACKGROUND_COLOR);
    this.background.setOrigin(0.5, 0.5);
    this.background.setScrollFactor(0);
    this.background.setDepth(HUD_DEPTH);

    this.fill = scene.add.rectangle(fillLeftX, barY, 0, BAR_HEIGHT, BACKGROUND_COLOR);
    this.fill.setOrigin(0, 0.5);
    this.fill.setScrollFactor(0);
    this.fill.setDepth(HUD_DEPTH);

    this.warning = scene.add.text(centerX, warningY, WARNING_TEXT, {
      fontFamily: 'sans-serif',
      fontSize: WARNING_FONT_SIZE,
      color: WARNING_COLOR,
    });
    this.warning.setOrigin(0.5, 1);
    this.warning.setScrollFactor(0);
    this.warning.setDepth(HUD_DEPTH);

    this.setVisible(false);
  }

  public setVisible(visible: boolean): void {
    this.barVisible = visible;
    this.background.setVisible(visible);
    this.fill.setVisible(visible);
    this.warning.setVisible(visible && this.lockout);
  }

  public update(state: LaserHeatState): void {
    this.lockout = state.lockout;
    this.fill.width = BAR_WIDTH * state.heatRatio;
    this.fill.setFillStyle(state.fillColor);
    this.warning.setVisible(this.barVisible && state.lockout);
  }

  public destroy(): void {
    this.background.destroy();
    this.fill.destroy();
    this.warning.destroy();
  }
}
