# Agent Change Log

## Task objective

Add emerald and ruby crystal HUD counters that reward kills, persist a 100 km checkpoint through a versioned localStorage progress store, expose a menu choice between fresh flight and continuing from the checkpoint, and lay down file scaffolding for a future intermediate base at 100 km.

## Files created

- `src/bases/BaseDefinition.ts`
- `src/data/bases.ts`
- `src/state/GameProgress.ts`
- `src/managers/WalletManager.ts`
- `src/ui/CrystalCounter.ts`

## Files modified

- `src/config/assetKeys.ts` — added `TextureKeys.CrystalGem`.
- `src/scenes/PreloadScene.ts` — procedural gem texture generator.
- `src/systems/StarfieldSystem.ts` — optional `initialDistanceKm` constructor parameter.
- `src/scenes/GameScene.ts` — start-km init, `WalletManager`, checkpoint recording, two shimmering counters in the top-right HUD.
- `src/scenes/MenuScene.ts` — renders one button per unlocked start point.

## Key decisions

- Persist schema v1 uses `{ version: 1, reachedCheckpointsKm: number[] }` (single source of truth). Missing/private-mode storage is silently ignored; wrong version resets state on load. Extensible for future bases without breaking migrations.
- `Waypoint Alpha` at 100 km lives in `src/data/bases.ts` with an empty `services` list. Scene, UI and interaction for the actual base are intentionally out of scope.
- Crystals are earned only on confirmed kills through `WalletManager.awardForKilledEnemy`, driven by `enemy.getEnemyId()` — no duplicated logic between spawn/collision systems.
- On first reach of a base checkpoint (100 km), the current emerald/ruby counts are snapshotted into progress v2 (`checkpointWallets`). Continuing from that checkpoint restores those exact balances; New flight always starts at 0/0.
- One procedural rhombic gem texture is generated in `PreloadScene`; both emerald and ruby counters reuse it and shimmer through a per-frame palette lerp on `tint`, plus a small alpha and scale pulse. No allocations per frame.
- `StarfieldSystem` gained an optional `initialDistanceKm` argument (default 0), so starting from a checkpoint requires no additional plumbing and does not change scroll math or `getDistanceKm()`.
- Checkpoint recording iterates `bases` once per frame and stops re-recording per session via `recordedCheckpoints`.

## Verification

- `npm run typecheck` — passed.
- `npm run build` — passed (existing Vite chunk-size warning only).
- IDE lint on changed files — no diagnostics.
- Manual browser verification — pending: crystal counters shimmer and increment on kill; distance shows correctly when continuing from 100 km; menu shows two options only after the checkpoint is reached.

## Status

Ready for review.
