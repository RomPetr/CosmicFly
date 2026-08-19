import Phaser from 'phaser';
import { SceneKeys } from '../config/assetKeys';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { DebrisBurst } from '../effects/DebrisBurst';
import { InputManager } from '../managers/InputManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private player!: Player;
  private weaponSystem!: WeaponSystem;
  private spawnSystem!: SpawnSystem;
  private collisionSystem!: CollisionSystem;
  private debrisBurst!: DebrisBurst;
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

    this.inputManager = new InputManager(this);
    this.player = new Player(this, width / 2, height / 2, this.inputManager);
    this.weaponSystem = new WeaponSystem(this, this.player, this.inputManager);
    this.spawnSystem = new SpawnSystem(this, this.player);
    this.debrisBurst = new DebrisBurst(this);
    this.collisionSystem = new CollisionSystem(
      this,
      this.weaponSystem.getProjectiles(),
      this.spawnSystem.getEnemies(),
      this.handleEnemyKilled,
    );
    this.spawnSystem.start();

    this.add
      .text(12, 10, 'Flight in progress', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f4f7fb',
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  public update(_time: number, delta: number): void {
    if (this.transitioning) {
      return;
    }

    this.inputManager.update();
    this.player.update();
    this.weaponSystem.update(delta);
    this.spawnSystem.update(delta);
    this.debrisBurst.update(delta);
  }

  private handleEnemyKilled = (enemy: Enemy): void => {
    this.debrisBurst.spawn(enemy.x, enemy.y);
    enemy.deactivate();
  };

  private onShutdown(): void {
    this.input.keyboard?.off('keydown-ESC', this.goToGameOver, this);
    this.weaponSystem.stop();
    this.spawnSystem.stop();
    this.debrisBurst.stop();
  }

  private goToGameOver(): void {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.weaponSystem.stop();
    this.spawnSystem.stop();
    this.debrisBurst.stop();
    this.collisionSystem.stop();
    this.scene.start(SceneKeys.GameOver);
  }
}
