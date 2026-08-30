# Intro handoff: nose north until mouse moves

## Task objective

After intro (and on checkpoint start) the player ship must wake with the nose pointing north. Do not snap facing to the leftover menu-click pointer until the mouse actually moves.

## Files created or modified

- `src/entities/Player.ts` — `faceNorth()` on wake, aim lock until pointer moves > 6 px
- `logs/2026-08-30_22-15-00_intro_nose_north_log.md` — this file

## Key changes

- `setDormant(false)` sets `facingAngle = flightConfig.northAngleRad` and `sprite.rotation = facingAngle + starterShip.angleOffset` (nose-down art → north).
- Constructor and wake both freeze aim: store `activePointer` world coords, skip pointer facing in `update()` while locked.
- Unlock when pointer world position moves more than `AIM_UNLOCK_MOVE_PX` (6) from the freeze point. Flight deadzone (10 px) is unchanged after unlock.
- Checkpoint (`startKm > 0`, no intro) uses the same constructor freeze so the first `update()` cannot yaw toward the menu click.

## Verification

- `npm run typecheck` — clean
- `npm run build` — clean
- Live play — not run in this session (no interactive pass)

## Status

Done
