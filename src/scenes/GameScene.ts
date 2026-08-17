import Phaser from 'phaser';
import { SceneKeys } from '../config/assetKeys';
import { Player } from '../entities/Player';
import { InputManager } from '../managers/InputManager';

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private player!: Player;

  public constructor() {
    super({ key: SceneKeys.Game });
  }

  public create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x1a2744);
    this.physics.world.setBounds(0, 0, width, height);

    this.inputManager = new InputManager(this);
    this.player = new Player(this, width / 2, height / 2, this.inputManager);

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

  public update(): void {
    this.inputManager.update();
    this.player.update();
  }

  private onShutdown(): void {
    this.input.keyboard?.off('keydown-ESC', this.goToGameOver, this);
  }

  private goToGameOver(): void {
    this.scene.start(SceneKeys.GameOver);
  }
}
