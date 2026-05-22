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
  
  // The product column in product_design.png is around x: 578, y: 0, w: 162, h: 800.
  // We want to slice it in 5 vertical parts and enlarge each part to 800x800.
  const sliceHeight = 160; // 800 / 5
  
  for (let i = 0; i < 5; i++) {
    const slice = image.clone().crop({
      x: 578,
      y: i * sliceHeight,
      w: 162,
      h: sliceHeight
    });
    const enlarged = slice.resize({ w: 800, h: 800 });
    const outPath = `../assets/product_slice_${i + 1}.png`;
    await enlarged.write(outPath);
    console.log(`Saved ${outPath}`);
  }
}

main().catch(console.error);
