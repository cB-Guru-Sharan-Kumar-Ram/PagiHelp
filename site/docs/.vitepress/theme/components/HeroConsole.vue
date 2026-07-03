<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { withBase } from "vitepress";
import { tokenize } from "../utils/sql.js";

// The fixed request the hero compiles — live engine when available, static fallback otherwise.
const REQUEST = {
  search: "Active",
  filters: [["status", "IN", ["Active", "Paused"]]],
  sort: { attributes: ["created_at"], sorts: ["desc"] },
  pageNo: 1,
  itemsPerPage: 10,
};
const OPTIONS = [
  {
    tableName: "events",
    columnList: [
      { name: "id", alias: "id" },
      { name: "status", alias: "status" },
      { name: "created_at", alias: "created_at" },
    ],
    searchColumnList: [{ name: "status" }],
  },
];

const FALLBACK = {
  mysql:
    "SELECT id AS id,status AS status,created_at AS created_at FROM `events` " +
    "WHERE (status IN (?,?)) AND ( status LIKE ? ) " +
    "ORDER BY `created_at`DESC,`id`DESC LIMIT ?,?",
  postgres:
    'SELECT id AS "id",status AS "status",created_at AS "created_at" FROM "events" ' +
    'WHERE (status IN (?,?)) AND ( status LIKE ? ) ' +
    'ORDER BY "created_at"DESC,"id"DESC LIMIT ? OFFSET ?',
};

const dialect = ref("mysql");
let PagiHelpV2 = null;

// Loads the same pre-bundled library global the Playground uses.
function loadEngine() {
  return new Promise((resolve, reject) => {
    if (globalThis.window === undefined) return reject(new Error("ssr"));
    if (globalThis.__PagiHelp) return resolve(globalThis.__PagiHelp);
    const s = document.createElement("script");
    s.src = withBase("/pagihelp.global.js");
    s.async = true;
    s.onload = () =>
      globalThis.__PagiHelp
        ? resolve(globalThis.__PagiHelp)
        : reject(new Error("no global"));
    s.onerror = () => reject(new Error("load failed"));
    document.head.appendChild(s);
  });
}

function compileSql() {
  try {
    if (!PagiHelpV2) throw new Error("no engine");
    const p = new PagiHelpV2({ dialect: dialect.value });
    const { query } = p.paginate(REQUEST, OPTIONS);
    return query;
  } catch {
    return FALLBACK[dialect.value];
  }
}

// Typed, highlighted reveal of the generated SQL.
const tokens = ref([]);
const full = ref("");
const shown = ref(0);
let timer = null;

const visibleTokens = computed(() => {
  const res = [];
  let acc = 0;
  for (const tok of tokens.value) {
    const end = acc + tok.t.length;
    if (end <= shown.value) res.push(tok);
    else if (acc < shown.value)
      res.push({ t: tok.t.slice(0, shown.value - acc), cls: tok.cls });
    else break;
    acc = end;
  }
  return res;
});
const typing = computed(() => shown.value < full.value.length);

function startTyping(sql) {
  full.value = sql;
  tokens.value = tokenize(sql);
  shown.value = 0;
  if (timer) clearInterval(timer);
  const reduce =
    globalThis.window !== undefined &&
    globalThis.matchMedia &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    shown.value = sql.length;
    return;
  }
  const step = Math.max(1, Math.round(sql.length / 90));
  timer = setInterval(() => {
    shown.value = Math.min(full.value.length, shown.value + step);
    if (shown.value >= full.value.length) clearInterval(timer);
  }, 18);
}

function refresh() {
  startTyping(compileSql());
}

onMounted(async () => {
  try {
    const engine = await loadEngine();
    PagiHelpV2 = engine && engine.default ? engine.default : engine;
  } catch {
    PagiHelpV2 = null; // fallback strings used
  }
  refresh();
});
onBeforeUnmount(() => timer && clearInterval(timer));
watch(dialect, refresh);

/* Request block: built from a JS string (whitespace preserved) then tokenized,
   so multi-line indentation survives Vue's template whitespace condensing. */
const reqText = computed(
  () => `const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "${dialect.value}" });

pagiHelp.paginate({
  search: "Active",
  filters: [["status", "IN", ["Active", "Paused"]]],
  sort: { attributes: ["created_at"], sorts: ["desc"] },
  pageNo: 1,
  itemsPerPage: 10,
}, [{
  tableName: "events",
  columnList: [
    { name: "id", alias: "id" },
    { name: "status", alias: "status" },
    { name: "created_at", alias: "created_at" },
  ],
  searchColumnList: [{ name: "status" }],
}]);`
);
const reqTokens = computed(() => tokenize(reqText.value));
</script>

<template>
  <section class="hero">
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="kicker">// pagination query builder</p>
        <h1 class="headline">
          Pagination that<br /><span class="grad">compiles to SQL.</span>
        </h1>
        <p class="sub">
          One small helper turns a request object into safe, parameterized SQL
          for <strong>MySQL</strong> and <strong>PostgreSQL</strong> — filters,
          search, sorting, unions, and cursor pagination included.
        </p>

        <div class="cta">
          <a class="btn btn-brand" :href="withBase('/guide/getting-started')"
            >Get Started</a
          >
          <a class="btn btn-alt" :href="withBase('/playground')">Playground</a>
          <a
            class="btn btn-ghost"
            href="https://github.com/Codebucket-Solutions/PagiHelp"
            target="_blank"
            rel="noreferrer"
            >GitHub ↗</a
          >
        </div>

        <div class="pills">
          <span class="pill">mysql</span>
          <span class="pill">postgres</span>
          <span class="pill">cursor</span>
          <span class="pill">parameterized</span>
        </div>
      </div>

      <div class="console" aria-label="Live request to SQL example">
        <div class="bar">
          <span class="dots"><i></i><i></i><i></i></span>
          <span class="tab">request.js</span>
          <span class="seg">
            <button
              :class="{ on: dialect === 'mysql' }"
              :aria-pressed="dialect === 'mysql'"
              aria-label="Show MySQL output"
              @click="dialect = 'mysql'"
            >
              MySQL
            </button>
            <button
              :class="{ on: dialect === 'postgres' }"
              :aria-pressed="dialect === 'postgres'"
              aria-label="Show PostgreSQL output"
              @click="dialect = 'postgres'"
            >
              PostgreSQL
            </button>
          </span>
        </div>

        <div class="body">
          <pre class="req"><code><span
              v-for="(tok, i) in reqTokens"
              :key="i"
              :class="'t-' + tok.cls"
              >{{ tok.t }}</span></code></pre>

          <div class="divider"><span>compiles to</span></div>

          <pre class="sql"><code><span
              v-for="(tok, i) in visibleTokens"
              :key="i"
              :class="'t-' + tok.cls"
              >{{ tok.t }}</span><span v-if="typing" class="caret">▮</span></code></pre>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding: clamp(3rem, 5vw, 4.5rem) 32px clamp(1.25rem, 3vw, 2rem);
  max-width: 1340px;
  margin: 0 auto;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle at 1px 1px,
    var(--vp-c-divider) 1px,
    transparent 0
  );
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(80% 60% at 30% 20%, #000 30%, transparent 75%);
  mask-image: radial-gradient(80% 60% at 30% 20%, #000 30%, transparent 75%);
  opacity: 0.5;
  z-index: 0;
}
.hero::after {
  content: "";
  position: absolute;
  top: -180px;
  left: -120px;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(124, 92, 255, 0.22), transparent 62%);
  filter: blur(20px);
  z-index: 0;
  pointer-events: none;
}

.hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: clamp(1rem, 2.5vw, 2rem);
  align-items: center;
}

.kicker {
  font-family: var(--ph-font-mono);
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--ph-text-3);
  margin: 0 0 0.75rem;
}
.headline {
  font-family: var(--ph-font-display);
  font-weight: 700;
  font-size: clamp(2.3rem, 5.2vw, 3.6rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin: 0;
}
.grad {
  background: var(--ph-grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.sub {
  color: var(--ph-text-2);
  font-size: clamp(1rem, 1.4vw, 1.12rem);
  line-height: 1.65;
  max-width: 30rem;
  margin: 1.25rem 0 1.75rem;
}
.sub strong {
  color: var(--ph-text-1);
  font-weight: 600;
}

.cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.btn {
  display: inline-flex;
  align-items: center;
  border-radius: 10px;
  padding: 11px 20px;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease,
    color 0.2s ease, background-position 0.6s ease;
  text-decoration: none;
}
.btn-brand {
  color: #fff;
  background: var(--ph-grad);
  background-size: 160% 160%;
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.32);
}
.btn-brand:hover {
  transform: translateY(-2px);
  background-position: 100% 50%;
  box-shadow: 0 14px 32px rgba(124, 92, 255, 0.42);
}
.btn-alt {
  color: var(--ph-text-1);
  border: 1px solid var(--vp-c-divider);
}
.btn-alt:hover {
  transform: translateY(-2px);
  border-color: var(--ph-violet);
  color: var(--ph-violet-hi);
}
.btn-ghost {
  color: var(--ph-text-2);
  font-family: var(--ph-font-mono);
  font-size: 13px;
}
.btn-ghost:hover {
  color: var(--ph-text-1);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 1.75rem;
}
.pill {
  font-family: var(--ph-font-mono);
  font-size: 12px;
  color: var(--ph-text-2);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 3px 11px;
}
.pill::before {
  content: "◦ ";
  color: var(--ph-cyan);
}

.console {
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 24px 60px rgba(8, 6, 30, 0.28),
    0 0 0 1px rgba(124, 92, 255, 0.05);
  overflow: hidden;
}
.hero-copy {
  min-width: 0;
}
.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-alt) 70%, transparent);
}
.dots {
  display: inline-flex;
  gap: 6px;
}
.dots i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #f87171;
}
.dots i:nth-child(2) {
  background: #fbbf24;
}
.dots i:nth-child(3) {
  background: var(--ph-cyan);
}
.tab {
  font-family: var(--ph-font-mono);
  font-size: 12px;
  color: var(--ph-text-3);
}
.seg {
  margin-left: auto;
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.seg button {
  font-family: var(--ph-font-mono);
  font-size: 11.5px;
  padding: 4px 10px;
  background: transparent;
  color: var(--ph-text-2);
  border: none;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease, transform 0.15s ease;
}
.seg button:active {
  transform: scale(0.96);
}
.seg button.on {
  background: var(--ph-grad);
  color: #fff;
}

.body {
  padding: 16px 18px 18px;
}
.req,
.sql {
  margin: 0;
  font-family: var(--ph-font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}
.req {
  color: var(--ph-text-2);
}
.req .t-i {
  color: var(--ph-text-2);
}
.req .t-k {
  color: var(--ph-sql-keyword);
}
.req .t-s {
  color: var(--ph-sql-string);
}
.req .t-n {
  color: var(--ph-sql-number);
}
.req .t-p {
  color: var(--ph-sql-punct);
}

.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
  color: var(--ph-text-3);
  font-family: var(--ph-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.divider::before,
.divider::after {
  content: "";
  height: 1px;
  flex: 1;
  background: linear-gradient(
    90deg,
    transparent,
    var(--vp-c-divider),
    transparent
  );
}

.sql {
  min-height: 4.5em;
}
.sql .t-k {
  color: var(--ph-sql-keyword);
  font-weight: 600;
}
.sql .t-s {
  color: var(--ph-sql-string);
}
.sql .t-n {
  color: var(--ph-sql-number);
}
.sql .t-p {
  color: var(--ph-sql-punct);
}
.sql .t-i {
  color: var(--ph-sql-ident);
}
.caret {
  color: var(--ph-cyan);
  animation: ph-caret 0.9s ease-in-out infinite;
}
@keyframes ph-caret {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (max-width: 860px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
  .sub {
    max-width: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .caret,
  .btn,
  .seg button {
    animation: none;
    transition: none;
  }
}
</style>
