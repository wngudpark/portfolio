// Optimize static/images -> dist/static/images (resize + compress).
// The repo originals stay full-size; only the deployed copies shrink, so the
// site loads fast while high-res originals remain in the repo. Paths/filenames
// are unchanged, so no frontend or content edits are needed.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'static', 'images');
const OUT = path.join(ROOT, 'dist', 'static', 'images');
const MAX_WIDTH = 1600; // enough for the full-size detail view; thumbnails are smaller

const RASTER = new Set(['.png', '.jpg', '.jpeg', '.webp']);

async function run() {
  if (!fs.existsSync(SRC)) return;
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => !f.startsWith('.'));
  let before = 0;
  let after = 0;
  let count = 0;

  for (const file of files) {
    const srcPath = path.join(SRC, file);
    const outPath = path.join(OUT, file);
    const stat = fs.statSync(srcPath);
    if (!stat.isFile()) continue;
    const ext = path.extname(file).toLowerCase();

    // Non-raster assets (svg, gif, …) are copied through untouched.
    if (!RASTER.has(ext)) {
      fs.copyFileSync(srcPath, outPath);
      continue;
    }

    try {
      let img = sharp(srcPath, { failOn: 'none' }).rotate(); // respect EXIF orientation
      const meta = await img.metadata();
      if (meta.width && meta.width > MAX_WIDTH) {
        img = img.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      }
      if (ext === '.png') img = img.png({ compressionLevel: 9, quality: 80, palette: true });
      else if (ext === '.webp') img = img.webp({ quality: 80 });
      else img = img.jpeg({ quality: 80, mozjpeg: true });

      const buf = await img.toBuffer();
      // Keep whichever is smaller (never make a file bigger than the original).
      if (buf.length < stat.size) {
        fs.writeFileSync(outPath, buf);
        after += buf.length;
      } else {
        fs.copyFileSync(srcPath, outPath);
        after += stat.size;
      }
      before += stat.size;
      count++;
    } catch (err) {
      console.warn(`  ! ${file}: optimize failed (${err.message}); copying original`);
      fs.copyFileSync(srcPath, outPath);
    }
  }

  const mb = (n) => (n / 1048576).toFixed(1);
  console.log(`Optimized ${count} images: ${mb(before)}MB -> ${mb(after)}MB -> dist/static/images/`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
