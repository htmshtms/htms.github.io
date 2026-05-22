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
  console.log(`WIDTH: ${image.bitmap.width}`);
  console.log(`HEIGHT: ${image.bitmap.height}`);
}

main().catch(console.error);
