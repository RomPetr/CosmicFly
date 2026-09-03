import Phaser from 'phaser';

export class InputManager {
  private readonly scene: Phaser.Scene;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyW: Phaser.Input.Keyboard.Key;
  private readonly keyA: Phaser.Input.Keyboard.Key;
  private readonly keyS: Phaser.Input.Keyboard.Key;
  private readonly keyD: Phaser.Input.Keyboard.Key;
  private readonly keyE: Phaser.Input.Keyboard.Key;
  private readonly keyH: Phaser.Input.Keyboard.Key;
  private readonly keyShift: Phaser.Input.Keyboard.Key;
  private readonly moveVector: Phaser.Math.Vector2;
  private readonly aimPosition: Phaser.Math.Vector2;
  private pulseFiring: boolean;
  private missileFiring: boolean;
  private wThrustActive: boolean;
  private reverseThrustActive: boolean;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.moveVector = new Phaser.Math.Vector2();
    this.aimPosition = new Phaser.Math.Vector2(scene.scale.width / 2, scene.scale.height / 2);
    this.pulseFiring = false;
    this.missileFiring = false;
    this.wThrustActive = false;
    this.reverseThrustActive = false;

    const keyboard = scene.input.keyboard;
    if (keyboard === null) {
      throw new Error('Keyboard input plugin is not available');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyE = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyH = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.keyShift = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  public update(): void {
    if (!this.isWindowFocused()) {
      this.moveVector.set(0, 0);
      this.pulseFiring = false;
      this.missileFiring = false;
      this.wThrustActive = false;
      this.reverseThrustActive = false;
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
    this.wThrustActive = this.keyW.isDown && this.moveVector.y < 0;
    this.reverseThrustActive = this.keyS.isDown && this.moveVector.y > 0;

    const pointer = this.scene.input.activePointer;
    pointer.updateWorldPoint(this.scene.cameras.main);
    this.aimPosition.set(pointer.worldX, pointer.worldY);

    this.pulseFiring = pointer.leftButtonDown();
    this.missileFiring = this.cursors.space.isDown;
  }

  public getMoveVector(): Phaser.Math.Vector2 {
    return this.moveVector;
  }

  public getAimPosition(): Phaser.Math.Vector2 {
    return this.aimPosition;
  }

  public isFiringPulse(): boolean {
    return this.pulseFiring;
  }

  public isFiringMissile(): boolean {
    return this.missileFiring;
  }

  public isWThrustActive(): boolean {
    return this.wThrustActive;
  }

  public isReverseThrustActive(): boolean {
    return this.reverseThrustActive;
  }

  public consumeBlinkPress(): boolean {
    if (!this.isWindowFocused()) {
      return false;
    }

    return Phaser.Input.Keyboard.JustDown(this.keyE);
  }

  /** Debug/testing shortcut: restore player hull to 100%. */
  public consumeDebugFullHealPress(): boolean {
    if (!this.isWindowFocused()) {
      return false;
    }

    const shiftHeld = this.keyShift.isDown;
    return shiftHeld && Phaser.Input.Keyboard.JustDown(this.keyH);
  }

  public isMovementKeyDown(): boolean {
    if (!this.isWindowFocused()) {
      return false;
    }

    return (
      this.keyW.isDown ||
      this.keyA.isDown ||
      this.keyS.isDown ||
      this.keyD.isDown ||
      this.cursors.up.isDown ||
      this.cursors.down.isDown ||
      this.cursors.left.isDown ||
      this.cursors.right.isDown
    );
  }

  private isWindowFocused(): boolean {
    return document.visibilityState !== 'hidden' && document.hasFocus();
  }
}
