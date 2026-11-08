// Bundles the film (three.js + src/film) into one minified file the page loads.
// Usage: npm install && npm run build
import { build } from "esbuild";

await build({
  entryPoints: ["src/film/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  outfile: "assets/js/film.js",
  legalComments: "eof",
  logLevel: "info",
});
