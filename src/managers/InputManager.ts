import Phaser from 'phaser';

export class InputManager {
  private readonly scene: Phaser.Scene;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyW: Phaser.Input.Keyboard.Key;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyS: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  private readonly moveVector: Phaser.Math.Vector2;
  private readonly aimPosition: Phaser.Math.Vector2;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.moveVector = new Phaser.Math.Vector2();
    this.aimPosition = new Phaser.Math.Vector2(scene.scale.width / 2, scene.scale.height / 2);

    const keyboard = scene.input.keyboard;
    if (keyboard === null) {
      throw new Error('Keyboard input plugin is not available');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  public update(): void {
    if (!this.scene.game.hasFocus) {
      this.moveVector.set(0, 0);
      return;
    }

    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.keyA.isDown) {
      x -= 1;
    }

    if (this.cursors.right.isDown || this.keyD.isDown) {
      x += 1;
    }

    if (this.cursors.up.isDown || this.keyW.isDown) {
      y -= 1;
    }

    if (this.cursors.down.isDown || this.keyS.isDown) {
      y += 1;
    }

    this.moveVector.set(x, y);
    if (this.moveVector.lengthSq() > 1) {
      this.moveVector.normalize();
    }

    const pointer = this.scene.input.activePointer;
    pointer.updateWorldPoint(this.scene.cameras.main);
    this.aimPosition.set(pointer.worldX, pointer.worldY);
  }

  public getMoveVector(): Phaser.Math.Vector2 {
    return this.moveVector;
  }

  public getAimPosition(): Phaser.Math.Vector2 {
    return this.aimPosition;
  }
}
