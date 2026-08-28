import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';
import { shieldAuraConfig } from '../data/gifts';
import { starterShip } from '../data/ships';
import type { Player } from '../entities/Player';

const TWO_PI = Math.PI * 2;
const COLOR_CYCLE_HZ = 0.35;
const WARN_BLINK_HZ = 6;

export class ShieldAura {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly baseScale: number;
  private image: Phaser.GameObjects.Image | null;
  private elapsedMs: number;
  private hitFlashUntilMs: number;

  public constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.elapsedMs = 0;
    this.hitFlashUntilMs = 0;

    if (!scene.textures.exists(TextureKeys.ShieldAura)) {
      throw new Error(`Texture "${TextureKeys.ShieldAura}" is not registered`);
    }

    const visualDiameter =
      starterShip.colliderRadius * shieldAuraConfig.visualRadiusMultiplier * 2;
    this.baseScale = visualDiameter / shieldAuraConfig.textureSize;

    this.image = scene.add.image(player.x, player.y, TextureKeys.ShieldAura);
    this.image
      .setOrigin(0.5, 0.5)
      .setDepth(shieldAuraConfig.depth)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(this.baseScale)
      .setAlpha(shieldAuraConfig.baseAlpha)
      .setVisible(false);
  }

  public update(delta: number): void {
    if (this.image === null || !this.scene.sys.isActive()) {
      return;
    }

    this.elapsedMs += delta;
    const show =
      this.player.hasShield() && this.player.getSprite().visible && this.player.getHealth() > 0;
    this.image.setVisible(show);
    if (!show) {
      return;
    }

    this.image.setPosition(this.player.x, this.player.y);
    this.image.rotation += shieldAuraConfig.rotateRadPerSec * (delta / 1000);

    const pulseWave =
      0.5 + 0.5 * Math.sin((this.elapsedMs / 1000) * (TWO_PI / shieldAuraConfig.pulsePeriodSec));
    const pulseScale =
      shieldAuraConfig.pulseMin +
      (shieldAuraConfig.pulseMax - shieldAuraConfig.pulseMin) * pulseWave;

    const now = this.scene.time.now;
    const flashT =
      this.hitFlashUntilMs > now
        ? (this.hitFlashUntilMs - now) / shieldAuraConfig.hitFlashMs
        : 0;
    const scale = this.baseScale * (pulseScale + flashT * 0.22);
    let alpha = shieldAuraConfig.baseAlpha * (1 + flashT * 0.45);

    const remainingMs = this.player.getShieldRemainingMs();
    if (remainingMs <= shieldAuraConfig.warnMs) {
      const blink =
        0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.elapsedMs * 0.001 * WARN_BLINK_HZ * TWO_PI));
      alpha *= blink;
    }

    const palette = shieldAuraConfig.palette;
    const paletteIndex =
      (0.5 + 0.5 * Math.sin(this.elapsedMs * 0.001 * COLOR_CYCLE_HZ * TWO_PI)) *
      (palette.length - 1);
    const lower = Math.floor(paletteIndex);
    const upper = Math.min(lower + 1, palette.length - 1);
    const t = paletteIndex - lower;
    const colorLower = palette[lower] ?? palette[0]!;
    const colorUpper = palette[upper] ?? colorLower;

    this.image.setTint(lerpRgb(colorLower, colorUpper, t));
    this.image.setScale(scale);
    this.image.setAlpha(alpha);
  }

  public flashHit(): void {
    if (this.image === null || !this.scene.sys.isActive()) {
      return;
    }

    this.hitFlashUntilMs = this.scene.time.now + shieldAuraConfig.hitFlashMs;
  }

  public stop(): void {
    if (this.image !== null) {
      if (this.scene.sys.isActive()) {
        this.image.destroy();
      }
      this.image = null;
    }
    this.hitFlashUntilMs = 0;
  }
}

function lerpRgb(a: number, b: number, t: number): number {
  const clampT = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;

  const r = Math.round(ar + (br - ar) * clampT);
  const g = Math.round(ag + (bg - ag) * clampT);
  const bl = Math.round(ab + (bb - ab) * clampT);

  return (r << 16) | (g << 8) | bl;
}
