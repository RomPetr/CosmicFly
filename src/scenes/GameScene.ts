import Phaser from 'phaser';
import { SceneKeys, SoundKeys } from '../config/assetKeys';
import { bases } from '../data/bases';
import { Enemy } from '../entities/Enemy';
import type { Meteor } from '../entities/Meteor';
import { Player, type PlayerHitResult } from '../entities/Player';
import { DebrisBurst, playerDebrisConfig } from '../effects/DebrisBurst';
import { ExplosionEffect } from '../effects/ExplosionEffect';
import { MeteorDebrisBurst } from '../effects/MeteorDebrisBurst';
import { AudioManager } from '../managers/AudioManager';
import { InputManager } from '../managers/InputManager';
import { WalletManager } from '../managers/WalletManager';
import { gameProgress } from '../state/GameProgress';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemyWeaponSystem } from '../systems/EnemyWeaponSystem';
import { IntroSequence } from '../systems/IntroSequence';
import { MeteorSystem } from '../systems/MeteorSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { StarfieldSystem } from '../systems/StarfieldSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import {
  CrystalCounter,
  emeraldCounterStyle,
  rubyCounterStyle,
} from '../ui/CrystalCounter';

const DEATH_TO_GAME_OVER_MS = 1500;
const DEATH_SHAKE_MS = 280;
const DEATH_SHAKE_INTENSITY = 0.009;
const HUD_TOP_ROW_Y = 20;
const HUD_RIGHT_MARGIN_PX = 12;
const HUD_COUNTER_SPACING_PX = 24;

export type GameSceneStartData = {
  readonly startKm?: number;
};

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
  private playerDebrisBurst!: DebrisBurst;
  private playerExplosion!: ExplosionEffect;
  private intro!: IntroSequence;
  private hudText!: Phaser.GameObjects.Text;
  private emeraldCounter!: CrystalCounter;
  private rubyCounter!: CrystalCounter;
  private endFlight!: Phaser.GameObjects.Text;
  private wallet!: WalletManager;
  private transitioning = false;
  private destroyingPlayer = false;
  private startKm = 0;
  private recordedCheckpoints = new Set<number>();

  public constructor() {
    super({ key: SceneKeys.Game });
  }

  public init(data?: GameSceneStartData): void {
    this.startKm = Math.max(0, data?.startKm ?? 0);
  }

  public create(): void {
    this.transitioning = false;
    this.destroyingPlayer = false;
    this.recordedCheckpoints = new Set<number>();

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x1a2744);
    this.physics.world.setBounds(0, 0, width, height);

    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.focus();

    this.audioManager = new AudioManager(this);
    this.inputManager = new InputManager(this);
    const startingWallet =
      this.startKm > 0 ? gameProgress.getCheckpointWallet(this.startKm) : { emeralds: 0, rubies: 0 };
    this.wallet = new WalletManager(startingWallet);
    this.starfieldSystem = new StarfieldSystem(this, this.startKm);
    this.player = new Player(this, width / 2, height / 2, this.inputManager);
    this.intro = new IntroSequence(this, this.audioManager);
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
    this.playerDebrisBurst = new DebrisBurst(this, playerDebrisConfig);
    this.playerExplosion = new ExplosionEffect(this);
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

    this.endFlight = this.add
      .text(width - HUD_RIGHT_MARGIN_PX, 10, 'End flight', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#7fd4ff',
      })
      .setOrigin(1, 0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });

    this.endFlight.on('pointerdown', this.goToGameOver, this);

    this.emeraldCounter = new CrystalCounter(this, emeraldCounterStyle);
    this.rubyCounter = new CrystalCounter(this, rubyCounterStyle);
    this.syncCrystalCounters();
    this.input.keyboard?.on('keydown-ESC', this.goToGameOver, this);
    this.events.on(Phaser.Scenes.Events.PAUSE, this.deactivateEngineThrust, this);
    this.sys.game.events.on(Phaser.Core.Events.BLUR, this.deactivateEngineThrust, this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.audioManager.startFlight();

    if (this.startKm === 0) {
      this.player.setDormant(true);
      this.starfieldSystem.setScrollEnabled(false);
      this.intro.start();
    } else {
      this.startGameplaySystems();
    }

    this.syncHud();
  }

  public update(_time: number, delta: number): void {
    if (this.transitioning) {
      return;
    }

    if (this.destroyingPlayer) {
      this.updateDestructionScene(delta);
      return;
    }

    if (this.intro.isActive()) {
      this.updateIntro(delta);
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
    this.spawnSystem.update(delta, this.starfieldSystem.getDistanceKm());
    this.enemyWeaponSystem.update(delta);
    this.debrisBurst.update(delta);
    this.meteorDebrisBurst.update(delta);
    this.emeraldCounter.update(delta);
    this.rubyCounter.update(delta);
    this.recordCheckpointsIfNeeded();
    this.syncHud();
  }

  private updateIntro(delta: number): void {
    this.intro.update(delta);

    if (this.intro.isAwaitingInput() && this.inputManager.isMovementKeyDown()) {
      this.intro.stop();
      this.finishIntro();
    }

    // Scroll is frozen, so this only keeps the background stars twinkling.
    this.starfieldSystem.update(delta, 0, 0);
    this.emeraldCounter.update(delta);
    this.rubyCounter.update(delta);
    this.syncHud();
  }

  private finishIntro(): void {
    this.player.setDormant(false);
    this.starfieldSystem.setScrollEnabled(true);
    this.startGameplaySystems();
  }

  private startGameplaySystems(): void {
    this.spawnSystem.start();
    this.meteorSystem.start();
  }

  private recordCheckpointsIfNeeded(): void {
    const currentKm = this.starfieldSystem.getDistanceKm();
    for (const base of bases) {
      if (this.recordedCheckpoints.has(base.unlockAtKm)) {
        continue;
      }
      if (currentKm >= base.unlockAtKm) {
        this.recordedCheckpoints.add(base.unlockAtKm);
        gameProgress.recordCheckpoint(base.unlockAtKm, this.wallet.getSnapshot());
      }
    }
  }

  private syncCrystalCounters(): void {
    this.rubyCounter.setValue(this.wallet.getRubies());
    this.rubyCounter.setPosition(
      this.scale.width - HUD_RIGHT_MARGIN_PX,
      HUD_TOP_ROW_Y + this.endFlight.height + HUD_COUNTER_SPACING_PX,
    );

    const rubyLeft = this.rubyCounter.getIconLeftX();
    this.emeraldCounter.setValue(this.wallet.getEmeralds());
    this.emeraldCounter.setPosition(
      rubyLeft - HUD_COUNTER_SPACING_PX,
      HUD_TOP_ROW_Y + this.endFlight.height + HUD_COUNTER_SPACING_PX,
    );
  }

  private handleEnemyKilled = (enemy: Enemy): void => {
    this.wallet.awardForKilledEnemy(enemy.getEnemyId());
    this.spawnSystem.onEnemyKilled(enemy);
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
    if (result.killed) {
      this.destroyPlayer();
      return;
    }

    this.audioManager.playSfx(SoundKeys.PlayerHit);
  };

  private destroyPlayer(): void {
    if (this.destroyingPlayer || this.transitioning) {
      return;
    }

    this.destroyingPlayer = true;
    this.deactivateEngineThrust();
    this.input.enabled = false;
    this.collisionSystem.stop();

    const { x, y } = this.player;
    this.player.hideForDestruction();
    this.playerExplosion.spawnBurst(x, y);
    this.playerDebrisBurst.spawn(x, y);
    this.audioManager.playSfx(SoundKeys.PlayerExplosion);
    this.cameras.main.shake(DEATH_SHAKE_MS, DEATH_SHAKE_INTENSITY);
    this.time.delayedCall(DEATH_TO_GAME_OVER_MS, this.goToGameOver, undefined, this);
  }

  private updateDestructionScene(delta: number): void {
    this.starfieldSystem.update(delta, 0, 0);
    this.meteorSystem.update(delta, this.starfieldSystem.getScrollSpeed());
    this.debrisBurst.update(delta);
    this.meteorDebrisBurst.update(delta);
    this.playerDebrisBurst.update(delta);
  }

  private syncHud(): void {
    const distanceKm = Math.floor(this.starfieldSystem.getDistanceKm());
    this.hudText.setText(`Health ${this.player.getHealthPercent()}%  ${distanceKm} km`);
    this.syncCrystalCounters();
  }

  private onShutdown(): void {
    this.deactivateEngineThrust();
    this.audioManager.stopFlight();
    this.input.keyboard?.off('keydown-ESC', this.goToGameOver, this);
    this.events.off(Phaser.Scenes.Events.PAUSE, this.deactivateEngineThrust, this);
    this.sys.game.events.off(Phaser.Core.Events.BLUR, this.deactivateEngineThrust, this);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.sys.game.events.off(Phaser.Core.Events.POST_RENDER, this.onPostRenderLeave, this);
    this.spawnSystem.resetForShutdown();
    this.starfieldSystem.stop();
    this.intro.stop();
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
    this.playerDebrisBurst.stop();
    this.playerExplosion.stop();
    this.scene.start(SceneKeys.GameOver);
  }
}
