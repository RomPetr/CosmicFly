# Agent Change Log

## Task objective

Fix unscaled oversized game canvas (HUD off-screen) and make flare-missile nozzle sparks actually visible.

## Files created or modified

- `src/config/gameConfig.ts`
- `index.html`
- `src/data/missileSparks.ts`
- `src/effects/MissileSparkTrail.ts`
- `src/entities/Projectile.ts`
- `src/systems/WeaponSystem.ts`
- `src/scenes/PreloadScene.ts`
- `src/config/assetKeys.ts`
- `docs/visual-style.md`
- `docs/cosmicfly-gameplay.md`
- `public/assets/attribution/assets.md`
- `logs/2026-09-01_23-30-00_scale_and_missile_sparks_log.md`

## Key changes

- Phaser Scale FIT + CENTER_BOTH, canvas max 100% — playfield stays 960×540 inside the window.
- Dropped Phaser ParticleEmitter and canvas spark texture (they never showed). Sparks are large ADD circles like BlinkTrail/DebrisBurst.
- Burst 20–28 at launch (radius 8–16), stream from nozzle every 18 ms, embers 10–20 px. WeaponSystem ticks `syncSparks` each frame.

## Verification

- `npm test` / typecheck / build — see session output.
- Manual: FIT letterbox; Space shows a campfire from the tail.

## Status

Ready for review.
