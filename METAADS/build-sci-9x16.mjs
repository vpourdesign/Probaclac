// SCI 9:16 — capture transparent overlay (1080x1920) → composite sci.mp4 (uncropped) in the bottom band.
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';

const URL = 'http://localhost:3050/METAADS/ad-sci-9x16.html';
const W = 1080, H = 1920, FPS = 30, SECS = 10, TOTAL = FPS * SECS;
const VIDH = 608, VIDY = H - VIDH; // 1312 (fits exactly, no pad overflow)
const framesDir = '/tmp/sci916frames';
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], protocolTimeout: 60000 });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.AD_READY === true', { timeout: 15000 });
await new Promise(r => setTimeout(r, 500));

console.log(`capturing ${TOTAL} transparent overlay frames (${W}x${H})…`);
for (let f = 0; f < TOTAL; f++) {
  const t = Math.min(f / FPS, SECS - 0.001);
  await page.evaluate(`window.AD_TL.pause(${t}); true`);
  await page.screenshot({
    path: `${framesDir}/f_${String(f).padStart(4, '0')}.png`,
    clip: { x: 0, y: 0, width: W, height: H },
    omitBackground: true,
  });
  if (f % 30 === 0) console.log(`  frame ${f}/${TOTAL}`);
}
await browser.close();

fs.mkdirSync('out', { recursive: true });
const out = 'out/ad-sci-9x16.mp4';
const vidLayer = '/tmp/sci916-vidlayer.mp4';
console.log('compositing with sci.mp4 (uncropped, bottom band)…');
// 1) full-width uncropped video (1080x607) onto a 1080x1920 black canvas at y=1313, 30fps
execSync(
  `ffmpeg -y -v error -i sci.mp4 ` +
  `-vf "scale=${W}:${VIDH},tpad=stop_mode=clone:stop_duration=4,fps=${FPS},pad=${W}:${H}:0:${VIDY}:black,format=yuv420p" ` +
  `-t ${SECS} -an "${vidLayer}"`,
  { stdio: 'inherit' }
);
// 2) overlay transparent PNG frames 1:1 (both 30fps)
execSync(
  `ffmpeg -y -v error -i "${vidLayer}" -framerate ${FPS} -i ${framesDir}/f_%04d.png ` +
  `-filter_complex "[0:v][1:v]overlay=0:0,format=yuv420p[outv]" ` +
  `-map "[outv]" -t ${SECS} -r ${FPS} -c:v libx264 -crf 18 -movflags +faststart "${out}"`,
  { stdio: 'inherit' }
);
console.log('DONE →', out);
