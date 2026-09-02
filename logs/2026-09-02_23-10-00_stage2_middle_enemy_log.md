# Middle Enemy Stage 2

Date: 2026-09-02

## Request

Add a Stage 2 singleton enemy from Kenney `spaceShips_006.png`: teal/white hull, long fading lance (−10% player HP) with inverse trail, 5 pulse hits or 2 meteor contacts to kill.

## Implementation

- Sprite copied to `public/assets/enemies/middle-enemy-s2/spaceShips_006.png`; Preload remaps pixels to teal/white.
- `EnemyIds.MiddleEnemyStage2` spawns from 100 km, maxAlive 1, respawn 20s. Stage 1 Middle stays.
- Lance: procedural long bolt, alpha fade, additive inverse trail `#cf3e62`. SFX currently Kenney `forceField_003` (same file as enemy missile) — no `laserLarge_*` in the local sci-fi pack.
- Meteor overlap only for this id: 50% maxHull per contact, meteor shrinks like a player ram.
- Kill award: 1 ruby. No charge ram. Pulse 5 hits (`maxHull` 5).

## Verification

- `npm test`
- `npm run typecheck`
