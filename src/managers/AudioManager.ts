import Phaser from 'phaser';
import { SoundKeys, type SoundKey } from '../config/assetKeys';

const VOLUME_PULSE = 0.4;
const VOLUME_MISSILE = 0.5;
const VOLUME_ENEMY_BLASTER = 0.3;
const VOLUME_MIDDLE_ENEMY_BLASTER = 0.42;
const VOLUME_PLAYER_HIT = 0.5;
const VOLUME_PLAYER_EXPLOSION = 0.85;
const VOLUME_ENGINE_LOW = 0.14;
const VOLUME_ENGINE_LARGE = 0.2;

type EngineLoop = Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound;

export class AudioManager {
  private readonly scene: Phaser.Scene;
  private engineLowLoop: EngineLoop | null;
  private engineLargeLoop: EngineLoop | null;
  private flightActive: boolean;
  private loopsPrepared: boolean;
  private waitingForUnlock: boolean;
  private thrusting: boolean;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.engineLowLoop = null;
    this.engineLargeLoop = null;
    this.flightActive = false;
    this.loopsPrepared = false;
    this.waitingForUnlock = false;
    this.thrusting = false;
  }

  public startFlight(): void {
    this.flightActive = true;
    this.thrusting = false;
    this.prepareEngineLoops();
  }

  public updateThrust(isThrusting: boolean): void {
    if (!this.flightActive || this.thrusting === isThrusting) {
      return;
    }

    this.thrusting = isThrusting;
    if (!isThrusting) {
      this.stopEngineLoops();
      return;
    }

    this.prepareEngineLoops();
    this.playEngineLoops();
  }

  public playSfx(key: SoundKey): void {
    if (!this.hasAudio(key)) {
      return;
    }

    this.scene.sound.play(key, { volume: this.getSfxVolume(key) });
  }

  public stopFlight(): void {
    this.thrusting = false;
    this.flightActive = false;
    this.loopsPrepared = false;
    this.waitingForUnlock = false;
    this.scene.sound.off(Phaser.Sound.Events.UNLOCKED, this.prepareEngineLoops, this);
    this.destroyLoop(this.engineLowLoop);
    this.destroyLoop(this.engineLargeLoop);
    this.engineLowLoop = null;
    this.engineLargeLoop = null;
  }

  private prepareEngineLoops(): void {
    if (!this.flightActive || this.loopsPrepared) {
      return;
    }

    if (!this.scene.sys.isActive()) {
      return;
    }

    if (this.scene.sound.locked) {
      if (!this.waitingForUnlock) {
        this.waitingForUnlock = true;
        this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, this.prepareEngineLoops, this);
      }
      return;
    }

    this.waitingForUnlock = false;
    this.loopsPrepared = true;
    this.engineLowLoop = this.createLoop(SoundKeys.EngineLow, VOLUME_ENGINE_LOW);
    this.engineLargeLoop = this.createLoop(SoundKeys.EngineLarge, VOLUME_ENGINE_LARGE);

    if (this.thrusting) {
      this.playEngineLoops();
    }
  }

  private createLoop(key: SoundKey, volume: number): EngineLoop | null {
    if (!this.hasAudio(key)) {
      return null;
    }

    const sound = this.scene.sound.add(key, { loop: true, volume });
    return sound;
  }

  private playEngineLoops(): void {
    this.playLoop(this.engineLowLoop);
    this.playLoop(this.engineLargeLoop);
  }

  private playLoop(sound: EngineLoop | null): void {
    if (sound !== null && !sound.isPlaying) {
      sound.play();
    }
  }

  private stopEngineLoops(): void {
    this.stopLoop(this.engineLowLoop);
    this.stopLoop(this.engineLargeLoop);
  }

  private stopLoop(sound: EngineLoop | null): void {
    if (sound !== null && sound.isPlaying) {
      sound.stop();
    }
  }

  private destroyLoop(sound: EngineLoop | null): void {
    if (sound === null) {
      return;
    }

    if (sound.isPlaying) {
      sound.stop();
    }
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

    if (key === SoundKeys.MiddleEnemyBlaster) {
      return VOLUME_MIDDLE_ENEMY_BLASTER;
    }

    if (key === SoundKeys.PlayerHit) {
      return VOLUME_PLAYER_HIT;
    }

    if (key === SoundKeys.PlayerExplosion) {
      return VOLUME_PLAYER_EXPLOSION;
    }

    return VOLUME_PULSE;
  }
}
