// Converts a TrueType font into the typeface JSON that three.js' FontLoader reads,
// keeping only the glyphs the film needs. Usage: node tools/make-typeface.mjs path/to/Anton-Regular.ttf
import { readFileSync, writeFileSync } from "node:fs";
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";

const src = process.argv[2];
if (!src) { console.error("usage: node tools/make-typeface.mjs Anton-Regular.ttf"); process.exit(1); }
const buf = readFileSync(src);
const json = new TTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const keep = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-'".split(""));
for (const ch of Object.keys(json.glyphs)) if (!keep.has(ch)) delete json.glyphs[ch];
writeFileSync("assets/fonts/anton.typeface.json", JSON.stringify(json));
console.log("glyphs:", Object.keys(json.glyphs).length, "resolution:", json.resolution, "bytes:", JSON.stringify(json).length);
