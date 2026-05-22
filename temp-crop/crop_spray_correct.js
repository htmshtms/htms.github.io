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
  const image = await Jimp.read('../assets/product_design.png');
  // Section 4 (spray bottle and mist) is located at y: 300 to 355
  // The image is on the left: x: 585 to 645
  const spray = image.clone().crop({
    x: 585,
    y: 300,
    w: 60,
    h: 55
  });
  const enlarged = spray.resize({ w: 300, h: 275 });
  await enlarged.write('../assets/product_spray_large.png');
  await spray.write('../assets/product_spray.png');
  console.log('Saved product_spray.png successfully');
}

main().catch(console.error);
