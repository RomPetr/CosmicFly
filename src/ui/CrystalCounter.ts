import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';

const TAU = Math.PI * 2;
const ICON_SCALE = 0.9;
const LABEL_GAP_PX = 8;
const SHIMMER_ALPHA_MIN = 0.85;
const SHIMMER_ALPHA_MAX = 1.0;
const SHIMMER_SCALE_MIN = 0.94;
const SHIMMER_SCALE_MAX = 1.06;

export type CrystalCounterStyle = {
  readonly palette: readonly number[];
  readonly labelColor: string;
  readonly angularSpeed: number;
};

export const emeraldCounterStyle: CrystalCounterStyle = {
  palette: [0xf6fff8, 0x9ffbe4, 0x63dcff, 0x35d38a, 0x9ffbe4],
  labelColor: '#c8fbe8',
  angularSpeed: 1.4,
};

export const rubyCounterStyle: CrystalCounterStyle = {
  palette: [0xfff2f4, 0xffb0c8, 0xff4d6a, 0xd6294a, 0xffb0c8],
  labelColor: '#ffc8d1',
  angularSpeed: 1.1,
};

export class CrystalCounter {
  private readonly icon: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private readonly palette: readonly number[];
  private readonly angularSpeed: number;
  private phase: number;

  public constructor(scene: Phaser.Scene, style: CrystalCounterStyle) {
    if (!scene.textures.exists(TextureKeys.CrystalGem)) {
      throw new Error(`Texture "${TextureKeys.CrystalGem}" is not registered`);
    }

    this.palette = style.palette;
    this.angularSpeed = style.angularSpeed;
    this.phase = Math.random() * TAU;

    this.icon = scene.add.image(0, 0, TextureKeys.CrystalGem);
    this.icon.setOrigin(1, 0.5);
    this.icon.setScale(ICON_SCALE);
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
    const paletteIndex = wave * (this.palette.length - 1);
    const lower = Math.floor(paletteIndex);
    const upper = Math.min(lower + 1, this.palette.length - 1);
    const t = paletteIndex - lower;
    const colorLower = this.palette[lower] ?? this.palette[0]!;
    const colorUpper = this.palette[upper] ?? colorLower;

    const tint = lerpRgb(colorLower, colorUpper, t);
    const alpha = SHIMMER_ALPHA_MIN + (SHIMMER_ALPHA_MAX - SHIMMER_ALPHA_MIN) * wave;
    const scale = ICON_SCALE * (SHIMMER_SCALE_MIN + (SHIMMER_SCALE_MAX - SHIMMER_SCALE_MIN) * wave);

    this.icon.setTint(tint);
    this.icon.setAlpha(alpha);
    this.icon.setScale(scale);
  }

  public destroy(): void {
    this.icon.destroy();
    this.label.destroy();
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
