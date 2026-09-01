# Agent Change Log

## Task objective

Искры flare-missiles как костёр из сопла: burst 360° при старте + непрерывный поток из хвоста.

## Files created or modified

- `src/data/missileSparks.ts`
- `src/effects/MissileSparkTrail.ts`
- `src/scenes/PreloadScene.ts`
- `docs/visual-style.md`
- `public/assets/attribution/assets.md`
- `logs/2026-09-01_23-21-04_missile_sparks_log.md`

## Key changes

- Константы эффекта вынесены в `missileSparks.ts` (палитра Ember-костра, burst/stream/ember, текстура 16×16, depth 3).
- Текстура `missile-spark`: белая радиальная точка 16×16 (непрозрачное ядро, мягкий край), tint читается.
- Три ParticleEmitter на пуле снаряда: burst `explode` 14–22 на 360°, поток из сопла ±70° (`emitting = true` после `start()`), редкие угольки.
- Offset сопла = `displayHeight * 0.42` вдоль хвоста; `stop(true)` гасит leftover; gravityY = 0; depth 3.
- Pulse-beam без эмиттера (без изменений в `Projectile`).

## Verification

- `npm test` — 8 passed.
- `npm run typecheck` — успешно.
- `npm run build` — успешно.
- Dev-сервер — запущен (`npm run dev`).
- Ручная проверка Space/ЛКМ — нет browser tools у Штурмана.

## Status

Ready for review.
