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
  const image = await Jimp.read('../assets/product_crop_group.png');
  const enlarged = image.resize({ w: 1000, h: 1280 });
  await enlarged.write('../assets/product_crop_group_large.png');
  console.log('Saved product_crop_group_large.png');
}

main().catch(console.error);
