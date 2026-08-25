import Phaser from 'phaser';
import { TextureKeys } from '../config/assetKeys';
import { flightConfig } from '../data/flight';
import { introConfig } from '../data/intro';
import { starterShip } from '../data/ships';
import type { AudioManager } from '../managers/AudioManager';

/** Sprite art points south; this rotation puts the nose on screen-north. */
const NOSE_NORTH_ROTATION = starterShip.angleOffset + flightConfig.northAngleRad;

const TAU = Math.PI * 2;

const IntroPhases = {
  Idle: 'idle',
  Hold: 'hold',
  Launch: 'launch',
  Depart: 'depart',
  AwaitInput: 'await-input',
  Done: 'done',
} as const;

type IntroPhase = (typeof IntroPhases)[keyof typeof IntroPhases];

/**
 * Opening cutscene: a close-up station holds the frame, releases a miniature
 * ship from its lower airlock, then recedes off the bottom edge while the ship
 * grows to full size. Owns its own ship Image so the real Player sprite and
 * collider are never rescaled.
 *
 * Poses are pure functions of elapsed time — no tweens — so a large delta or an
 * early stop cannot leave objects mid-tween after the scene is gone.
 */
export class IntroSequence {
  private readonly scene: Phaser.Scene;
  private readonly audioManager: AudioManager;
  private station: Phaser.GameObjects.Image | null;
  private ship: Phaser.GameObjects.Image | null;
  private prompt: Phaser.GameObjects.Text | null;
  private phase: IntroPhase;
  private elapsedMs: number;
  private launchCueStarted: boolean;
  private shipDepthRaised: boolean;
  private promptPhase: number;

  public constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.station = null;
    this.ship = null;
    this.prompt = null;
    this.phase = IntroPhases.Idle;
    this.elapsedMs = 0;
    this.launchCueStarted = false;
    this.shipDepthRaised = false;
    this.promptPhase = 0;
  }

  public start(): void {
    if (this.phase !== IntroPhases.Idle) {
      return;
    }

    if (!this.scene.textures.exists(TextureKeys.SpaceStation)) {
      throw new Error(`Texture "${TextureKeys.SpaceStation}" is not registered`);
    }
    if (!this.scene.textures.exists(starterShip.textureKey)) {
      throw new Error(`Texture "${starterShip.textureKey}" is not registered`);
    }

    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const introScale = starterShip.scale / introConfig.ship.scaleDivisor;

    this.station = this.scene.add
      .image(centerX, height * introConfig.station.dockedYRatio, TextureKeys.SpaceStation)
      .setOrigin(0.5, 0.5)
      .setScale(introConfig.station.dockedScale)
      .setDepth(introConfig.station.depth);

    // Starts behind the station so the airlock silhouette hides it until launch.
    this.ship = this.scene.add
      .image(centerX, height * introConfig.ship.dockedYRatio, starterShip.textureKey)
      .setOrigin(0.5, 0.5)
      .setScale(introScale)
      .setRotation(NOSE_NORTH_ROTATION)
      .setDepth(introConfig.ship.hiddenDepth);

    this.phase = IntroPhases.Hold;
    this.elapsedMs = 0;
    this.launchCueStarted = false;
    this.shipDepthRaised = false;
    this.promptPhase = 0;
  }

  public update(delta: number): void {
    if (this.phase === IntroPhases.Idle || this.phase === IntroPhases.Done) {
      return;
    }

    this.elapsedMs += Math.min(delta, 100);
    this.resolvePhase();
    this.fireLatchedEvents();
    this.applyPoses();
    this.updatePrompt(delta);
  }

  public isActive(): boolean {
    return (
      this.phase === IntroPhases.Hold ||
      this.phase === IntroPhases.Launch ||
      this.phase === IntroPhases.Depart ||
      this.phase === IntroPhases.AwaitInput
    );
  }

  public isAwaitingInput(): boolean {
    return this.phase === IntroPhases.AwaitInput;
  }

  public stop(): void {
    this.phase = IntroPhases.Done;
    this.audioManager.stopLaunchCue();
    this.destroyVisuals();
  }

  private resolvePhase(): void {
    const { holdMs, launchMs, departMs } = introConfig;
    const launchEnd = holdMs + launchMs;
    const departEnd = launchEnd + departMs;

    if (this.elapsedMs < holdMs) {
      this.phase = IntroPhases.Hold;
      return;
    }

    if (this.elapsedMs < launchEnd) {
      this.phase = IntroPhases.Launch;
      return;
    }

    if (this.elapsedMs < departEnd) {
      this.phase = IntroPhases.Depart;
      return;
    }

    if (this.phase !== IntroPhases.AwaitInput) {
      this.enterAwaitInput();
    }
  }

  private fireLatchedEvents(): void {
    const { holdMs, launchMs } = introConfig;

    if (!this.launchCueStarted && this.elapsedMs >= holdMs) {
      this.launchCueStarted = true;
      this.audioManager.playLaunchCue();
    }

    if (!this.shipDepthRaised && this.elapsedMs >= holdMs + launchMs) {
      this.shipDepthRaised = true;
      this.ship?.setDepth(introConfig.ship.visibleDepth);
    }
  }

  private applyPoses(): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const introScale = starterShip.scale / introConfig.ship.scaleDivisor;
    const { holdMs, launchMs, departMs, station, ship } = introConfig;

    if (this.phase === IntroPhases.Hold) {
      this.station?.setPosition(centerX, height * station.dockedYRatio);
      this.station?.setScale(station.dockedScale);
      this.ship?.setPosition(centerX, height * ship.dockedYRatio);
      this.ship?.setScale(introScale);
      this.ship?.setRotation(NOSE_NORTH_ROTATION);
      return;
    }

    if (this.phase === IntroPhases.Launch) {
      const p = Phaser.Math.Clamp((this.elapsedMs - holdMs) / launchMs, 0, 1);
      const eased = Phaser.Math.Easing.Sine.InOut(p);

      this.station?.setPosition(centerX, height * station.dockedYRatio);
      this.station?.setScale(station.dockedScale);
      this.ship?.setPosition(
        centerX,
        Phaser.Math.Linear(height * ship.dockedYRatio, height * ship.clearedYRatio, eased),
      );
      this.ship?.setScale(introScale);
      this.ship?.setRotation(NOSE_NORTH_ROTATION);
      return;
    }

    if (this.phase === IntroPhases.Depart) {
      const p = Phaser.Math.Clamp((this.elapsedMs - holdMs - launchMs) / departMs, 0, 1);
      const glide = Phaser.Math.Easing.Sine.InOut(p);
      const grow = Phaser.Math.Easing.Quadratic.Out(p);

      this.station?.setPosition(
        centerX,
        Phaser.Math.Linear(height * station.dockedYRatio, height * station.departedYRatio, glide),
      );
      this.station?.setScale(
        Phaser.Math.Linear(station.dockedScale, station.departedScale, glide),
      );
      this.ship?.setPosition(
        centerX,
        Phaser.Math.Linear(height * ship.clearedYRatio, height * ship.settledYRatio, glide),
      );
      this.ship?.setScale(Phaser.Math.Linear(introScale, starterShip.scale, grow));
      this.ship?.setRotation(NOSE_NORTH_ROTATION);
      return;
    }

    if (this.phase === IntroPhases.AwaitInput) {
      this.ship?.setPosition(centerX, height * ship.settledYRatio);
      this.ship?.setScale(starterShip.scale);
      this.ship?.setRotation(NOSE_NORTH_ROTATION);
    }
  }

  private enterAwaitInput(): void {
    this.phase = IntroPhases.AwaitInput;

    if (this.station !== null) {
      if (this.scene.sys.isActive()) {
        this.station.destroy();
      }
      this.station = null;
    }

    if (this.prompt === null) {
      const { width, height } = this.scene.scale;
      const { prompt } = introConfig;
      this.prompt = this.scene.add
        .text(width / 2, height * prompt.yRatio, prompt.text, {
          fontFamily: 'sans-serif',
          fontSize: prompt.fontSize,
          color: prompt.color,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(prompt.depth);
    }
  }

  private updatePrompt(delta: number): void {
    if (this.prompt === null || this.phase !== IntroPhases.AwaitInput) {
      return;
    }

    this.promptPhase += introConfig.prompt.pulseRadPerSec * (delta / 1000);
    if (this.promptPhase > TAU) {
      this.promptPhase -= TAU;
    }

    const wave = 0.5 + 0.5 * Math.sin(this.promptPhase);
    const { minAlpha, maxAlpha } = introConfig.prompt;
    this.prompt.setAlpha(minAlpha + (maxAlpha - minAlpha) * wave);
  }

  private destroyVisuals(): void {
    const active = this.scene.sys.isActive();

    if (this.station !== null) {
      if (active) {
        this.station.destroy();
      }
      this.station = null;
    }

    if (this.ship !== null) {
      if (active) {
        this.ship.destroy();
      }
      this.ship = null;
    }

    if (this.prompt !== null) {
      if (active) {
        this.prompt.destroy();
      }
      this.prompt = null;
    }
  }
}
