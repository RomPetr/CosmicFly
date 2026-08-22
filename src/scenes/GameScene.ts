import Phaser from 'phaser';
import { SceneKeys, SoundKeys } from '../config/assetKeys';
import { starterShip } from '../data/ships';
import { Enemy } from '../entities/Enemy';
import type { Meteor } from '../entities/Meteor';
import { Player, type PlayerHitResult } from '../entities/Player';
import { DebrisBurst } from '../effects/DebrisBurst';
import { MeteorDebrisBurst } from '../effects/MeteorDebrisBurst';
import { AudioManager } from '../managers/AudioManager';
import { InputManager } from '../managers/InputManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemyWeaponSystem } from '../systems/EnemyWeaponSystem';
import { MeteorSystem } from '../systems/MeteorSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { StarfieldSystem } from '../systems/StarfieldSystem';
import { WeaponSystem } from '../systems/WeaponSystem';

export class GameScene extends Phaser.Scene {
  private audioManager!: AudioManager;
  private inputManager!: InputManager;
  private player!: Player;
  private weaponSystem!: WeaponSystem;
  private spawnSystem!: SpawnSystem;
  private enemyWeaponSystem!: EnemyWeaponSystem;
  private starfieldSystem!: StarfieldSystem;
  private meteorSystem!: MeteorSystem;
  private collisionSystem!: CollisionSystem;
  private debrisBurst!: DebrisBurst;
  private meteorDebrisBurst!: MeteorDebrisBurst;
  private hudText!: Phaser.GameObjects.Text;
  private transitioning = false;

  public constructor() {
    super({ key: SceneKeys.Game });
  }

  public create(): void {
    this.transitioning = false;

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x1a2744);
    this.physics.world.setBounds(0, 0, width, height);

    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus();

    this.audioManager = new AudioManager(this);
    this.inputManager = new InputManager(this);
    this.starfieldSystem = new StarfieldSystem(this);
    this.player = new Player(this, width / 2, height / 2, this.inputManager);
    this.weaponSystem = new WeaponSystem(this, this.player, this.inputManager, this.audioManager);
    this.spawnSystem = new SpawnSystem(this, this.player);
    this.enemyWeaponSystem = new EnemyWeaponSystem(
      this,
      this.spawnSystem.getEnemies(),
      this.player,
      this.audioManager,
    );
    this.meteorSystem = new MeteorSystem(this, this.player);
    this.debrisBurst = new DebrisBurst(this);
    this.meteorDebrisBurst = new MeteorDebrisBurst(this);
    this.collisionSystem = new CollisionSystem(
      this,
      this.weaponSystem.getProjectiles(),
      this.enemyWeaponSystem.getProjectiles(),
      this.spawnSystem.getEnemies(),
      this.meteorSystem.getMeteors(),
      this.player,
      this.handleEnemyKilled,
      this.handleMeteorHit,
      this.handlePlayerHit,
    );
    this.spawnSystem.start();
    this.meteorSystem.start();

    this.add
      .text(12, 10, 'Flight in progress', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f4f7fb',
      })
      .setOrigin(0, 0)
      .setDepth(1000);

    this.hudText = this.add
      .text(12, 32, '', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#c5d0dc',
      })
      .setOrigin(0, 0)
      .setDepth(1000);

    const endFlight = this.add
      .text(width - 12, 10, 'End flight', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#7fd4ff',
      })
      .setOrigin(1, 0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });

    endFlight.on('pointerdown', this.goToGameOver, this);
    this.input.keyboard?.on('keydown-ESC', this.goToGameOver, this);
    this.events.on(Phaser.Scenes.Events.PAUSE, this.deactivateEngineThrust, this);
    this.sys.game.events.on(Phaser.Core.Events.BLUR, this.deactivateEngineThrust, this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.audioManager.startFlight();
    this.syncHud();
  }

  public update(_time: number, delta: number): void {
    if (this.transitioning) {
      return;
    }

    this.inputManager.update();
    const wThrustActive = this.inputManager.isWThrustActive();
    this.player.setEngineThrustActive(wThrustActive);
    this.audioManager.updateThrust(wThrustActive);
    this.player.update();
    this.starfieldSystem.update(
      delta,
      this.inputManager.getMoveVector().y,
      this.player.rotation,
    );
    this.meteorSystem.update(delta, this.starfieldSystem.getScrollSpeed());
    this.weaponSystem.update(delta);
    this.spawnSystem.update(delta);
    this.enemyWeaponSystem.update(delta);
    this.debrisBurst.update(delta);
    this.meteorDebrisBurst.update(delta);
    this.syncHud();
  }

  private handleEnemyKilled = (enemy: Enemy): void => {
    this.debrisBurst.spawn(enemy.x, enemy.y);
    enemy.deactivate();
  };

  private handleMeteorHit = (meteor: Meteor, destroyed: boolean): void => {
    if (destroyed) {
      this.meteorDebrisBurst.spawnDestroyed(meteor.x, meteor.y);
      return;
    }

    this.meteorDebrisBurst.spawnHit(meteor.x, meteor.y);
  };

  private handlePlayerHit = (result: PlayerHitResult): void => {
    this.audioManager.playSfx(SoundKeys.PlayerHit);
    if (result.killed) {
      this.goToGameOver();
    }
  };

  private syncHud(): void {
    const distanceKm = Math.floor(this.starfieldSystem.getDistanceKm());
    this.hudText.setText(
      `Hull ${this.player.getHull()}/${starterShip.maxHull}  Shield ${this.player.getShield()}/${starterShip.maxShield}  ${distanceKm} km`,
    );
  }

  private onShutdown(): void {
    this.deactivateEngineThrust();
    this.audioManager.stopFlight();
    this.input.keyboard?.off('keydown-ESC', this.goToGameOver, this);
    this.events.off(Phaser.Scenes.Events.PAUSE, this.deactivateEngineThrust, this);
    this.sys.game.events.off(Phaser.Core.Events.BLUR, this.deactivateEngineThrust, this);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.sys.game.events.off(Phaser.Core.Events.POST_RENDER, this.onPostRenderLeave, this);
    this.starfieldSystem.stop();
  }

  private deactivateEngineThrust(): void {
    this.player.setEngineThrustActive(false);
    this.audioManager.updateThrust(false);
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.deactivateEngineThrust();
    }
  };

  private goToGameOver(): void {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.deactivateEngineThrust();
    this.input.enabled = false;
    this.physics.world.pause();
    this.collisionSystem.stop();
    this.sys.game.events.once(Phaser.Core.Events.POST_RENDER, this.onPostRenderLeave, this);
  }

  private onPostRenderLeave(): void {
    if (!this.sys.isActive() || this.physics.world === undefined) {
      return;
    }

    this.audioManager.stopFlight();
    this.physics.world.resume();
    this.weaponSystem.stop();
    this.enemyWeaponSystem.stop();
    this.spawnSystem.stop();
    this.meteorSystem.stop();
    this.starfieldSystem.stop();
    this.debrisBurst.stop();
    this.meteorDebrisBurst.stop();
    this.scene.start(SceneKeys.GameOver);
  }
}
