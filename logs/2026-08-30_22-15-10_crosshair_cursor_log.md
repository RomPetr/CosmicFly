# Agent Change Log

## Task objective

Заменить системный курсор мыши на `crosshair_color_b.png` (Kenney UI Pack Sci-Fi) как прицел корабля игрока.

## Files created or modified

- `public/assets/ui/crosshair_color_b.png`
- `src/config/assetKeys.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/MenuScene.ts`
- `public/assets/attribution/assets.md`
- `logs/2026-08-30_22-15-10_crosshair_cursor_log.md`

## Key changes

- Скопирован PNG 28×28 (530 bytes, palette) в `public/assets/ui/`.
- Hotspot курсора: 14 14 (центр, width/2 и height/2).
- CSS: `url(/assets/ui/crosshair_color_b.png) 14 14, crosshair`.
- `this.input.setDefaultCursor(AimCursorCss)` в `GameScene.create` и `MenuScene.create`.
- Кнопки с `useHandCursor: true` не трогались — pointer на hover сохраняется.
- Текстура Phaser не регистрировалась; спрайт на сцену не добавлялся.
- Атрибуция Kenney UI Pack Sci-Fi (CC0, 2026-08-30).

## Verification

- PNG IHDR + PIL: 28×28, mode P, 530 bytes.
- `npm run typecheck` — успешно.
- `npm run build` — успешно.

## Status

Ready for review.
