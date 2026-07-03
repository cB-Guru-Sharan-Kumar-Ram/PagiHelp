// Dev helper: prints the exact SQL the installed pagi-help produces for each demo
// example, so the strings baked into utils/demoData.js stay accurate.
// Run from the site/ dir: node scripts/gen-demo-sql.mjs
import { createRequire } from "node:module";
import { EXAMPLES, optionsFor } from "../docs/.vitepress/theme/utils/demoData.js";

const require = createRequire(import.meta.url);
const PagiHelpV2 = require("pagi-help/v2");

for (const ex of EXAMPLES) {
  const options = optionsFor(ex.table);
  const out = {};
  for (const dialect of ["mysql", "postgres"]) {
    out[dialect] = new PagiHelpV2({ dialect }).paginate(ex.request, options).query;
  }
  console.log(`\n# ${ex.id}`);
  console.log("mysql   :", out.mysql);
  console.log("postgres:", out.postgres);
}
