import type { BaseDefinition } from '../bases/BaseDefinition';

export const base100: BaseDefinition = {
  id: 'base-100',
  displayName: 'Base 100',
  unlockAtKm: 100,
  stageNumber: 1,
  services: [],
};

export const base200: BaseDefinition = {
  id: 'base-200',
  displayName: 'Base 200',
  unlockAtKm: 200,
  stageNumber: 2,
  services: [],
};

export const bases: readonly BaseDefinition[] = [base100, base200];

export function findBaseAtKm(km: number): BaseDefinition | undefined {
  return bases.find((base) => base.unlockAtKm === km);
}
