/**
 * Captures north-facing launch plus reverse thrust and blink.
 * Usage: node scripts/shoot_mechanics.mjs [url]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'scripts', 'out');
const URL = process.argv[2] ?? 'http://127.0.0.1:5181/';
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
  await sleep(2200);

  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error('Canvas has no bounding box');
  }

  await page.mouse.click(box.x + 480, box.y + 310);
  await sleep(3400);
  await page.screenshot({ path: join(OUT_DIR, 'mech_1_launch.png') });
  console.log('captured launch');

  await sleep(3600);
  await page.screenshot({ path: join(OUT_DIR, 'mech_2_ready.png') });
  console.log('captured ready');

  // Aim north so reverse jets and blink travel up the screen.
  await page.mouse.move(box.x + 480, box.y + 40);
  await page.keyboard.press('w');
  await sleep(200);

  await page.keyboard.down('s');
  await sleep(200);
  await page.screenshot({ path: join(OUT_DIR, 'mech_3_reverse.png') });
  console.log('captured reverse');
  await page.keyboard.up('s');

  await page.keyboard.press('e');
  await sleep(80);
  await page.screenshot({ path: join(OUT_DIR, 'mech_4_blink.png') });
  console.log('captured blink');

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
