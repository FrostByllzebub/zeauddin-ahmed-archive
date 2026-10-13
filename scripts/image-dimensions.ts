import fs from 'node:fs';

// Read standard image headers without an image-processing dependency.
export function imageDimensions(file: string) {
  const data = fs.readFileSync(file);
  let width = 0, height = 0;
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    width = data.readUInt32BE(16); height = data.readUInt32BE(20);
  } else if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    const kind = data.toString('ascii', 12, 16);
    if (kind === 'VP8X') { width = data.readUIntLE(24, 3) + 1; height = data.readUIntLE(27, 3) + 1; }
    else if (kind === 'VP8 ') { width = data.readUInt16LE(26) & 0x3fff; height = data.readUInt16LE(28) & 0x3fff; }
    else if (kind === 'VP8L') { const bits = data.readUInt32LE(21); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; }
  } else if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) break;
      const marker = data[offset + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        height = data.readUInt16BE(offset + 5); width = data.readUInt16BE(offset + 7); break;
      }
      offset += 2 + data.readUInt16BE(offset + 2);
    }
  } else if (file.endsWith('.svg')) {
    const svg = data.toString('utf8');
    const viewBox = svg.match(/viewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)["']/);
    width = Number(svg.match(/\bwidth=["']([\d.]+)(?:px)?["']/)?.[1] ?? viewBox?.[1]);
    height = Number(svg.match(/\bheight=["']([\d.]+)(?:px)?["']/)?.[1] ?? viewBox?.[2]);
  }
  if (!(width > 0 && height > 0)) throw new Error(`Unrecognized image dimensions: ${file}`);
  return { width, height };
}
