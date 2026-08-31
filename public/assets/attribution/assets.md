# Asset Credits

## Kenney Space Shooter Remastered

Source:
https://kenney.nl/assets/space-shooter-remastered

License:
Creative Commons CC0 1.0

Used in:
- player ships;
- enemy ships;
- meteors;
- projectiles;
- explosions;
- UI elements.

## Kenney Space Shooter Extension

Source:
https://kenney.nl/assets/space-shooter-extension

License:
Creative Commons CC0 1.0

Author:
Kenney Vleugels (Kenney.nl)

Engine flame obtained:
2026-08-22

Middle enemy sprite obtained:
2026-08-22

Space station sprite obtained:
2026-08-24

Used files:
- `public/assets/ships/player/spaceShips_001.png` — player ship;
- `public/assets/enemies/sting-dart/spaceShips_008.png` — sting-dart (preloaded, not spawned);
- `public/assets/projectiles/missiles/spaceMissiles_006.png` — flare missiles;
- `public/assets/meteors/ash-chunk/spaceMeteors_001.png` — ash chunk (larger silhouette);
- `public/assets/meteors/ash-chunk/spaceMeteors_003.png` — ash chunk (taller silhouette).
- `public/assets/effects/engine/engine_flame.png` — from `spaceEffects_018.png`, player engine flame.
- `public/assets/enemies/middle-enemy/spaceShips_007_1.png` — from `spaceShips_007_1.png`, Middle Enemy.
- `public/assets/stations/space_station.png` — from `Sprites X2/Station/spaceStation_026.png`, launch station in the intro cutscene.

## Kenney Sci-fi Sounds

Source:
https://kenney.nl/assets/sci-fi-sounds

License:
Creative Commons CC0 1.0

Author:
Kenney Vleugels (Kenney.nl)

Obtained:
- 2026-08-19 — player and enemy audio;
- 2026-08-22 — engine audio and Middle Enemy blaster;
- 2026-08-23 — player explosion;
- 2026-08-24 — ship launch;
- 2026-08-25 — ship blink.

Used files:
- `public/assets/audio/player/blaster_shoot.ogg` — from `laserSmall_002`;
- `public/assets/audio/player/rocket_launch.ogg` — from `forceField_001`;
- `public/assets/audio/player/player_hit.ogg` — from `impactMetal_002.ogg`;
- `public/assets/audio/enemy/enemy_blaster.ogg` — from `laserLarge_000`;
- `public/assets/audio/enemy/middle_enemy_blaster.ogg` — from `laserLarge_002.ogg`, Middle Enemy twin-beam volley;
- `public/assets/audio/enemy/enemy_missile.ogg` — from `forceField_003`;
- `public/assets/audio/engine/engine_low.ogg` — from `spaceEngineLow_002.ogg`;
- `public/assets/audio/engine/engine_large.ogg` — from `spaceEngineLarge_001.ogg`;
- `public/assets/audio/player/player_explosion.ogg` — from `explosionCrunch_004.ogg`, player ship destruction.
- `public/assets/audio/player/ship_launch.ogg` — from `thrusterFire_000.ogg`, 5-second launch burn in the intro cutscene.
- `public/assets/audio/player/ship_blink.ogg` — from `forceField_000.ogg`, short whoosh for the E-key phase hop.

## Cuzco — Explosion

Source:
https://opengameart.org/content/explosion

License:
Creative Commons CC0 1.0 (public domain)

Author:
Cuzco (OpenGameArt.org)

Obtained:
2026-08-23

Used files:
- `public/assets/effects/explosion/explosion_sheet.png` — from `exp2_0.png`, 4x4 sprite sheet of 16 frames at 64x64. Sole explosion clip: player ship death (`spawnBurst`) and flare-missile impact (`spawnCompact`).

## Procedural runtime assets

Not third-party files. Generated in the browser at preload / play time.

- Overheat klaxon — Web Audio oscillator (square, 880/660 Hz), no sample file. Plays during pulse-beam lockout.
- Missile spark texture — Phaser graphics 6×6 soft amber point (`TextureKeys.MissileSpark`), used by flare-missile tail emitters. Not in `TexturePaths`.

## Timberlate007 — Free Shoot`em Up starter Asset Pack

Pack:
Free Shoot`em Up starter Asset Pack

Author:
Timberlate007

Source:
https://timberlate007.itch.io/shootem-up

Obtained:
2026-08-28

License:
Free starter pack on itch.io. The pack page describes it as absolutely free. No explicit CC0 statement was on the page at the time of obtainment.

Used:
- `hp_bonus.png` → `public/assets/pickups/hp_bonus_sheet.png` — health gift, sliced to 5 frames, white background removed;
- `shield_bonus.png` → `public/assets/pickups/shield_bonus_sheet.png` — shield gift, sliced to 5 frames, white background removed.

## Cute UI Interact Sound Effects Pack

Pack:
Cute UI Interact Sound Effects Pack (Boing Bounce)

Source:
User-provided asset pack in `free_assets/Cute_UI_Interact_Sound_Effects_Pack/`

Obtained:
2026-08-29

License:
Royalty-free for personal and commercial game projects; raw files may not be resold or redistributed separately (per pack readme).

Used files:
- `Boing_Bounce/SFX_Boing_Bounce_2.wav` → `public/assets/audio/player/gift_pickup.wav` — gift pickup SFX.
- `Cash_Register/SFX_Cash_Register_Buy_Click_1.wav` → `public/assets/audio/player/ship_ram.wav` — ship ram (hull contact) SFX.
- `Footstep/Huge/SFX_Movement_Footstep_Huge_1.wav` → `public/assets/audio/player/meteor_ram.wav` — meteor ram SFX (used 2026-08-30).

## Mixkit — metal tool falling

Source:
`free_assets/sounds/mixkit-metal-tool-falling-820.wav` (Mixkit)

Obtained:
2026-08-30

License:
Mixkit sound, used as middle-enemy ram SFX. License terms were not copied into the repo; not claimed as CC0.

Used files:
- `mixkit-metal-tool-falling-820.wav` → `public/assets/audio/enemy/middle_ram.wav` — Middle Enemy ram SFX.

## Kenney UI Pack Sci-Fi

Source:
https://kenney.nl/assets/ui-pack-sci-fi

License:
Creative Commons CC0 1.0

Author:
Kenney Vleugels (Kenney.nl)

Obtained:
2026-08-30

Used files:
- `PNG/Blue/Default/crosshair_color_b.png` → `public/assets/ui/crosshair_color_b.png` — player aim cursor (CSS system cursor).