import sharp from 'sharp';
import fs from 'node:fs';
const W = 1200, H = 630;
// Brand background: warm cream with teal panel + pink blob
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf8f4"/>
      <stop offset="1" stop-color="#f2e6d7"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1080" cy="90" r="230" fill="#fa619a" opacity="0.22"/>
  <circle cx="150" cy="560" r="180" fill="#0b384f" opacity="0.10"/>
  <rect x="0" y="${H-16}" width="${W}" height="16" fill="#0b384f"/>
  <rect x="0" y="${H-16}" width="${W*0.42}" height="16" fill="#fa619a"/>
  <text x="600" y="565" font-family="Georgia, 'Times New Roman', serif" font-size="36" fill="#0b384f" text-anchor="middle" font-style="italic" opacity="0.92">Le magazine des choix malins</text>
</svg>`);
const logoPng = await sharp('public/logo-microsave.svg', { density: 300 }).resize({ width: 450 }).png().toBuffer();
const meta = await sharp(logoPng).metadata();
await sharp(bg)
  .composite([{ input: logoPng, left: Math.round((W - meta.width) / 2), top: 115 }])
  .png()
  .toFile('public/og-default.png');
console.log('public/og-default.png created', fs.statSync('public/og-default.png').size, 'bytes');
