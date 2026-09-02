import Phaser from 'phaser';
import {
  AnimationKeys,
  ExplosionSheet,
  GiftSheet,
  SceneKeys,
  SoundKeys,
  SoundPaths,
  TextureKeys,
  TexturePaths,
  type AnimationKey,
  type TextureKey,
} from '../config/assetKeys';
import { shieldAuraConfig } from '../data/gifts';
import { stage2Beam } from '../data/stage2Beam';
import { remapStage2Pixel } from '../data/stage2MiddleVisual';
import { starfieldConfig, type StarLayerConfig } from '../data/starfield';

const PROGRESS_BAR_WIDTH = 320;
const PROGRESS_BAR_HEIGHT = 18;

export class PreloadScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Preload });
  }

  public preload(): void {
    this.load.image(TextureKeys.PlayerShip, TexturePaths[TextureKeys.PlayerShip]);
    this.load.image(TextureKeys.StingDart, TexturePaths[TextureKeys.StingDart]);
    this.load.image(TextureKeys.MiddleEnemy, TexturePaths[TextureKeys.MiddleEnemy]);
    this.load.image(TextureKeys.MiddleEnemyStage2, TexturePaths[TextureKeys.MiddleEnemyStage2]);
    this.load.image(TextureKeys.FlareMissile, TexturePaths[TextureKeys.FlareMissile]);
    this.load.image(TextureKeys.AshChunkA, TexturePaths[TextureKeys.AshChunkA]);
    this.load.image(TextureKeys.AshChunkB, TexturePaths[TextureKeys.AshChunkB]);
    this.load.image(TextureKeys.EngineFlame, TexturePaths[TextureKeys.EngineFlame]);
    this.load.image(TextureKeys.SpaceStation, TexturePaths[TextureKeys.SpaceStation]);
    this.load.spritesheet(TextureKeys.Explosion, TexturePaths[TextureKeys.Explosion], {
      frameWidth: ExplosionSheet.frameWidth,
      frameHeight: ExplosionSheet.frameHeight,
    });
    this.load.spritesheet(TextureKeys.GiftHealth, TexturePaths[TextureKeys.GiftHealth], {
      frameWidth: GiftSheet.frameWidth,
      frameHeight: GiftSheet.frameHeight,
    });
    this.load.spritesheet(TextureKeys.GiftShield, TexturePaths[TextureKeys.GiftShield], {
      frameWidth: GiftSheet.frameWidth,
      frameHeight: GiftSheet.frameHeight,
    });

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

    if (
      !this.textures.exists(TextureKeys.AshChunkA) ||
      !this.textures.exists(TextureKeys.AshChunkB)
    ) {
      throw new Error('Ash Chunk meteor textures are not registered');
    }

    if (!this.textures.exists(TextureKeys.MiddleEnemyStage2)) {
      throw new Error('Middle Enemy Stage 2 texture is not registered');
    }

    this.recolorStage2MiddleTexture();
    this.createPulseBoltTexture();
    this.createEnemyBoltTexture();
    this.createStage2BeamTexture();
    this.createStarfieldTextures();
    this.createExplosionAnimation();
    this.createGiftAnimations();
    this.createCrystalGemTexture();
    this.createShieldAuraTexture();
    this.scene.start(SceneKeys.Menu);
  }

  private createCrystalGemTexture(): void {
    if (this.textures.exists(TextureKeys.CrystalGem)) {
      return;
    }

    const size = 26;
    const cx = size / 2;
    const cy = size / 2;
    const halfW = size * 0.32;
    const halfH = size * 0.46;
    const graphics = this.make.graphics({}, false);

    const outline = 0x1a1f28;
    const midBand = 0xffffff;
    const lightBand = 0xffffff;
    const highlight = 0xffffff;

    graphics.fillStyle(outline, 1);
    graphics.fillPoints(
      [
        { x: cx, y: cy - halfH },
        { x: cx + halfW, y: cy },
        { x: cx, y: cy + halfH },
        { x: cx - halfW, y: cy },
      ],
      true,
    );

    const inner = 0.88;
    const iw = halfW * inner;
    const ih = halfH * inner;

    graphics.fillStyle(midBand, 0.55);
    graphics.fillPoints(
      [
        { x: cx, y: cy - ih },
        { x: cx + iw, y: cy },
        { x: cx, y: cy + ih },
        { x: cx - iw, y: cy },
      ],
      true,
    );

    graphics.fillStyle(lightBand, 0.85);
    graphics.fillPoints(
      [
        { x: cx, y: cy - ih },
        { x: cx + iw, y: cy },
        { x: cx, y: cy },
      ],
      true,
    );

    graphics.fillStyle(highlight, 1);
    graphics.fillPoints(
      [
        { x: cx, y: cy - ih * 0.85 },
        { x: cx + iw * 0.3, y: cy - ih * 0.15 },
        { x: cx - iw * 0.3, y: cy - ih * 0.15 },
      ],
      true,
    );

    graphics.generateTexture(TextureKeys.CrystalGem, size, size);
    graphics.destroy();
  }

  private createExplosionAnimation(): void {
    if (
      this.anims.exists(AnimationKeys.Explosion) ||
      !this.textures.exists(TextureKeys.Explosion)
    ) {
      return;
    }

    this.anims.create({
      key: AnimationKeys.Explosion,
      frames: this.anims.generateFrameNumbers(TextureKeys.Explosion, {
        start: 0,
        end: ExplosionSheet.frameCount - 1,
      }),
      frameRate: ExplosionSheet.frameRate,
      repeat: 0,
      hideOnComplete: true,
    });
  }

  private createGiftAnimations(): void {
    this.createLoopingSheetAnimation(
      AnimationKeys.GiftHealth,
      TextureKeys.GiftHealth,
    );
    this.createLoopingSheetAnimation(
      AnimationKeys.GiftShield,
      TextureKeys.GiftShield,
    );
  }

  private createLoopingSheetAnimation(key: AnimationKey, textureKey: TextureKey): void {
    if (this.anims.exists(key) || !this.textures.exists(textureKey)) {
      return;
    }

    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(textureKey, {
        start: 0,
        end: GiftSheet.frameCount - 1,
      }),
      frameRate: GiftSheet.frameRate,
      repeat: -1,
    });
  }

  private createShieldAuraTexture(): void {
    if (this.textures.exists(TextureKeys.ShieldAura)) {
      return;
    }

    const size = shieldAuraConfig.textureSize;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('Cannot create shield aura canvas');
    }

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.46;

    const fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    fill.addColorStop(0, 'rgba(255,255,255,0.20)');
    fill.addColorStop(0.55, 'rgba(255,255,255,0.10)');
    fill.addColorStop(0.82, 'rgba(255,255,255,0.04)');
    fill.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(220,220,220,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 3.5, 0, Math.PI * 2);
    ctx.stroke();

    const specX = cx + radius * 0.38;
    const specY = cy - radius * 0.42;
    const spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, 7);
    spec.addColorStop(0, 'rgba(255,255,255,0.95)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(specX, specY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1.2, -0.9, -0.25);
    ctx.stroke();

    this.textures.addCanvas(TextureKeys.ShieldAura, canvas);
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

  private createEnemyBoltTexture(): void {
    if (this.textures.exists(TextureKeys.EnemyBolt)) {
      return;
    }

    const width = 14;
    const height = 6;
    const radius = height / 2;
    const graphics = this.make.graphics({}, false);

    graphics.fillStyle(0x33264f, 1);
    graphics.fillRect(radius, 0, width - height, height);
    graphics.fillCircle(radius, radius, radius);
    graphics.fillCircle(width - radius, radius, radius);

    graphics.fillStyle(0xc8b8e8, 1);
    graphics.fillRect(radius + 1, 2, width - height - 2, height - 4);
    graphics.fillCircle(radius + 1, radius, radius - 2);
    graphics.fillCircle(width - radius - 1, radius, radius - 2);

    graphics.generateTexture(TextureKeys.EnemyBolt, width, height);
    graphics.destroy();
  }

  private createStage2BeamTexture(): void {
    if (this.textures.exists(TextureKeys.Stage2Beam)) {
      return;
    }

    const width = stage2Beam.textureWidth;
    const height = stage2Beam.textureHeight;
    const radius = height / 2;
    const graphics = this.make.graphics({}, false);

    graphics.fillStyle(stage2Beam.bodyColor, 1);
    graphics.fillRect(radius, 0, width - height, height);
    graphics.fillCircle(radius, radius, radius);
    graphics.fillCircle(width - radius, radius, radius);

    graphics.fillStyle(stage2Beam.coreColor, 1);
    graphics.fillRect(radius + 1, 2, width - height - 2, height - 4);
    graphics.fillCircle(radius + 1, radius, radius - 2);
    graphics.fillCircle(width - radius - 1, radius, radius - 2);

    graphics.generateTexture(TextureKeys.Stage2Beam, width, height);
    graphics.destroy();
  }

  private recolorStage2MiddleTexture(): void {
    const source = this.textures.get(TextureKeys.MiddleEnemyStage2).getSourceImage();
    if (!('width' in source) || !('height' in source)) {
      throw new Error('Middle Enemy Stage 2 source image is missing dimensions');
    }

    const width = source.width;
    const height = source.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context === null) {
      throw new Error('Middle Enemy Stage 2 recolor needs a 2D canvas context');
    }

    context.drawImage(source as CanvasImageSource, 0, 0);
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    for (let index = 0; index < pixels.length; index += 4) {
      const remapped = remapStage2Pixel(
        pixels[index] ?? 0,
        pixels[index + 1] ?? 0,
        pixels[index + 2] ?? 0,
        pixels[index + 3] ?? 0,
      );
      pixels[index] = remapped[0];
      pixels[index + 1] = remapped[1];
      pixels[index + 2] = remapped[2];
      pixels[index + 3] = remapped[3];
    }

    context.putImageData(imageData, 0, 0);
    this.textures.remove(TextureKeys.MiddleEnemyStage2);
    this.textures.addCanvas(TextureKeys.MiddleEnemyStage2, canvas);
  }

  private createStarfieldTextures(): void {
    this.createStarfieldTexture(TextureKeys.StarfieldFar, starfieldConfig.farLayer);
    this.createStarfieldTexture(TextureKeys.StarfieldNear, starfieldConfig.nearLayer);
    this.createTwinkleStarTexture();
  }

  private createStarfieldTexture(key: TextureKey, layer: StarLayerConfig): void {
    if (this.textures.exists(key)) {
      return;
    }

    const { palette } = starfieldConfig;
    const size = layer.textureSize;
    const graphics = this.make.graphics({}, false);

    for (let index = 0; index < layer.starCount; index += 1) {
      const x = Phaser.Math.Between(2, size - 3);
      const y = Phaser.Math.Between(2, size - 3);
      const color = palette[Phaser.Math.Between(0, palette.length - 1)] ?? palette[0];
      const starRadius = Phaser.Math.FloatBetween(
        layer.maxRadius * layer.minRadiusRatio,
        layer.maxRadius,
      );
      const starAlpha = Phaser.Math.FloatBetween(
        layer.maxAlpha * layer.minAlphaRatio,
        layer.maxAlpha,
      );
      graphics.fillStyle(color, starAlpha);
      graphics.fillCircle(x, y, starRadius);
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createTwinkleStarTexture(): void {
    if (this.textures.exists(TextureKeys.TwinkleStar)) {
      return;
    }

    const { textureSize, glowRings, glowCoreAlpha, glowEdgeAlpha } = starfieldConfig.twinkle;
    const center = textureSize / 2;
    const maxRadius = center - 1;
    const graphics = this.make.graphics({}, false);

    // Drawn white so that per-star setTint() can recolour the same texture.
    for (let ring = glowRings; ring >= 1; ring -= 1) {
      const ratio = ring / glowRings;
      const alpha = glowEdgeAlpha + (glowCoreAlpha - glowEdgeAlpha) * (1 - ratio);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(center, center, maxRadius * ratio);
    }

    graphics.generateTexture(TextureKeys.TwinkleStar, textureSize, textureSize);
    graphics.destroy();
  }
}
