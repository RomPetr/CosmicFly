import Phaser from 'phaser';
import {
  GiftIds,
  giftDrop,
  giftHealAmount,
  giftShield,
  type GiftId,
} from '../data/gifts';
import { starterShip } from '../data/ships';
import type { Enemy } from '../entities/Enemy';
import { Gift } from '../entities/Gift';
import type { Player } from '../entities/Player';

type PhysicsObject = Parameters<Phaser.Types.Physics.Arcade.ArcadePhysicsCallback>[0];

export class GiftSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly gifts: Phaser.Physics.Arcade.Group;
  private enabled: boolean;
  private smallKillCount: number;
  private nextDropThreshold: number;

  public constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.enabled = false;
    this.smallKillCount = 0;
    this.nextDropThreshold = this.rollThreshold();

    this.gifts = scene.physics.add.group({
      classType: Gift,
      maxSize: giftDrop.poolSize,
      runChildUpdate: false,
      allowGravity: false,
    });

    scene.physics.add.overlap(
      player.getSprite(),
      this.gifts,
      this.handlePlayerGift,
      this.canPlayerCollectGift,
      this,
    );
  }

  public start(): void {
    this.enabled = true;
    this.resetDropState();
  }

  public onEnemyKilled(enemy: Enemy): void {
    if (!this.enabled || !this.scene.sys.isActive() || this.player.getHealth() <= 0) {
      return;
    }

    if (enemy.getEnemyId() !== giftDrop.sourceEnemyId) {
      return;
    }

    this.smallKillCount += 1;
    if (this.smallKillCount < this.nextDropThreshold) {
      return;
    }

    this.spawnGift(enemy.x, enemy.y);
    this.smallKillCount = 0;
    this.nextDropThreshold = this.rollThreshold();
  }

  public update(_delta: number): void {
    if (!this.enabled || !this.scene.sys.isActive()) {
      return;
    }

    if (this.player.getHealth() <= 0) {
      this.deactivateAll();
    }
  }

  public stop(): void {
    this.enabled = false;
    this.resetDropState();

    if (!this.scene.sys.isActive()) {
      return;
    }

    this.deactivateAll();
  }

  public resetForShutdown(): void {
    this.enabled = false;
    this.resetDropState();
  }

  private spawnGift(x: number, y: number): void {
    if (!this.enabled || !this.scene.sys.isActive() || this.player.getHealth() <= 0) {
      return;
    }

    const gift = this.gifts.get(x, y);
    if (!(gift instanceof Gift)) {
      return;
    }

    gift.activate(this.rollKind(), x, y);
  }

  private applyGift(gift: Gift): void {
    const kind = gift.getKind();
    if (kind === GiftIds.Health) {
      this.player.heal(giftHealAmount(starterShip.maxHealth));
      return;
    }

    this.player.activateShield(giftShield.durationMs);
  }

  private canPlayerCollectGift(_object1: PhysicsObject, object2: PhysicsObject): boolean {
    if (!this.enabled || this.player.getHealth() <= 0) {
      return false;
    }

    const gift = this.asGift(object2) ?? this.asGift(_object1);
    return gift !== undefined && gift.active;
  }

  private handlePlayerGift(object1: PhysicsObject, object2: PhysicsObject): void {
    const gift = this.asGift(object1) ?? this.asGift(object2);
    if (gift === undefined || !gift.active) {
      return;
    }

    this.applyGift(gift);
    gift.deactivate();
  }

  private asGift(object: PhysicsObject): Gift | undefined {
    if (object instanceof Gift) {
      return object;
    }

    if (
      object instanceof Phaser.Physics.Arcade.Body ||
      object instanceof Phaser.Physics.Arcade.StaticBody
    ) {
      return object.gameObject instanceof Gift ? object.gameObject : undefined;
    }

    return undefined;
  }

  private deactivateAll(): void {
    for (const child of this.gifts.getChildren()) {
      if (child instanceof Gift) {
        child.deactivate();
      }
    }
  }

  private resetDropState(): void {
    this.smallKillCount = 0;
    this.nextDropThreshold = this.rollThreshold();
  }

  private rollThreshold(): number {
    return Phaser.Math.Between(giftDrop.killThresholdMin, giftDrop.killThresholdMax);
  }

  private rollKind(): GiftId {
    return Phaser.Math.Between(0, 1) === 0 ? GiftIds.Health : GiftIds.Shield;
  }
}
