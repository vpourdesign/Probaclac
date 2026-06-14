// Capture the SCI overlay (transparent bottom half) → composite sci.mp4 underneath.
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';

const URL = 'http://localhost:3050/METAADS/ad-sci-1x1.html';
const FPS = 30, SECS = 10, TOTAL = FPS * SECS;
const framesDir = '/tmp/sciframes';
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 60000 });
const page = await browser.newPage();
// transparent canvas
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.AD_READY === true', { timeout: 15000 });
await new Promise(r => setTimeout(r, 500));

console.log(`capturing ${TOTAL} transparent overlay frames…`);
for (let f = 0; f < TOTAL; f++) {
  const t = Math.min(f / FPS, SECS - 0.001);
  await page.evaluate(`window.AD_TL.pause(${t}); true`);
  await page.screenshot({
    path: `${framesDir}/f_${String(f).padStart(4, '0')}.png`,
    clip: { x: 0, y: 0, width: 1080, height: 1080 },
    omitBackground: true,
  });
  if (f % 30 === 0) console.log(`  frame ${f}/${TOTAL}`);
}
await browser.close();

fs.mkdirSync('out', { recursive: true });
const out = 'out/ad-sci-1x1.mp4';
const vidLayer = '/tmp/sci-vidlayer.mp4';
console.log('compositing with sci.mp4 (2-step, both 30fps to avoid frame-timing black frames)…');
// 1) normalize the video into the bottom half on a 1080x1080 black canvas at 30fps
execSync(
  `ffmpeg -y -v error -i sci.mp4 ` +
  `-vf "scale=1080:-1,crop=1080:540:0:34,tpad=stop_mode=clone:stop_duration=4,fps=${FPS},pad=1080:1080:0:540:black,format=yuv420p" ` +
  `-t ${SECS} -an "${vidLayer}"`,
  { stdio: 'inherit' }
);
// 2) overlay the transparent PNG frames (both inputs 30fps → clean 1:1)
execSync(
  `ffmpeg -y -v error -i "${vidLayer}" -framerate ${FPS} -i ${framesDir}/f_%04d.png ` +
  `-filter_complex "[0:v][1:v]overlay=0:0,format=yuv420p[outv]" ` +
  `-map "[outv]" -t ${SECS} -r ${FPS} -c:v libx264 -crf 18 -movflags +faststart "${out}"`,
  { stdio: 'inherit' }
);
console.log('DONE →', out);
