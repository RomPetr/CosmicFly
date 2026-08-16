import Phaser from 'phaser';
import { SceneKeys } from '../config/assetKeys';

export class GameScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Game });
  }

  public create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x1a2744);

    this.add
      .text(width / 2, height / 2 - 24, 'Flight in progress', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#f4f7fb',
      })
      .setOrigin(0.5);

    const endFlight = this.add
      .text(width / 2, height / 2 + 40, 'End flight', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#7fd4ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    endFlight.on('pointerdown', this.goToGameOver, this);
    this.input.keyboard?.on('keydown-ESC', this.goToGameOver, this);
  }

  private goToGameOver(): void {
    this.scene.start(SceneKeys.GameOver);
  }
}
