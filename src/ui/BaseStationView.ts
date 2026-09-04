import Phaser from 'phaser';
import { TextureKeys, type TextureKey } from '../config/assetKeys';
import { baseStationLayout, shopSlotGroups } from '../data/baseStation';
import { emeraldRepair } from '../data/emeraldRepair';
import {
  canAffordShopSpend,
  shopCatalog,
  type EquipmentId,
  type ShopItemDef,
  type ShopSpendChoice,
} from '../data/shopCatalog';
import {
  CRYSTAL_ICON_BASE_PX,
  crystalBaseIconScale,
  crystalHudIconScale,
} from './CrystalCounter';

export type BaseStationViewState = {
  readonly stageCompleteLabel: string;
  readonly emeralds: number;
  readonly rubies: number;
  readonly diamonds: number;
  readonly healthPercent: number;
  readonly canRepairOne: boolean;
  readonly canRepairTen: boolean;
  readonly canAdjustPlus: boolean;
  readonly ownedEquipmentIds: readonly string[];
};

export type BaseStationViewHandlers = {
  readonly onRepairOne: () => void;
  readonly onRepairTen: () => void;
  readonly onAdjustPlus: () => void;
  readonly onAdjustMinus: () => void;
  readonly onNextStage: () => void;
  readonly onBuyShopItem: (id: EquipmentId, spend: ShopSpendChoice) => void;
};

const BUTTON_FONT = '22px';
const BODY_FONT = '18px';
const SLOT_LABEL_FONT = '11px';
const PRICE_FONT = '13px';
const SUICIDE_WARNING = 'Suicide is not allowed';
const NOT_ENOUGH_CRYSTALS = 'Not enough crystals';
const WARNING_VISIBLE_MS = 2200;
const STATS_ICON_GAP_PX = 6;
const STATS_GROUP_GAP_PX = 28;
const ADJUST_BUTTON_GAP_PX = 48;
const PRICE_ICON_GAP_PX = 3;
const PRICE_PAIR_GAP_PX = 10;
const PRICE_STRIP_ABOVE_CELL_PX = 10;

type CrystalStat = {
  readonly icon: Phaser.GameObjects.Image;
  readonly label: Phaser.GameObjects.Text;
};

type ShopSlotView = {
  readonly item: ShopItemDef;
  readonly hit: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly priceRoot: Phaser.GameObjects.Container;
  readonly emeraldHit: Phaser.GameObjects.Image;
  readonly rubyHit: Phaser.GameObjects.Image;
  readonly ownedLabel: Phaser.GameObjects.Text;
};

export class BaseStationView {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly stageLabel: Phaser.GameObjects.Text;
  private readonly hullLabel: Phaser.GameObjects.Text;
  private readonly emeraldStat: CrystalStat;
  private readonly rubyStat: CrystalStat;
  private readonly diamondStat: CrystalStat;
  private readonly adjustPlus: Phaser.GameObjects.Text;
  private readonly repairOne: Phaser.GameObjects.Text;
  private readonly repairTen: Phaser.GameObjects.Text;
  private readonly nextStage: Phaser.GameObjects.Text;
  private readonly warningLabel: Phaser.GameObjects.Text;
  private readonly handlers: BaseStationViewHandlers;
  private readonly statsCenterY: number;
  private readonly shopSlots: ShopSlotView[] = [];
  private warningHideEvent: Phaser.Time.TimerEvent | null = null;

  public constructor(scene: Phaser.Scene, handlers: BaseStationViewHandlers) {
    this.scene = scene;
    this.handlers = handlers;
    const { width, height } = scene.scale;
    const layout = baseStationLayout;
    this.statsCenterY = 148;

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

    this.hullLabel = scene.add
      .text(0, this.statsCenterY, '', {
        fontFamily: 'sans-serif',
        fontSize: BODY_FONT,
        color: layout.bodyColor,
      })
      .setOrigin(0, 0.5);
    this.root.add(this.hullLabel);

    this.emeraldStat = this.createCrystalStat(scene, TextureKeys.CrystalEmerald);
    this.rubyStat = this.createCrystalStat(scene, TextureKeys.CrystalRuby);
    this.diamondStat = this.createCrystalStat(scene, TextureKeys.CrystalDiamond);

    const rate = scene.add
      .text(
        width / 2,
        188,
        `1 Emerald = +${100 / emeraldRepair.emeraldsForFullHealth}% hull   ·   ${emeraldRepair.packLarge} Emeralds = +20%   ·   ${emeraldRepair.emeraldsForFullHealth} Emeralds = 100%`,
        {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: layout.mutedColor,
        },
      )
      .setOrigin(0.5, 0);
    this.root.add(rate);

    this.adjustPlus = this.createButton(
      scene,
      width / 2 - ADJUST_BUTTON_GAP_PX,
      220,
      '+',
      () => this.handlers.onAdjustPlus(),
    );
    this.createButton(
      scene,
      width / 2 + ADJUST_BUTTON_GAP_PX,
      220,
      '−',
      () => this.handlers.onAdjustMinus(),
    );

    const adjustHint = scene.add
      .text(width / 2, 248, `±${100 / emeraldRepair.emeraldsForFullHealth}% hull / ${emeraldRepair.packSmall} Emerald`, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: layout.mutedColor,
      })
      .setOrigin(0.5, 0);
    this.root.add(adjustHint);

    this.repairOne = this.createButton(
      scene,
      width / 2,
      278,
      `Repair +2%  (${emeraldRepair.packSmall} Emerald)`,
      () => this.handlers.onRepairOne(),
    );
    this.repairTen = this.createButton(
      scene,
      width / 2,
      318,
      `Repair +20%  (${emeraldRepair.packLarge} Emeralds)`,
      () => this.handlers.onRepairTen(),
    );
    this.nextStage = this.createButton(scene, width / 2, 372, 'Next Stage', () =>
      this.handlers.onNextStage(),
    );
    this.nextStage.setColor(layout.accentColor);

    this.warningLabel = scene.add
      .text(width / 2, 410, '', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ff8a8a',
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.root.add(this.warningLabel);

    this.addShopSlots(scene, width, height);
  }

  public show(state: BaseStationViewState): void {
    this.sync(state);
    this.root.setVisible(true);
  }

  public hide(): void {
    this.clearWarning();
    this.root.setVisible(false);
  }

  public isVisible(): boolean {
    return this.root.visible;
  }

  public sync(state: BaseStationViewState): void {
    this.stageLabel.setText(state.stageCompleteLabel);
    this.hullLabel.setText(`Hull ${state.healthPercent}%`);
    this.emeraldStat.label.setText(String(state.emeralds));
    this.rubyStat.label.setText(String(state.rubies));
    this.diamondStat.label.setText(String(state.diamonds));
    this.layoutStatsRow(this.scene.scale.width / 2);
    this.setButtonEnabled(this.repairOne, state.canRepairOne);
    this.setButtonEnabled(this.repairTen, state.canRepairTen);
    this.setButtonEnabled(this.adjustPlus, state.canAdjustPlus);
    this.syncShopSlots(state);
  }

  public showSuicideWarning(): void {
    this.showWarning(SUICIDE_WARNING);
  }

  public showNotEnoughCrystalsWarning(): void {
    this.showWarning(NOT_ENOUGH_CRYSTALS);
  }

  public destroy(): void {
    this.clearWarning();
    this.root.destroy(true);
  }

  private syncShopSlots(state: BaseStationViewState): void {
    const wallet = { emeralds: state.emeralds, rubies: state.rubies };
    for (const slot of this.shopSlots) {
      const owned = state.ownedEquipmentIds.includes(slot.item.id);
      const canEmerald = !owned && canAffordShopSpend(slot.item, wallet, 'emeralds');
      const canRuby = !owned && canAffordShopSpend(slot.item, wallet, 'rubies');

      slot.ownedLabel.setVisible(owned);
      slot.priceRoot.setVisible(!owned);
      slot.label.setText(slot.item.label);
      slot.label.setAlpha(owned ? 0.55 : 1);
      slot.hit.setAlpha(owned ? 0.45 : 1);
      slot.hit.disableInteractive();

      slot.emeraldHit.setAlpha(owned ? 0.35 : canEmerald ? 1 : 0.45);
      slot.rubyHit.setAlpha(owned ? 0.35 : canRuby ? 1 : 0.45);

      if (!owned) {
        slot.emeraldHit.setInteractive({ useHandCursor: true });
        slot.rubyHit.setInteractive({ useHandCursor: true });
      } else {
        slot.emeraldHit.disableInteractive();
        slot.rubyHit.disableInteractive();
      }
    }
  }

  private showWarning(message: string): void {
    this.clearWarning();
    this.warningLabel.setText(message);
    this.warningLabel.setAlpha(1);
    this.warningLabel.setVisible(true);
    this.warningHideEvent = this.scene.time.delayedCall(WARNING_VISIBLE_MS, () => {
      this.warningLabel.setVisible(false);
      this.warningHideEvent = null;
    });
  }

  private clearWarning(): void {
    if (this.warningHideEvent !== null) {
      this.warningHideEvent.remove(false);
      this.warningHideEvent = null;
    }
    this.warningLabel.setVisible(false);
  }

  private createCrystalStat(scene: Phaser.Scene, textureKey: TextureKey): CrystalStat {
    const displayPx = CRYSTAL_ICON_BASE_PX * crystalBaseIconScale;
    const icon = scene.add.image(0, this.statsCenterY, textureKey);
    icon.setOrigin(0, 0.5);
    icon.setDisplaySize(displayPx, displayPx);
    this.root.add(icon);

    const label = scene.add
      .text(0, this.statsCenterY, '0', {
        fontFamily: 'sans-serif',
        fontSize: BODY_FONT,
        color: baseStationLayout.bodyColor,
      })
      .setOrigin(0, 0.5);
    this.root.add(label);

    return { icon, label };
  }

  private layoutStatsRow(centerX: number): void {
    const groups: CrystalStat[] = [this.emeraldStat, this.rubyStat, this.diamondStat];
    const hullWidth = this.hullLabel.width;
    let crystalsWidth = 0;
    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];
      crystalsWidth += group.icon.displayWidth + STATS_ICON_GAP_PX + group.label.width;
      if (i < groups.length - 1) {
        crystalsWidth += STATS_GROUP_GAP_PX;
      }
    }

    const totalWidth = hullWidth + STATS_GROUP_GAP_PX + crystalsWidth;
    let x = centerX - totalWidth / 2;

    this.hullLabel.setPosition(x, this.statsCenterY);
    x += hullWidth + STATS_GROUP_GAP_PX;

    for (const group of groups) {
      group.icon.setPosition(x, this.statsCenterY);
      x += group.icon.displayWidth + STATS_ICON_GAP_PX;
      group.label.setPosition(x, this.statsCenterY);
      x += group.label.width + STATS_GROUP_GAP_PX;
    }
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
    const groupWidth = 3 * layout.slotSizePx + 2 * layout.slotGapPx;
    const totalWidth = shopSlotGroups.length * groupWidth + 2 * layout.groupGapPx;
    const startX = (width - totalWidth) / 2;
    const slotY = height - layout.slotBottomMarginPx - layout.slotSizePx / 2;
    const labelY = slotY - layout.slotSizePx / 2 - 28;

    shopSlotGroups.forEach((group, groupIndex) => {
      const catalogGroup = shopCatalog[groupIndex];
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

        const item = catalogGroup?.slots[slot]?.item ?? null;
        if (item === null) {
          continue;
        }

        const priceY = slotY - layout.slotSizePx / 2 - PRICE_STRIP_ABOVE_CELL_PX;
        const priceStrip = this.createPriceStrip(scene, slotX, priceY, item);
        this.root.add(priceStrip.root);

        const cellLabel = scene.add
          .text(slotX, slotY, item.label, {
            fontFamily: 'sans-serif',
            fontSize: SLOT_LABEL_FONT,
            color: layout.bodyColor,
            align: 'center',
            wordWrap: { width: layout.slotSizePx - 8 },
          })
          .setOrigin(0.5, 0.5);
        this.root.add(cellLabel);

        const ownedLabel = scene.add
          .text(slotX, slotY + layout.slotSizePx / 2 + 2, 'Owned', {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            color: layout.mutedColor,
          })
          .setOrigin(0.5, 0)
          .setVisible(false);
        this.root.add(ownedLabel);

        priceStrip.emeraldIcon.on('pointerdown', () =>
          this.handlers.onBuyShopItem(item.id, 'emeralds'),
        );
        priceStrip.rubyIcon.on('pointerdown', () =>
          this.handlers.onBuyShopItem(item.id, 'rubies'),
        );

        this.shopSlots.push({
          item,
          hit: square,
          label: cellLabel,
          priceRoot: priceStrip.root,
          emeraldHit: priceStrip.emeraldIcon,
          rubyHit: priceStrip.rubyIcon,
          ownedLabel,
        });
      }
    });
  }

  private createPriceStrip(
    scene: Phaser.Scene,
    centerX: number,
    y: number,
    item: ShopItemDef,
  ): {
    readonly root: Phaser.GameObjects.Container;
    readonly emeraldIcon: Phaser.GameObjects.Image;
    readonly rubyIcon: Phaser.GameObjects.Image;
  } {
    const layout = baseStationLayout;
    const iconPx = CRYSTAL_ICON_BASE_PX * crystalHudIconScale;
    const root = scene.add.container(centerX, y);

    const emeraldIcon = scene.add.image(0, 0, TextureKeys.CrystalEmerald);
    emeraldIcon.setOrigin(0, 0.5);
    emeraldIcon.setDisplaySize(iconPx, iconPx);

    const emeraldAmount = scene.add
      .text(0, 0, String(item.costEmeralds), {
        fontFamily: 'sans-serif',
        fontSize: PRICE_FONT,
        color: layout.bodyColor,
      })
      .setOrigin(0, 0.5);

    const rubyIcon = scene.add.image(0, 0, TextureKeys.CrystalRuby);
    rubyIcon.setOrigin(0, 0.5);
    rubyIcon.setDisplaySize(iconPx, iconPx);

    const rubyAmount = scene.add
      .text(0, 0, String(item.costRubies), {
        fontFamily: 'sans-serif',
        fontSize: PRICE_FONT,
        color: layout.bodyColor,
      })
      .setOrigin(0, 0.5);

    const leftWidth = iconPx + PRICE_ICON_GAP_PX + emeraldAmount.width;
    const rightWidth = iconPx + PRICE_ICON_GAP_PX + rubyAmount.width;
    const totalWidth = leftWidth + PRICE_PAIR_GAP_PX + rightWidth;
    let x = -totalWidth / 2;

    emeraldIcon.setPosition(x, 0);
    x += iconPx + PRICE_ICON_GAP_PX;
    emeraldAmount.setPosition(x, 0);
    x += emeraldAmount.width + PRICE_PAIR_GAP_PX;
    rubyIcon.setPosition(x, 0);
    x += iconPx + PRICE_ICON_GAP_PX;
    rubyAmount.setPosition(x, 0);

    root.add([emeraldIcon, emeraldAmount, rubyIcon, rubyAmount]);
    return { root, emeraldIcon, rubyIcon };
  }
}
