// Lightweight SQL tokenizer shared by the hero console and dialect showcase.
// Returns [{ t, cls }] where cls ∈ k(eyword) s(tring) n(umber) p(unct) w(hitespace) i(dent).

const KEYWORDS = new Set(
  ("select from where order by limit offset as and or in not like ilike asc " +
    "desc union all is null on join left right inner count distinct group having")
    .split(" ")
);

// Punctuation includes JS object syntax ({ } [ ] :) so request objects render, plus SQL/Postgres operators.
const PUNCT = String.raw`[(),.?*;:=<>!~@|&+\-/{}\[\]]+`;
const RE = new RegExp(
  `('[^']*'|\\$\\d+|\\b\\d+\\b|[A-Za-z_][\\w]*|\`[^\`]*\`|"[^"]*"|\\s+|${PUNCT})`,
  "g"
);
const PUNCT_RE = new RegExp(`^${PUNCT}$`);

export function tokenize(sql) {
  const out = [];
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(sql))) {
    const t = m[0];
    let cls = "i";
    if (/^\s+$/.test(t)) cls = "w";
    else if (/^'.*'$/.test(t) || /^".*"$/.test(t) || /^`.*`$/.test(t)) cls = "s";
    else if (/^\$\d+$/.test(t) || /^\d+$/.test(t)) cls = "n";
    else if (/^[A-Za-z_]/.test(t) && KEYWORDS.has(t.toLowerCase())) cls = "k";
    else if (PUNCT_RE.test(t)) cls = "p";
    out.push({ t, cls });
  }
  return out;
}
