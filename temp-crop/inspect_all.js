import { createJimp } from "@jimp/core";
import { defaultFormats, defaultPlugins } from "jimp";
import webp from "@jimp/wasm-webp";
import fs from 'fs';
import { fileURLToPath } from 'url';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  const urlStr = url.toString();
  if (urlStr.startsWith('file://')) {
    const filePath = fileURLToPath(urlStr);
    const buffer = fs.readFileSync(filePath);
    return new Response(buffer, {
      headers: { 'Content-Type': urlStr.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' }
    });
  }
  return originalFetch(url, options);
};

const Jimp = createJimp({
  formats: [...defaultFormats, webp],
  plugins: defaultPlugins,
});

async function main() {
  const images = [
    'crop_bottom_right.png',
    'crop_product.png',
    'crop_top_right.png',
    'product_crop_group.png',
    'product_design.png'
  ];
  for (const imgName of images) {
    const image = await Jimp.read('../assets/' + imgName);
    console.log(`${imgName}: ${image.bitmap.width}x${image.bitmap.height}`);
  }
}

main().catch(console.error);
