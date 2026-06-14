// Records an AD html (GSAP paused timeline as window.AD_TL, optional <video id="vid">)
// into PNG frames, then assembles an MP4 with ffmpeg.
// Usage: node ad-record.mjs <url> <outName> [fps] [seconds]
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';

const url  = process.argv[2];
const name = process.argv[3] || 'ad';
const FPS  = parseInt(process.argv[4] || '30', 10);
const SECS = parseFloat(process.argv[5] || '10');
const TOTAL = Math.round(FPS * SECS);

const framesDir = `/tmp/adframes-${name}`;
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
  protocolTimeout: 60000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.AD_READY === true', { timeout: 15000 });
// pause + preroll any video so frames decode
await page.evaluate(() => {
  const v = document.getElementById('vid');
  if (v) { v.pause(); v.currentTime = 0; }
});
await new Promise(r => setTimeout(r, 900));

const vidDur = await page.evaluate(() => {
  const v = document.getElementById('vid');
  return v ? (v.duration || 0) : 0;
});

console.log(`recording ${TOTAL} frames @ ${FPS}fps (video ${vidDur.toFixed(2)}s)…`);
for (let f = 0; f < TOTAL; f++) {
  const t = Math.min(f / FPS, SECS - 0.001);
  // 1) GSAP timeline
  await page.evaluate(`window.AD_TL.pause(${t}); true`);
  // 2) seek the video (if any) to the same time, clamped to its duration
  if (vidDur > 0) {
    const vt = Math.min(t, vidDur - 0.02);
    await page.evaluate((vt) => new Promise(res => {
      const v = document.getElementById('vid');
      if (!v) return res();
      if (Math.abs(v.currentTime - vt) < 0.0005) return res();
      let done = false;
      const ok = () => { if (done) return; done = true; v.removeEventListener('seeked', ok); res(); };
      v.addEventListener('seeked', ok);
      v.currentTime = vt;
      setTimeout(ok, 400); // safety
    }), vt);
  }
  await page.screenshot({ path: `${framesDir}/f_${String(f).padStart(4, '0')}.png`, clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  if (f % 30 === 0) console.log(`  frame ${f}/${TOTAL}`);
}
await browser.close();

fs.mkdirSync('out', { recursive: true });
const out = `out/${name}.mp4`;
execSync(
  `ffmpeg -y -framerate ${FPS} -i ${framesDir}/f_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "${out}"`,
  { stdio: 'inherit' }
);
console.log('DONE →', out);
