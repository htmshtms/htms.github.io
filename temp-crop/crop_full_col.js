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
  // Crop the full column for product (approx x=580 to 740, y=0 to 800)
  const productCol = image.clone().crop({
    x: 580,
    y: 0,
    w: 160,
    h: 800
  });
  const enlarged = productCol.resize({ w: 800, h: 4000 });
  await enlarged.write('../assets/product_col_large.png');
  console.log('Saved product_col_large.png');
}

main().catch(console.error);
