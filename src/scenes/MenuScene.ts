import Phaser from 'phaser';
import { AimCursorCss, SceneKeys } from '../config/assetKeys';
import { gameProgress, type StartPoint } from '../state/GameProgress';
import { gameState } from '../state/GameState';

const OPTION_SPACING_PX = 44;
const OPTION_TOP_OFFSET_PX = 40;

export class MenuScene extends Phaser.Scene {
  public constructor() {
    super({ key: SceneKeys.Menu });
  }

  public create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x0b0d12);
    this.input.setDefaultCursor(AimCursorCss);

    this.add
      .text(width / 2, height / 2 - 96, 'CosmicFly', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#f4f7fb',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 44, `Best: ${gameState.bestScore}`, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#9aa7b8',
      })
      .setOrigin(0.5);

    const startPoints = gameProgress.getStartPoints();
    startPoints.forEach((startPoint, index) => {
      this.createStartOption(startPoint, index);
    });
  }

  private createStartOption(startPoint: StartPoint, index: number): void {
    const { width, height } = this.scale;
    const y = height / 2 + OPTION_TOP_OFFSET_PX + index * OPTION_SPACING_PX;
    const color = index === 0 ? '#7fd4ff' : '#c8fbe8';

    const label = this.add
      .text(width / 2, y, startPoint.displayName, {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    label.on('pointerdown', () => this.startGame(startPoint));
  }

  private startGame(startPoint: StartPoint): void {
    this.sound.unlock();
    this.scene.start(SceneKeys.Game, { startKm: startPoint.distanceKm });
  }
}
