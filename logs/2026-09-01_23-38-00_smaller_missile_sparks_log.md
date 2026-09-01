# Agent Change Log

## Task objective

Уменьшить искры хвоста ракеты; FIT-масштаб канваса и видимый костёр из ADD-кругов уже в дереве — закоммитить всё вместе.

## Files created or modified

- `src/data/missileSparks.ts` — меньший радиус хвоста (2.5–5.5), burst 3–7, угольки 4–8
- `src/effects/MissileSparkTrail.ts`
- `src/entities/Projectile.ts`
- `src/systems/WeaponSystem.ts`
- `src/config/gameConfig.ts`
- `src/config/assetKeys.ts`
- `src/scenes/PreloadScene.ts`
- `index.html`
- `docs/visual-style.md`
- `docs/cosmicfly-gameplay.md`
- `public/assets/attribution/assets.md`
- `logs/2026-09-01_23-30-00_scale_and_missile_sparks_log.md`
- `logs/2026-09-01_23-38-00_smaller_missile_sparks_log.md`

## Key changes

- Хвост ракеты: мелкие additive-круги вместо крупных пятен.
- Игра 960×540 FIT в окне (если ещё не в том же коммите).

## Verification

- Числа только в `missileSparks.ts`; ParticleEmitter не используется.

## Status

Ready for git-guardian commit and push.
