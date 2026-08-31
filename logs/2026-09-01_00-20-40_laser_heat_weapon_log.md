# Agent Change Log

## Task objective

Этап 2: подключить `LaserHeatModel` к pulse-beam в `WeaponSystem` и проигрывать процедурную overheat-сирену только во время lockout.

## Files created or modified

- `src/systems/WeaponSystem.ts`
- `src/managers/AudioManager.ts`
- `src/scenes/GameScene.ts`
- `logs/2026-09-01_00-20-40_laser_heat_weapon_log.md`

## Key changes

- `WeaponSystem` владеет `LaserHeatModel`: каждый кадр `update(delta, isFiringPulse())` до выстрела; pulse требует `heatModel.canFirePulse()`; интервал volley из `getPulseIntervalMs()`.
- Ракеты без изменений (`missileWeapon.intervalMs`).
- Публичный `getHeatState()` (`LaserHeatState`) для HUD этапа 3.
- `AudioManager.startOverheatAlarm` / `stopOverheatAlarm`: square-wave 880/660 Гц, период ~0.65 с, громкость 0.08; идемпотентны; OscillatorNode через `scene.sound.context`; `stopFlight` уничтожает ноды.
- `GameScene` синхронизирует сирену по ребру lockout после `weaponSystem.update`; стоп + сброс флага в `deactivateEngineThrust` (blur/pause/hidden/смерть/Game Over/shutdown). Intro не включает сирену.

## Verification

- `npm test` — 7 passed.
- `npm run typecheck` — успешно.
- `npm run build` — успешно (штатное предупреждение Vite о размере чанка).
- Ручная проверка в браузере — не выполнялась (этап 5).

## Status

Ready for review.
