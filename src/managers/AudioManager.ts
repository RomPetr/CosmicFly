import Phaser from 'phaser';
import { SoundKeys, type SoundKey } from '../config/assetKeys';

const VOLUME_PULSE = 0.4;
const VOLUME_MISSILE = 0.5;
const VOLUME_ENEMY_BLASTER = 0.3;
const VOLUME_PLAYER_HIT = 0.5;
const VOLUME_ENGINE_IDLE = 0.16;
const VOLUME_ENGINE_THRUST = 0.38;

type EngineLoop = Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound;

export class AudioManager {
  private readonly scene: Phaser.Scene;
  private idleLoop: EngineLoop | null;
  private thrustLoop: EngineLoop | null;
  private flightActive: boolean;
  private loopsStarted: boolean;
  private thrusting: boolean;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.idleLoop = null;
    this.thrustLoop = null;
    this.flightActive = false;
    this.loopsStarted = false;
    this.thrusting = false;
  }

  public startFlight(): void {
    this.flightActive = true;
    this.startEngineLoops();
  }

  public updateThrust(isThrusting: boolean): void {
    this.thrusting = isThrusting;
    if (this.thrustLoop === null) {
      return;
    }

    this.thrustLoop.volume = isThrusting ? VOLUME_ENGINE_THRUST : 0;
  }

  public playSfx(key: SoundKey): void {
    if (!this.hasAudio(key)) {
      return;
    }

    this.scene.sound.play(key, { volume: this.getSfxVolume(key) });
  }

  public stopFlight(): void {
    this.flightActive = false;
    this.loopsStarted = false;
    this.scene.sound.off(Phaser.Sound.Events.UNLOCKED, this.startEngineLoops, this);
    this.stopLoop(this.idleLoop);
    this.stopLoop(this.thrustLoop);
    this.idleLoop = null;
    this.thrustLoop = null;
  }

  private startEngineLoops(): void {
    if (!this.flightActive || this.loopsStarted) {
      return;
    }

    if (!this.scene.sys.isActive()) {
      return;
    }

    if (this.scene.sound.locked) {
      this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, this.startEngineLoops, this);
      return;
    }

    this.loopsStarted = true;
    this.idleLoop = this.createLoop(SoundKeys.EngineIdle, VOLUME_ENGINE_IDLE);
    this.thrustLoop = this.createLoop(
      SoundKeys.EngineThrust,
      this.thrusting ? VOLUME_ENGINE_THRUST : 0,
    );
  }

  private createLoop(key: SoundKey, volume: number): EngineLoop | null {
    if (!this.hasAudio(key)) {
      return null;
    }

    const sound = this.scene.sound.add(key, { loop: true, volume });
    sound.play();
    return sound;
  }

  private stopLoop(sound: EngineLoop | null): void {
    if (sound === null) {
      return;
    }

    sound.stop();
    sound.destroy();
  }

  private hasAudio(key: SoundKey): boolean {
    return this.scene.cache.audio.exists(key);
  }

  private getSfxVolume(key: SoundKey): number {
    if (key === SoundKeys.RocketLaunch) {
      return VOLUME_MISSILE;
    }

    if (key === SoundKeys.EnemyBlaster) {
      return VOLUME_ENEMY_BLASTER;
    }

    if (key === SoundKeys.PlayerHit) {
      return VOLUME_PLAYER_HIT;
    }

    return VOLUME_PULSE;
  }
}
