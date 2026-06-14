import sharp from "sharp";

const SRC = "C:/Users/ckear/Downloads/JustCubeWhiteBackground.jpg";
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// Find the cube's true bounding box by scanning for pixels that are clearly
// non-white (black outline + blue face), ignoring faint JPEG/watermark noise.
async function findCubeBox() {
  const { data, info } = await sharp(SRC)
    .flatten({ background: "#ffffff" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const THRESH = 160; // a channel below this = real ink, not near-white noise
  let minX = width, minY = height, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i] < THRESH || data[i + 1] < THRESH || data[i + 2] < THRESH) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) throw new Error("no cube pixels found");
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const BOX = await findCubeBox();
console.log("cube box:", BOX);

// Crop to the cube, then center it on a square white canvas with even padding
// all around (cube fills ~78% of the icon).
async function centered(size, contentRatio = 0.78) {
  const inner = Math.round(size * contentRatio);
  const pad = Math.round((size - inner) / 2);
  return sharp(SRC)
    .flatten({ background: "#ffffff" })
    .extract(BOX)
    .resize(inner, inner, { fit: "contain", background: WHITE })
    .extend({
      top: pad,
      bottom: size - inner - pad,
      left: pad,
      right: size - inner - pad,
      background: WHITE,
    })
    .png()
    .toBuffer();
}

// Build a real .ico containing PNG-encoded entries at 16/32/48 px.
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  const datas = [];
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2); // colors
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // planes
    dir.writeUInt16LE(32, o + 6); // bpp
    dir.writeUInt32LE(e.buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.buf.length;
    datas.push(e.buf);
  });
  return Buffer.concat([header, dir, ...datas]);
}

const icoSizes = [16, 32, 48];
const icoEntries = [];
for (const s of icoSizes) icoEntries.push({ size: s, buf: await centered(s) });
const fs = await import("node:fs/promises");
await fs.writeFile("app/favicon.ico", buildIco(icoEntries));
await fs.writeFile("app/icon.png", await centered(512));
console.log("wrote app/favicon.ico (16/32/48) and app/icon.png (512)");
