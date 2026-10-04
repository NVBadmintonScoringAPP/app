const fs = require('fs');
const zlib = require('zlib');

function decodePNG(filePath) {
  const buffer = fs.readFileSync(filePath);
  // Check PNG signature
  if (buffer.readUInt32BE(0) !== 0x89504E47) {
    throw new Error('Not a PNG');
  }

  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
      bitDepth = buffer[offset + 16];
      colorType = buffer[offset + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  console.log(`PNG Info: ${width}x${height}, bitDepth: ${bitDepth}, colorType: ${colorType}`);

  const compressedData = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressedData);

  const bytesPerPixel = 4;
  const rawBytes = Buffer.alloc(width * height * 4);
  let srcPos = 0;
  let dstPos = 0;

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }

  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    const lineStart = dstPos;
    const prevLineStart = (y - 1) * width * 4;

    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) {
        const raw = decompressed[srcPos++];
        const left = x > 0 ? rawBytes[dstPos - 4] : 0;
        const above = y > 0 ? rawBytes[prevLineStart + x * 4 + c] : 0;
        const aboveLeft = (y > 0 && x > 0) ? rawBytes[prevLineStart + (x - 1) * 4 + c] : 0;

        let val = raw;
        if (filter === 1) val = (raw + left) & 0xff;
        else if (filter === 2) val = (raw + above) & 0xff;
        else if (filter === 3) val = (raw + Math.floor((left + above) / 2)) & 0xff;
        else if (filter === 4) val = (raw + paeth(left, above, aboveLeft)) & 0xff;

        rawBytes[dstPos++] = val;
      }
    }
  }

  const colors = {};
  for (let i = 0; i < rawBytes.length; i += 4) {
    const r = rawBytes[i];
    const g = rawBytes[i + 1];
    const b = rawBytes[i + 2];
    const a = rawBytes[i + 3];
    if (a > 150) {
      const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      colors[hex] = (colors[hex] || 0) + 1;
    }
  }

  // Sort by count
  const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
  console.log('Top 30 colors:');
  sorted.slice(0, 30).forEach(([hex, count]) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    console.log(`#${hex} (R:${r}, G:${g}, B:${b}): ${count}`);
  });

  // Find most vibrant green (G > R and G > B)
  const greens = sorted.filter(([hex]) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return g > 120 && g > r * 1.3 && g > b * 1.3;
  });
  console.log('\nTop Greens in logo:');
  greens.slice(0, 5).forEach(([hex, count]) => console.log(`#${hex}: ${count}`));

  // Find most vibrant red (R > G and R > B)
  const reds = sorted.filter(([hex]) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return r > 160 && r > g * 2 && r > b * 2;
  });
  console.log('\nTop Reds in logo:');
  reds.slice(0, 5).forEach(([hex, count]) => console.log(`#${hex}: ${count}`));
}

decodePNG('public/logo.png');
