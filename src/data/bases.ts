import type { BaseDefinition } from '../bases/BaseDefinition';

export const waypointAlphaBase: BaseDefinition = {
  id: 'waypoint-alpha',
  displayName: 'Waypoint Alpha',
  unlockAtKm: 100,
  services: [],
};

export const bases: readonly BaseDefinition[] = [waypointAlphaBase];

export function findBaseAtKm(km: number): BaseDefinition | undefined {
  return bases.find((base) => base.unlockAtKm === km);
}
