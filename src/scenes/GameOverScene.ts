import Phaser from 'phaser';
import { SceneKeys } from '../config/assetKeys';
import { gameState } from '../state/GameState';

export class GameOverScene extends Phaser.Scene {
  private returningToMenu = false;

  public constructor() {
    super({ key: SceneKeys.GameOver });
  }

  public create(): void {
    this.returningToMenu = false;

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x140c14);

    this.add
      .text(width / 2, height / 2 - 56, 'Game Over', {
        fontFamily: 'sans-serif',
        fontSize: '40px',
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

    const menu = this.add
      .text(width / 2, height / 2 + 48, 'Menu', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#7fd4ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menu.on('pointerdown', this.returnToMenu, this);
    this.input.keyboard?.on('keydown-ENTER', this.returnToMenu, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private onShutdown(): void {
    this.input.keyboard?.off('keydown-ENTER', this.returnToMenu, this);
  }

  private returnToMenu(): void {
    if (this.returningToMenu) {
      return;
    }

    this.returningToMenu = true;
    this.scene.start(SceneKeys.Menu);
  }
}
