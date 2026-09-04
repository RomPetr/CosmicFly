import Phaser from 'phaser';
import { TextureKeys, type TextureKey } from '../config/assetKeys';

const TAU = Math.PI * 2;
/** Former procedural gem was 26×26 at scale 0.9; +30% → 0.9 * 1.3. */
export const crystalHudIconScale = 0.9 * 1.3;
/** Base station crystal icons: ~1.5× HUD display scale. */
export const crystalBaseIconScale = crystalHudIconScale * 1.5;
/** Native size of the former procedural gem; real art is display-normalized to this. */
export const CRYSTAL_ICON_BASE_PX = 26;
const LABEL_GAP_PX = 8;
const SHIMMER_ALPHA_MIN = 0.85;
const SHIMMER_ALPHA_MAX = 1.0;
const SHIMMER_SCALE_MIN = 0.94;
const SHIMMER_SCALE_MAX = 1.06;

export type CrystalCounterStyle = {
  readonly textureKey: TextureKey;
  readonly labelColor: string;
  readonly angularSpeed: number;
};

export const emeraldCounterStyle: CrystalCounterStyle = {
  textureKey: TextureKeys.CrystalEmerald,
  labelColor: '#c8fbe8',
  angularSpeed: 1.4,
};

export const rubyCounterStyle: CrystalCounterStyle = {
  textureKey: TextureKeys.CrystalRuby,
  labelColor: '#ffc8d1',
  angularSpeed: 1.1,
};

export const diamondCounterStyle: CrystalCounterStyle = {
  textureKey: TextureKeys.CrystalDiamond,
  labelColor: '#e8f4ff',
  angularSpeed: 1.25,
};

export class CrystalCounter {
  private readonly icon: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private readonly angularSpeed: number;
  private readonly baseDisplayPx: number;
  private phase: number;

  public constructor(scene: Phaser.Scene, style: CrystalCounterStyle) {
    if (!scene.textures.exists(style.textureKey)) {
      throw new Error(`Texture "${style.textureKey}" is not registered`);
    }

    this.angularSpeed = style.angularSpeed;
    this.baseDisplayPx = CRYSTAL_ICON_BASE_PX * crystalHudIconScale;
    this.phase = Math.random() * TAU;

    this.icon = scene.add.image(0, 0, style.textureKey);
    this.icon.setOrigin(1, 0.5);
    this.icon.setDisplaySize(this.baseDisplayPx, this.baseDisplayPx);
    this.icon.setDepth(1000);
    this.icon.setBlendMode(Phaser.BlendModes.NORMAL);

    this.label = scene.add.text(0, 0, '0', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: style.labelColor,
    });
    this.label.setOrigin(1, 0.5);
    this.label.setDepth(1000);
  }

  public setPosition(rightX: number, centerY: number): void {
    this.label.setPosition(rightX, centerY);
    this.icon.setPosition(rightX - this.label.width - LABEL_GAP_PX, centerY);
  }

  public setValue(value: number): void {
    const text = String(value);
    if (this.label.text !== text) {
      this.label.setText(text);
    }
  }

  public getRightAnchor(): { readonly x: number; readonly y: number } {
    return { x: this.label.x, y: this.label.y };
  }

  public getIconLeftX(): number {
    return this.icon.x - this.icon.displayWidth;
  }

  public update(delta: number): void {
    this.phase += this.angularSpeed * (delta / 1000);
    if (this.phase > TAU) {
      this.phase -= TAU;
    }

    const wave = 0.5 + 0.5 * Math.sin(this.phase);
    const alpha = SHIMMER_ALPHA_MIN + (SHIMMER_ALPHA_MAX - SHIMMER_ALPHA_MIN) * wave;
    const display =
      this.baseDisplayPx * (SHIMMER_SCALE_MIN + (SHIMMER_SCALE_MAX - SHIMMER_SCALE_MIN) * wave);

    this.icon.setAlpha(alpha);
    this.icon.setDisplaySize(display, display);
  }

  public destroy(): void {
    this.icon.destroy();
    this.label.destroy();
  }
}
