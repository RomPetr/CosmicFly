import Phaser from 'phaser';
import { SceneKeys } from '../config/assetKeys';
import { gameState } from '../state/GameState';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Boot });
  }

  public create(): void {
    const { width, height } = this.sys.game.config;
    const numericWidth = typeof width === 'number' ? width : Number.parseInt(width, 10);
    const numericHeight = typeof height === 'number' ? height : Number.parseInt(height, 10);

    if (!Number.isFinite(numericWidth) || numericWidth <= 0) {
      throw new Error('Invalid game width');
    }

    if (!Number.isFinite(numericHeight) || numericHeight <= 0) {
      throw new Error('Invalid game height');
    }

    if (gameState.selectedSkinId.length === 0) {
      throw new Error('Selected skin is not set');
    }

    this.scene.start(SceneKeys.Preload);
  }
}
