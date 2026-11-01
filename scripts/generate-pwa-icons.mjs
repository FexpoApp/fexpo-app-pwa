import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Use the same official traced symbol as the application header, without redrawing it.
const root = new URL('../', import.meta.url);
const symbol = await readFile(new URL('public/assets/brand/fexpo-symbol.svg', root), 'utf8');
const paths = symbol.match(/<path\b[^>]*\/>/g);
if (paths?.length !== 3) throw new Error('El isotipo oficial debe contener tres módulos.');
const background = '#D5F24A';
const svg = (maskable = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="${background}"/><g transform="${maskable ? 'translate(32 32) scale(1.12)' : 'scale(1.28)'}">${paths.join('')}</g></svg>\n`;
await writeFile(new URL('public/icons/fexpo-official-v2.svg', root), svg());
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : process.platform === 'win32'
      ? { channel: 'msedge' }
      : {}),
});
try {
  const page = await browser.newPage();
  for (const [name, size, maskable] of [
    ['fexpo-official-v2-192.png', 192, false],
    ['fexpo-official-v2-512.png', 512, false],
    ['fexpo-official-v2-maskable-512.png', 512, true],
    ['fexpo-official-v2-apple-180.png', 180, false],
    ['fexpo-official-v2-favicon-32.png', 32, false],
  ]) {
    const data = await page.evaluate(
      async ({ markup, size }) => {
        const image = new Image();
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, size, size);
        return canvas.toDataURL('image/png').split(',')[1];
      },
      { markup: svg(maskable), size },
    );
    await writeFile(new URL('public/icons/' + name, root), Buffer.from(data, 'base64'));
  }
} finally {
  await browser.close();
}
// Keep previous URLs useful for cached HTML and older installations.
for (const [legacy, current] of [
  ['icon-192.png', 'fexpo-official-v2-192.png'],
  ['icon-512.png', 'fexpo-official-v2-512.png'],
  ['maskable-512.png', 'fexpo-official-v2-maskable-512.png'],
  ['apple-touch-icon.png', 'fexpo-official-v2-apple-180.png'],
])
  await copyFile(new URL('public/icons/' + current, root), new URL('public/icons/' + legacy, root));
console.log('Iconos oficiales exportados en ' + fileURLToPath(new URL('public/icons/', root)));
