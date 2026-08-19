import Phaser from 'phaser';
import { SceneKeys, SoundKeys, SoundPaths, TextureKeys, TexturePaths } from '../config/assetKeys';

const PROGRESS_BAR_WIDTH = 320;
const PROGRESS_BAR_HEIGHT = 18;

export class PreloadScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Preload });
  }

  public preload(): void {
    this.load.image(TextureKeys.PlayerShip, TexturePaths[TextureKeys.PlayerShip]);
    this.load.image(TextureKeys.StingDart, TexturePaths[TextureKeys.StingDart]);
    this.load.image(TextureKeys.FlareMissile, TexturePaths[TextureKeys.FlareMissile]);

    for (const key of Object.values(SoundKeys)) {
      this.load.audio(key, SoundPaths[key]);
    }

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);

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
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.handleLoadError, this);
    this.createPulseBoltTexture();
    this.scene.start(SceneKeys.Menu);
  }

  private handleLoadError(file: Phaser.Loader.File): void {
    if (file.type !== 'audio') {
      return;
    }

    console.warn(`Failed to load audio "${file.key}" from ${String(file.src)}`);
  }

  private createPulseBoltTexture(): void {
    if (this.textures.exists(TextureKeys.PulseBolt)) {
      return;
    }

    const width = 16;
    const height = 6;
    const radius = height / 2;
    const graphics = this.make.graphics({}, false);

    graphics.fillStyle(0xffb04a, 1);
    graphics.fillRect(radius, 0, width - height, height);
    graphics.fillCircle(radius, radius, radius);
    graphics.fillCircle(width - radius, radius, radius);

    graphics.fillStyle(0xfff6e0, 1);
    graphics.fillRect(radius + 1, 1, width - height - 2, height - 2);
    graphics.fillCircle(radius + 1, radius, radius - 1);
    graphics.fillCircle(width - radius - 1, radius, radius - 1);

    graphics.generateTexture(TextureKeys.PulseBolt, width, height);
    graphics.destroy();
  }
}
