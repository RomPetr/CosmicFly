# Agent Change Log

## Task objective

Таран игрока с метеоритом (shrink / destroy + отдельные SFX) и таран Middle Enemy (50%/66%, короткий пузырьковый отскок, yaw, charge AI).

## Files created or modified

- `src/data/ramming.ts`
- `src/entities/Meteor.ts`
- `src/entities/Enemy.ts`
- `src/systems/MeteorSystem.ts`
- `src/systems/CollisionSystem.ts`
- `src/scenes/GameScene.ts`
- `src/config/assetKeys.ts`
- `src/managers/AudioManager.ts`
- `public/assets/audio/player/meteor_ram.wav`
- `public/assets/audio/enemy/middle_ram.wav`
- `public/assets/attribution/assets.md`
- `docs/cosmicfly-gameplay.md`
- `logs/2026-08-30_23-15-00_meteor_middle_ram_log.md`

## Key changes

- Метеор: `tryLockRam`, `applyKnockback` + stun; `syncFallSpeed` не перезаписывает velocity, пока stun > 0.
- Без пузыря: 10% HP (`cause: ram`), импульсы 160/180, `shrinkInHalf` ×0.5 + `spawnHit`; второй удар — `spawnDestroyed` + deactivate.
- С пузырём: 0 HP, `reportShieldRam`, сразу destroyed debris, метеорит исчезает. SFX `MeteorRam`, не PlayerHit/ShipRam.
- Middle без пузыря: игроку 50% HP, hull 33% (как Small), лёгкие импульсы 160/180, SFX `MiddleRam`.
- Middle с пузырём: импульс 210, stun 260, yaw 10–120°, hull 66%. Small пузырь без регрессии (420, 1–2 оборота, касса).
- Charge только Middle: кулдаун 4–8 с, рывок 1.0–1.2 с, скорость ×2.1, орбита 0.06; knockback прерывает рывок.
- `onRamSound(kind: 'small' | 'middle' | 'meteor')` вместо единого `onShipRam`.

## Verification

- `npm run typecheck` — успешно.
- `npm run build` — успешно.
- Запуск игры — не проигрывался вручную в этой сессии.
- PNG прицела `crosshair_color_b.png` не изменялся.

## Status

Ready for review.
