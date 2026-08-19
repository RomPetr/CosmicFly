import Phaser from 'phaser';
import { SceneKeys } from '../config/assetKeys';
import { gameState } from '../state/GameState';

export class MenuScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Menu });
  }

  public create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0b0d12);

    this.add
      .text(width / 2, height / 2 - 64, 'CosmicFly', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#f4f7fb',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 8, `Best: ${gameState.bestScore}`, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#9aa7b8',
      })
      .setOrigin(0.5);

    const play = this.add
      .text(width / 2, height / 2 + 56, 'Play', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#7fd4ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    play.on('pointerdown', this.startGame, this);
  }

  private startGame(): void {
    this.sound.unlock();
    this.scene.start(SceneKeys.Game);
  }
}
