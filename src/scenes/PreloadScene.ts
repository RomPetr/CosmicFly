import Phaser from 'phaser';
import { SceneKeys, TextureKeys } from '../config/assetKeys';

const PROGRESS_BAR_WIDTH = 320;
const PROGRESS_BAR_HEIGHT = 18;

export class PreloadScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Preload });
  }

  public preload(): void {
    const { width, height } = this.scale;
    const barX = width / 2 - PROGRESS_BAR_WIDTH / 2;

    this.add
      .rectangle(width / 2, height / 2, PROGRESS_BAR_WIDTH + 8, PROGRESS_BAR_HEIGHT + 8)
      .setStrokeStyle(2, 0x7fd4ff);

    const bar = this.add
      .rectangle(barX, height / 2, 0, PROGRESS_BAR_HEIGHT, 0x7fd4ff)
      .setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = PROGRESS_BAR_WIDTH * value;
    });

    if (this.load.list.size === 0) {
      bar.width = PROGRESS_BAR_WIDTH;
    }
  }

  public create(): void {
    this.createPlayerShipTexture();
    this.scene.start(SceneKeys.Menu);
  }

  private createPlayerShipTexture(): void {
    if (this.textures.exists(TextureKeys.PlayerShip)) {
      return;
    }

    const size = 48;
    const graphics = this.make.graphics({}, false);

    graphics.fillStyle(0x8fb7d6, 1);
    graphics.fillTriangle(46, 24, 5, 8, 5, 40);

    graphics.fillStyle(0xd7e8f6, 1);
    graphics.fillTriangle(40, 24, 12, 14, 12, 34);

    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(22, 24, 5);

    graphics.fillStyle(0xfff3c4, 1);
    graphics.fillCircle(24, 24, 2.5);

    graphics.generateTexture(TextureKeys.PlayerShip, size, size);
    graphics.destroy();
  }
}
