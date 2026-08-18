import { SkinIds, type SkinId } from '../config/assetKeys';

export class GameState {
  public bestScore: number;
  public selectedSkinId: SkinId;
  public autoFire: boolean;

  public constructor() {
    this.bestScore = 0;
    this.selectedSkinId = SkinIds.Ember;
    this.autoFire = false;
  }
}

export const gameState = new GameState();
