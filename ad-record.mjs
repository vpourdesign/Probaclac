// Records an AD html (GSAP paused timeline exposed as window.AD_TL)
// into PNG frames, then assembles an MP4 with ffmpeg.
// Usage: node ad-record.mjs <url> <outName> [fps] [seconds]
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';

const url  = process.argv[2] || 'http://localhost:3050/landings/pbl-home-preview/ad-fb-adultes-1x1.html';
const name = process.argv[3] || 'ad-fb-adultes-1x1';
const FPS  = parseInt(process.argv[4] || '30', 10);
const SECS = parseFloat(process.argv[5] || '10');
const TOTAL = Math.round(FPS * SECS);

const framesDir = `/tmp/adframes-${name}`;
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.AD_READY === true', { timeout: 15000 });
// let images decode
await new Promise(r => setTimeout(r, 800));

console.log(`recording ${TOTAL} frames @ ${FPS}fps…`);
for (let f = 0; f < TOTAL; f++) {
  const t = Math.min(f / FPS, SECS - 0.001);
  await page.evaluate(`window.AD_TL.pause(${t}); true`);
  await page.screenshot({
    path: `${framesDir}/f_${String(f).padStart(4, '0')}.png`,
    clip: { x: 0, y: 0, width: 1080, height: 1080 },
  });
  if (f % 30 === 0) console.log(`  frame ${f}/${TOTAL}`);
}
await browser.close();

const outDir = 'runway_outputs/videos/ads';
fs.mkdirSync(outDir, { recursive: true });
const out = `${outDir}/${name}.mp4`;
execSync(
  `ffmpeg -y -framerate ${FPS} -i ${framesDir}/f_%04d.png ` +
  `-c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "${out}"`,
  { stdio: 'inherit' }
);
console.log('DONE →', out);
