import { SkinIds, type SkinId } from '../config/assetKeys';

export class GameState {
  public bestScore: number;
  public selectedSkinId: SkinId;

  public constructor() {
    this.bestScore = 0;
    this.selectedSkinId = SkinIds.Ember;
  }
}

export const gameState = new GameState();
