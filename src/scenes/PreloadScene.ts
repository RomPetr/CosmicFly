import Phaser from 'phaser';
import { SceneKeys } from '../config/assetKeys';

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
    this.scene.start(SceneKeys.Menu);
  }
}
