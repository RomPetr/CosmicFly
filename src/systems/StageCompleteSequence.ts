import Phaser from 'phaser';
import { formatStageCompleteLabel, stageCompleteConfig } from '../data/stageComplete';
import type { AudioManager } from '../managers/AudioManager';

const TAU = Math.PI * 2;

export class StageCompleteSequence {
  private readonly scene: Phaser.Scene;
  private readonly audioManager: AudioManager;
  private root: Phaser.GameObjects.Container | null;
  private title: Phaser.GameObjects.Text | null;
  private elapsedMs: number;
  private pulsePhase: number;
  private active: boolean;

  public constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.root = null;
    this.title = null;
    this.elapsedMs = 0;
    this.pulsePhase = 0;
    this.active = false;
  }

  public start(stageNumber: number): void {
    this.stop();
    this.elapsedMs = 0;
    this.pulsePhase = 0;
    this.active = true;

    const { width, height } = this.scene.scale;
    const layout = stageCompleteConfig;

    this.root = this.scene.add.container(0, 0).setDepth(layout.depth);
    const blocker = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      layout.overlayColor,
      layout.overlayAlpha,
    );
    this.root.add(blocker);

    this.title = this.scene.add
      .text(width / 2, height / 2 - 12, formatStageCompleteLabel(stageNumber), {
        fontFamily: 'sans-serif',
        fontSize: layout.titleFontSize,
        color: layout.titleColor,
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    this.root.add(this.title);

    const subtitle = this.scene.add
      .text(width / 2, height / 2 + 44, 'Approaching base station', {
        fontFamily: 'sans-serif',
        fontSize: layout.subtitleFontSize,
        color: layout.subtitleColor,
      })
      .setOrigin(0.5, 0);
    this.root.add(subtitle);

    this.audioManager.playStageCompleteFanfare(layout.durationMs);
  }

  public update(delta: number): void {
    if (!this.active || this.title === null) {
      return;
    }

    this.elapsedMs += delta;
    this.pulsePhase += stageCompleteConfig.pulseRadPerSec * (delta / 1000);
    if (this.pulsePhase > TAU) {
      this.pulsePhase -= TAU;
    }

    const wave = 0.5 + 0.5 * Math.sin(this.pulsePhase);
    const { minAlpha, maxAlpha } = stageCompleteConfig;
    this.title.setAlpha(minAlpha + (maxAlpha - minAlpha) * wave);
  }

  public isActive(): boolean {
    return this.active;
  }

  public isFinished(): boolean {
    return this.active && this.elapsedMs >= stageCompleteConfig.durationMs;
  }

  public stop(): void {
    this.active = false;
    this.audioManager.stopStageCompleteFanfare();

    if (this.root !== null) {
      if (this.scene.sys.isActive()) {
        this.root.destroy(true);
      }
      this.root = null;
    }

    this.title = null;
    this.elapsedMs = 0;
  }
}
