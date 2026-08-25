# Ship facing, reverse thrust, blink hop

## Task objective

Launch nose-north, add S-key reverse jets with the same engine loop as W, and an E-key phase hop of five ship lengths that stays inside the playfield.

## Files created

- `.cursor/agents/mechanicist.md` — rules for the ship-feel subagent
- `src/effects/BlinkTrail.ts` — afterimages, cyan streak, origin/dest flashes
- `public/assets/audio/player/ship_blink.ogg` — Kenney `forceField_000.ogg`
- `logs/2026-08-25_22-40-00_ship_mechanics_log.md` — this file

## Files modified

- `src/systems/IntroSequence.ts` — intro ship rotation = nose north
- `src/entities/Player.ts` — north default facing, reverse flames, `tryBlink()`
- `src/managers/InputManager.ts` — `S` reverse thrust, `E` JustDown
- `src/managers/AudioManager.ts` — blink SFX volume
- `src/data/ships.ts` — reverseFlame + blink config
- `src/config/assetKeys.ts` — `SoundKeys.ShipBlink`
- `src/scenes/GameScene.ts` — wire thrust, blink, trail lifecycle
- `public/assets/attribution/assets.md`

## Key decisions

- Sprite art points south; north = `angleOffset + northAngleRad` (`-π`).
- Aim deadzone keeps facing when the pointer sits on the ship (avoids a snap to east).
- Reverse jets reuse `EngineFlame` at smaller scale, splayed from the nose.
- Engine loop plays for `W` or `S`, never doubled.
- Blink VFX: afterimage chain + additive streak (Hyper Light / Dead Cells language).

## Verification

- `npm run typecheck` — clean
- Live capture on `http://127.0.0.1:5181/`: no page errors
- Ready / reverse: ship nose points north; cyan reverse jets sit on the nose (above the hull)
- Blink: ship hops north (red hull ~y 313 → ~y 169), stays on the field

## Status

Done
