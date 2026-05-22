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

import { createJimp } from "@jimp/core";
import { defaultFormats, defaultPlugins } from "jimp";
import webp from "@jimp/wasm-webp";

const Jimp = createJimp({
  formats: [...defaultFormats, webp],
  plugins: defaultPlugins,
});

async function main() {
  const image = await Jimp.read('../assets/product_design.png');
  
  // Crop 1: Top Right (contains logo, bottle zoom-in, etc.)
  const cropTopRight = image.clone().crop({
    x: 550,
    y: 0,
    w: 241,
    h: 180
  });
  await cropTopRight.write('../assets/crop_top_right.png');
  
  // Crop 2: Product page (taller from y=80, wider x=580 to 740)
  const cropProduct = image.clone().crop({
    x: 580,
    y: 80,
    w: 160,
    h: 440
  });
  await cropProduct.write('../assets/crop_product.png');

  // Crop 3: Bottom Right
  const cropBottomRight = image.clone().crop({
    x: 550,
    y: 520,
    w: 241,
    h: 280
  });
  await cropBottomRight.write('../assets/crop_bottom_right.png');
  
  console.log('Saved all cropped files');
}

main().catch(console.error);
