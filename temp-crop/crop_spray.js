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
  // Crop the spray section
  // In product_design.png (which is 791x800), the product column is x: 580-740.
  // The spray section is in the lower portion of the product column.
  // Let's crop x: 585, y: 350, w: 60, h: 70
  const spray = image.clone().crop({
    x: 585,
    y: 350,
    w: 60,
    h: 70
  });
  const enlarged = spray.resize({ w: 300, h: 350 });
  await enlarged.write('../assets/product_spray_large.png');
  await spray.write('../assets/product_spray.png');
  console.log('Saved product_spray.png');
}

main().catch(console.error);
