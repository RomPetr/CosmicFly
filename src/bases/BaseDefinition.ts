export const BaseServiceTypes = {
  Repair: 'repair',
  Armor: 'armor',
  Weapon: 'weapon',
  Engine: 'engine',
} as const;

export type BaseServiceType = (typeof BaseServiceTypes)[keyof typeof BaseServiceTypes];

export type BaseService = {
  readonly type: BaseServiceType;
};

export type BaseDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly unlockAtKm: number;
  /** Stage index (1–10) for every 100 km checkpoint before the final boss. */
  readonly stageNumber: number;
  readonly services: readonly BaseService[];
};
