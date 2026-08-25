# Intro cutscene — launch from station

## Task objective

Add a cinematic opening when starting a new flight: hold a close-up of the home station for 3 seconds, fly a miniature player ship out of its lower airlock, shrink the station off the bottom of the screen while the ship grows to full size, keep the starfield frozen until the player presses a movement key, and play a 5-second launch burn.

## Files created

- `public/assets/stations/space_station.png` — Kenney `spaceStation_026.png` (Sprites X2)
- `public/assets/audio/player/ship_launch.ogg` — Kenney `thrusterFire_000.ogg` (5.0 s)
- `src/data/intro.ts` — timings, layout ratios, depths, prompt style
- `src/systems/IntroSequence.ts` — state machine Hold → Launch → Depart → AwaitInput
- `logs/2026-08-24_23-15-00_intro_cutscene_log.md` — this file

## Files modified

- `src/config/assetKeys.ts` — `TextureKeys.SpaceStation`, `SoundKeys.ShipLaunch`
- `src/scenes/PreloadScene.ts` — load station texture
- `src/systems/StarfieldSystem.ts` — `setScrollEnabled()` (twinkle without drift)
- `src/entities/Player.ts` — `setDormant()` (hide + disable body, no scale changes)
- `src/managers/AudioManager.ts` — stoppable `playLaunchCue()` / `stopLaunchCue()`
- `src/managers/InputManager.ts` — `isMovementKeyDown()`
- `src/scenes/GameScene.ts` — gate gameplay behind intro when `startKm === 0`
- `public/assets/attribution/assets.md` — station + launch sound credits
- `docs/cosmicfly-architecture.md` — IntroSequence + start flow

## Key decisions

- Separate intro ship `Image` so the real `Player` collider never rescales.
- Poses are pure functions of elapsed time (no tweens) for clean shutdown.
- Occlusion uses depth layers only (`ship` behind `station` until launch clears).
- Cutscene plays only on a new flight (`startKm === 0`); checkpoint continues skip it.
- Spawn/meteor systems start only after the cutscene finishes.
- Research ([intro cinematics](a65e5b49-d600-4343-94d9-244db074b1b6)) preferred Timeline for parallel motion; architecture ([Commander](da187c2d-0716-4e6a-b0b9-ab5ef34d7ea7)) chose manual clocks — followed Commander.

## Verification

- `npm run typecheck` — clean
- Playwright capture on `http://127.0.0.1:5180/`: hold → launch → depart → prompt → flying, no page errors; distance stayed `0 km` until movement; after `W`, enemies/meteors spawned and HUD showed `1 km`

## Status

Done
