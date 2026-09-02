import Phaser from 'phaser';
import { SoundKeys, type SoundKey } from '../config/assetKeys';

const VOLUME_PULSE = 0.4;
const VOLUME_MISSILE = 0.5;
const VOLUME_ENEMY_BLASTER = 0.3;
const VOLUME_MIDDLE_ENEMY_BLASTER = 0.42;
const VOLUME_PLAYER_HIT = 0.5;
const VOLUME_PLAYER_EXPLOSION = 0.85;
const VOLUME_SHIP_LAUNCH = 0.55;
const VOLUME_SHIP_BLINK = 0.62;
const VOLUME_GIFT_PICKUP = 0.58;
const VOLUME_SHIP_RAM = 0.55;
const VOLUME_METEOR_RAM = 0.55;
const VOLUME_MIDDLE_RAM = 0.58;
const VOLUME_ENGINE_LOW = 0.14;
const VOLUME_ENGINE_LARGE = 0.2;
const OVERHEAT_HIGH_HZ = 880;
const OVERHEAT_LOW_HZ = 660;
const OVERHEAT_NOTE_MS = 325;
const OVERHEAT_VOLUME = 0.08;

type EngineLoop = Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | Phaser.Sound.NoAudioSound;

export class AudioManager {
  private readonly scene: Phaser.Scene;
  private engineLowLoop: EngineLoop | null;
  private engineLargeLoop: EngineLoop | null;
  private launchCue: EngineLoop | null;
  private flightActive: boolean;
  private loopsPrepared: boolean;
  private waitingForUnlock: boolean;
  private thrusting: boolean;
  private overheatAlarmRequested: boolean;
  private overheatWaitingForUnlock: boolean;
  private overheatOscillator: OscillatorNode | null;
  private overheatGain: GainNode | null;
  private overheatPitchEvent: Phaser.Time.TimerEvent | null;
  private overheatHighTone: boolean;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.engineLowLoop = null;
    this.engineLargeLoop = null;
    this.launchCue = null;
    this.flightActive = false;
    this.loopsPrepared = false;
    this.waitingForUnlock = false;
    this.thrusting = false;
    this.overheatAlarmRequested = false;
    this.overheatWaitingForUnlock = false;
    this.overheatOscillator = null;
    this.overheatGain = null;
    this.overheatPitchEvent = null;
    this.overheatHighTone = true;
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

  public playSfx(key: SoundKey, volume?: number): void {
    if (!this.hasAudio(key)) {
      return;
    }

    this.scene.sound.play(key, { volume: volume ?? this.getSfxVolume(key) });
  }

  public playLaunchCue(): void {
    if (this.launchCue !== null) {
      return;
    }

    if (!this.hasAudio(SoundKeys.ShipLaunch)) {
      return;
    }

    this.launchCue = this.scene.sound.add(SoundKeys.ShipLaunch, {
      volume: VOLUME_SHIP_LAUNCH,
    });
    this.launchCue.play();
  }

  public stopLaunchCue(): void {
    this.destroyLoop(this.launchCue);
    this.launchCue = null;
  }

  public startOverheatAlarm(): void {
    if (this.overheatAlarmRequested) {
      return;
    }

    this.overheatAlarmRequested = true;
    this.tryStartOverheatAlarm();
  }

  public stopOverheatAlarm(): void {
    if (!this.overheatAlarmRequested && this.overheatOscillator === null) {
      return;
    }

    this.overheatAlarmRequested = false;
    this.overheatWaitingForUnlock = false;
    this.scene.sound.off(Phaser.Sound.Events.UNLOCKED, this.tryStartOverheatAlarm, this);
    this.destroyOverheatNodes();
  }

  public stopFlight(): void {
    this.stopOverheatAlarm();
    this.thrusting = false;
    this.flightActive = false;
    this.loopsPrepared = false;
    this.waitingForUnlock = false;
    this.scene.sound.off(Phaser.Sound.Events.UNLOCKED, this.prepareEngineLoops, this);
    this.destroyLoop(this.engineLowLoop);
    this.destroyLoop(this.engineLargeLoop);
    this.destroyLoop(this.launchCue);
    this.engineLowLoop = null;
    this.engineLargeLoop = null;
    this.launchCue = null;
  }

  private tryStartOverheatAlarm(): void {
    if (!this.overheatAlarmRequested || this.overheatOscillator !== null) {
      return;
    }

    if (!this.scene.sys.isActive()) {
      return;
    }

    if (this.scene.sound.locked) {
      if (!this.overheatWaitingForUnlock) {
        this.overheatWaitingForUnlock = true;
        this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, this.tryStartOverheatAlarm, this);
      }
      return;
    }

    this.overheatWaitingForUnlock = false;
    const manager = this.getWebAudioManager();
    if (manager === null || manager.context.state === 'closed') {
      return;
    }

    const oscillator = manager.context.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = OVERHEAT_HIGH_HZ;

    const gain = manager.context.createGain();
    gain.gain.value = OVERHEAT_VOLUME;
    oscillator.connect(gain);
    gain.connect(manager.destination);
    oscillator.start();

    this.overheatOscillator = oscillator;
    this.overheatGain = gain;
    this.overheatHighTone = true;
    this.overheatPitchEvent = this.scene.time.addEvent({
      delay: OVERHEAT_NOTE_MS,
      loop: true,
      callback: this.toggleOverheatPitch,
      callbackScope: this,
    });
  }

  private toggleOverheatPitch(): void {
    if (this.overheatOscillator === null) {
      return;
    }

    this.overheatHighTone = !this.overheatHighTone;
    this.overheatOscillator.frequency.value = this.overheatHighTone
      ? OVERHEAT_HIGH_HZ
      : OVERHEAT_LOW_HZ;
  }

  private destroyOverheatNodes(): void {
    if (this.overheatPitchEvent !== null) {
      this.overheatPitchEvent.remove(false);
      this.overheatPitchEvent = null;
    }

    if (this.overheatOscillator !== null) {
      try {
        this.overheatOscillator.stop();
      } catch {
        // OscillatorNode.stop throws if it has already been stopped.
      }
      this.overheatOscillator.disconnect();
      this.overheatOscillator = null;
    }

    if (this.overheatGain !== null) {
      this.overheatGain.disconnect();
      this.overheatGain = null;
    }

    this.overheatHighTone = true;
  }

  private getWebAudioManager(): Phaser.Sound.WebAudioSoundManager | null {
    const sound = this.scene.sound;
    if (sound instanceof Phaser.Sound.WebAudioSoundManager) {
      return sound;
    }

    return null;
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

    if (key === SoundKeys.Stage2Lance) {
      return VOLUME_MIDDLE_ENEMY_BLASTER;
    }

    if (key === SoundKeys.PlayerHit) {
      return VOLUME_PLAYER_HIT;
    }

    if (key === SoundKeys.PlayerExplosion) {
      return VOLUME_PLAYER_EXPLOSION;
    }

    if (key === SoundKeys.ShipBlink) {
      return VOLUME_SHIP_BLINK;
    }

    if (key === SoundKeys.GiftPickup) {
      return VOLUME_GIFT_PICKUP;
    }

    if (key === SoundKeys.ShipRam) {
      return VOLUME_SHIP_RAM;
    }

    if (key === SoundKeys.MeteorRam) {
      return VOLUME_METEOR_RAM;
    }

    if (key === SoundKeys.MiddleRam) {
      return VOLUME_MIDDLE_RAM;
    }

    return VOLUME_PULSE;
  }
}
