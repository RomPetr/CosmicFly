import Phaser from 'phaser';
import { baseStationLayout, shopSlotGroups } from '../data/baseStation';
import { emeraldRepair } from '../data/emeraldRepair';

export type BaseStationViewState = {
  readonly stageCompleteLabel: string;
  readonly emeralds: number;
  readonly rubies: number;
  readonly healthPercent: number;
  readonly canRepairOne: boolean;
  readonly canRepairTen: boolean;
};

export type BaseStationViewHandlers = {
  readonly onRepairOne: () => void;
  readonly onRepairTen: () => void;
  readonly onNextStage: () => void;
};

const BUTTON_FONT = '22px';
const BODY_FONT = '18px';

export class BaseStationView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly stageLabel: Phaser.GameObjects.Text;
  private readonly statsLabel: Phaser.GameObjects.Text;
  private readonly repairOne: Phaser.GameObjects.Text;
  private readonly repairTen: Phaser.GameObjects.Text;
  private readonly nextStage: Phaser.GameObjects.Text;
  private readonly handlers: BaseStationViewHandlers;

  public constructor(scene: Phaser.Scene, handlers: BaseStationViewHandlers) {
    this.handlers = handlers;
    const { width, height } = scene.scale;
    const layout = baseStationLayout;

    this.root = scene.add.container(0, 0);
    this.root.setDepth(layout.depth);
    this.root.setVisible(false);

    const blocker = scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      layout.overlayColor,
      layout.overlayAlpha,
    );
    blocker.setInteractive();
    this.root.add(blocker);

    this.stageLabel = scene.add
      .text(width / 2, 44, '', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: layout.accentColor,
      })
      .setOrigin(0.5, 0);
    this.root.add(this.stageLabel);

    const title = scene.add
      .text(width / 2, 78, 'Base station', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: layout.titleColor,
      })
      .setOrigin(0.5, 0);
    this.root.add(title);

    this.statsLabel = scene.add
      .text(width / 2, 132, '', {
        fontFamily: 'sans-serif',
        fontSize: BODY_FONT,
        color: layout.bodyColor,
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.root.add(this.statsLabel);

    const rate = scene.add
      .text(
        width / 2,
        168,
        `1 Emerald = +${100 / emeraldRepair.emeraldsForFullHealth}% hull   ·   ${emeraldRepair.packLarge} Emeralds = +20%   ·   ${emeraldRepair.emeraldsForFullHealth} Emeralds = 100%`,
        {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: layout.mutedColor,
        },
      )
      .setOrigin(0.5, 0);
    this.root.add(rate);

    this.repairOne = this.createButton(
      scene,
      width / 2,
      214,
      `Repair +2%  (${emeraldRepair.packSmall} Emerald)`,
      () => this.handlers.onRepairOne(),
    );
    this.repairTen = this.createButton(
      scene,
      width / 2,
      254,
      `Repair +20%  (${emeraldRepair.packLarge} Emeralds)`,
      () => this.handlers.onRepairTen(),
    );
    this.nextStage = this.createButton(scene, width / 2, 308, 'Next Stage', () =>
      this.handlers.onNextStage(),
    );
    this.nextStage.setColor(layout.accentColor);

    this.addShopSlots(scene, width, height);
  }

  public show(state: BaseStationViewState): void {
    this.sync(state);
    this.root.setVisible(true);
  }

  public hide(): void {
    this.root.setVisible(false);
  }

  public isVisible(): boolean {
    return this.root.visible;
  }

  public sync(state: BaseStationViewState): void {
    this.stageLabel.setText(state.stageCompleteLabel);
    this.statsLabel.setText(
      `Hull ${state.healthPercent}%    Emeralds ${state.emeralds}    Rubies ${state.rubies}`,
    );
    this.setButtonEnabled(this.repairOne, state.canRepairOne);
    this.setButtonEnabled(this.repairTen, state.canRepairTen);
  }

  public destroy(): void {
    this.root.destroy(true);
  }

  private createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    const button = scene.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: BUTTON_FONT,
        color: baseStationLayout.accentColor,
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', onClick);
    this.root.add(button);
    return button;
  }

  private setButtonEnabled(button: Phaser.GameObjects.Text, enabled: boolean): void {
    button.setAlpha(enabled ? 1 : 0.35);
    if (enabled) {
      button.setInteractive({ useHandCursor: true });
      return;
    }
    button.disableInteractive();
  }

  private addShopSlots(scene: Phaser.Scene, width: number, height: number): void {
    const layout = baseStationLayout;
    const groupWidth =
      3 * layout.slotSizePx + 2 * layout.slotGapPx;
    const totalWidth = shopSlotGroups.length * groupWidth + 2 * layout.groupGapPx;
    const startX = (width - totalWidth) / 2;
    const slotY = height - layout.slotBottomMarginPx - layout.slotSizePx / 2;
    const labelY = slotY - layout.slotSizePx / 2 - 16;

    shopSlotGroups.forEach((group, groupIndex) => {
      const groupX = startX + groupIndex * (groupWidth + layout.groupGapPx);
      const label = scene.add
        .text(groupX + groupWidth / 2, labelY, group.label, {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: layout.mutedColor,
        })
        .setOrigin(0.5, 1);
      this.root.add(label);

      for (let slot = 0; slot < group.count; slot += 1) {
        const slotX = groupX + slot * (layout.slotSizePx + layout.slotGapPx) + layout.slotSizePx / 2;
        const square = scene.add.rectangle(
          slotX,
          slotY,
          layout.slotSizePx,
          layout.slotSizePx,
          layout.slotFill,
          0.35,
        );
        square.setStrokeStyle(2, layout.slotStroke, 0.9);
        this.root.add(square);
      }
    });
  }
}
