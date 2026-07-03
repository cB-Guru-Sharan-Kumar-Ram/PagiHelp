// Pre-bundle the published pagi-help package into a browser global for the demo/playground.
// Output is a classic IIFE (sloppy mode), NOT an ES module: the library writes to a
// getter-only inherited static — a no-op in sloppy CJS but a throw under ESM strict mode.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const entry = require.resolve("pagi-help/v2");
const outfile = fileURLToPath(
  new URL("../docs/public/pagihelp.global.js", import.meta.url)
);
const cryptoShim = fileURLToPath(
  new URL("../docs/.vitepress/shims/crypto.js", import.meta.url)
);

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: "iife",
  globalName: "__PagiHelp",
  platform: "browser",
  target: "es2019",
  legalComments: "none",
  alias: {
    // Node's crypto -> tiny browser shim (only used by cursor fingerprints).
    crypto: cryptoShim,
  },
});

console.log(`[build-lib] wrote ${outfile}`);
