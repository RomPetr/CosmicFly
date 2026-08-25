/**
 * Captures the launch cutscene from the running dev server.
 * Usage: node scripts/shoot_intro.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'scripts', 'out');
const URL = process.argv[2] ?? 'http://localhost:5174/';

/** Milliseconds after the flight starts, matched to the cutscene phases. */
const SHOTS = [
  [800, 'shot_1_hold'],
  [3400, 'shot_2_launch'],
  [4300, 'shot_3_depart_start'],
  [5100, 'shot_4_depart_mid'],
  [6000, 'shot_5_depart_late'],
  [6900, 'shot_6_ready'],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await page.goto(URL, { waitUntil: 'load' });
  const canvas = page.locator('canvas');
  await canvas.waitFor({ state: 'visible', timeout: 30000 });
  await sleep(2500);

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error('Canvas has no bounding box');
  }

  await page.screenshot({ path: join(OUT_DIR, 'shot_0_menu.png') });
  // "New flight" sits just below the centre of the 960x540 canvas.
  await page.mouse.click(box.x + 480, box.y + 310);

  let elapsed = 0;
  for (const [at, name] of SHOTS) {
    await sleep(at - elapsed);
    elapsed = at;
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`) });
    console.log('captured', name, `${at}ms`);
  }

  // Press a movement key and confirm gameplay takes over.
  await page.keyboard.down('w');
  await sleep(900);
  await page.screenshot({ path: join(OUT_DIR, 'shot_7_flying.png') });
  await page.keyboard.up('w');

  await browser.close();

  if (errors.length > 0) {
    console.log('--- page errors ---');
    for (const error of errors) {
      console.log(error);
    }
    process.exitCode = 1;
  } else {
    console.log('no page errors');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
