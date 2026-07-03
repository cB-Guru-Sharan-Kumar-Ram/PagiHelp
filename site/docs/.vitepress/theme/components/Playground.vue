<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";

// Demo schema the playground builds queries against.
const COLUMNS = [
  { name: "order_id", alias: "id" },
  { name: "reference", alias: "reference" },
  { name: "status", alias: "status" },
  { name: "total", alias: "total" },
  { name: "created_at", alias: "createdAt" },
];
const SEARCH_COLUMNS = [{ name: "reference" }, { name: "status" }];

const SHARED_OPS = [">", ">=", "<", "<=", "=", "!=", "IN", "NOT IN", "LIKE", "IS", "IS NOT"];
const PG_OPS = ["ILIKE", "~", "~*", "@>", "?|", "&&"];

const dialect = ref("mysql");
const search = ref("");
const filters = reactive([
  { field: "status", op: "IN", value: "Paid, Pending" },
]);
const sorts = reactive([{ attr: "createdAt", dir: "desc" }]);
const pageMode = ref("page"); // "page" | "offset"
const pageNo = ref(1);
const itemsPerPage = ref(10);
const offset = ref(0);
const limit = ref(20);

const operators = computed(() =>
  dialect.value === "postgres" ? [...SHARED_OPS, ...PG_OPS] : SHARED_OPS
);

// Map a Postgres-only operator to the closest MySQL-safe one when switching
// dialect, so a filter never carries an operator the current dialect rejects.
const PG_TO_SHARED = { ILIKE: "LIKE", "~": "LIKE", "~*": "LIKE", "@>": "=", "?|": "IN", "&&": "IN" };

watch(dialect, (next) => {
  const allowed = new Set(next === "postgres" ? [...SHARED_OPS, ...PG_OPS] : SHARED_OPS);
  for (const f of filters) {
    if (!allowed.has(f.op)) f.op = PG_TO_SHARED[f.op] || "=";
  }
});

const fieldOptions = COLUMNS.map((c) => c.alias);

let PagiHelpV2 = null;
const libError = ref("");
const ready = ref(false);

function loadEngine() {
  return new Promise((resolve, reject) => {
    if (globalThis.__PagiHelp) return resolve(globalThis.__PagiHelp);
    const base = import.meta.env.BASE_URL || "/";
    const script = document.createElement("script");
    script.src = `${base}pagihelp.global.js`;
    script.async = true;
    script.onload = () =>
      globalThis.__PagiHelp
        ? resolve(globalThis.__PagiHelp)
        : reject(new Error("engine global not found"));
    script.onerror = () => reject(new Error("failed to load engine script"));
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  try {
    const engine = await loadEngine();
    PagiHelpV2 = engine && engine.default ? engine.default : engine;
    ready.value = true;
    recompute();
  } catch (e) {
    libError.value = String(e && e.message ? e.message : e);
  }
});

function parseValue(op, raw) {
  const isInOp = /IN/.test(op) || op === "?|" || op === "&&";
  if (isInOp) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length)
      .map(coerce);
  }
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return raw;
    }
  }
  return coerce(raw);
}

function coerce(v) {
  const t = String(v).trim();
  if (t === "") return v;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === "true") return true;
  if (t === "false") return false;
  return v;
}

const result = ref(null);
const error = ref("");

function recompute() {
  if (!ready.value || !PagiHelpV2) return;
  error.value = "";
  try {
    const pagiHelp = new PagiHelpV2({ dialect: dialect.value });

    const paginationObject = {};
    if (search.value !== "") paginationObject.search = search.value;

    const builtFilters = filters
      .filter((f) => f.field && f.op)
      .map((f) => [f.field, f.op, parseValue(f.op, f.value)]);
    if (builtFilters.length) paginationObject.filters = builtFilters;

    const activeSorts = sorts.filter((s) => s.attr);
    if (activeSorts.length) {
      paginationObject.sort = {
        attributes: activeSorts.map((s) => s.attr),
        sorts: activeSorts.map((s) => s.dir),
      };
    }

    if (pageMode.value === "page") {
      paginationObject.pageNo = Number(pageNo.value);
      paginationObject.itemsPerPage = Number(itemsPerPage.value);
    } else {
      paginationObject.offset = Number(offset.value);
      paginationObject.limit = Number(limit.value);
    }

    const options = [
      {
        tableName: "orders",
        columnList: COLUMNS.map((c) => ({ ...c })),
        searchColumnList: SEARCH_COLUMNS.map((c) => ({ ...c })),
      },
    ];

    result.value = pagiHelp.paginate(paginationObject, options);
  } catch (e) {
    result.value = null;
    error.value = String(e && e.message ? e.message : e);
  }
}

watch([dialect, search, filters, sorts, pageMode, pageNo, itemsPerPage, offset, limit], recompute, {
  deep: true,
});

function addFilter() {
  filters.push({ field: "total", op: ">", value: "10000" });
}
function removeFilter(i) {
  filters.splice(i, 1);
}
function addSort() {
  sorts.push({ attr: "total", dir: "asc" });
}
function removeSort(i) {
  sorts.splice(i, 1);
}

const presets = {
  "Search + filter": () => {
    dialect.value = "mysql";
    search.value = "ORD-100";
    filters.splice(0, filters.length, { field: "status", op: "IN", value: "Paid, Pending" });
    sorts.splice(0, sorts.length, { attr: "createdAt", dir: "desc" });
    pageMode.value = "page";
  },
  "Multiple AND": () => {
    dialect.value = "mysql";
    search.value = "";
    filters.splice(
      0,
      filters.length,
      { field: "status", op: "=", value: "Paid" },
      { field: "total", op: ">=", value: "10000" }
    );
    sorts.splice(0, sorts.length, { attr: "total", dir: "desc" });
    pageMode.value = "page";
  },
  "Offset paging": () => {
    search.value = "";
    filters.splice(0, filters.length);
    sorts.splice(0, sorts.length, { attr: "id", dir: "asc" });
    pageMode.value = "offset";
    offset.value = 4;
    limit.value = 4;
  },
  "Postgres ILIKE": () => {
    dialect.value = "postgres";
    search.value = "";
    filters.splice(0, filters.length, { field: "reference", op: "ILIKE", value: "ord-100%" });
    sorts.splice(0, sorts.length, { attr: "createdAt", dir: "desc" });
    pageMode.value = "page";
  },
};
function applyPreset(name) {
  presets[name]();
}

const copied = ref("");
async function copy(text, key) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    setTimeout(() => (copied.value = ""), 1200);
  } catch {}
}

const replacementsText = computed(() =>
  result.value ? JSON.stringify(result.value.replacements) : "[]"
);
</script>

<template>
  <div class="pg">
    <div class="pg-head">
      <div class="pg-title">
        <span class="pg-dot" /> Live Playground
      </div>
      <div class="pg-dialect">
        <button :class="{ on: dialect === 'mysql' }" @click="dialect = 'mysql'">MySQL</button>
        <button :class="{ on: dialect === 'postgres' }" @click="dialect = 'postgres'">PostgreSQL</button>
      </div>
    </div>

    <div class="pg-presets">
      <span>Presets:</span>
      <button v-for="(_, name) in presets" :key="name" @click="applyPreset(name)">{{ name }}</button>
    </div>

    <div class="pg-grid">
      <div class="pg-controls">
        <label class="pg-row">
          <span>search</span>
          <input v-model="search" placeholder="free-text search" />
        </label>

        <div class="pg-block">
          <div class="pg-block-head">
            <span>filters</span>
            <button class="pg-add" @click="addFilter">+ add filter</button>
          </div>
          <div v-for="(f, i) in filters" :key="i" class="pg-filter">
            <select v-model="f.field" aria-label="Filter field">
              <option v-for="o in fieldOptions" :key="o" :value="o">{{ o }}</option>
            </select>
            <select v-model="f.op" aria-label="Filter operator">
              <option v-for="o in operators" :key="o" :value="o">{{ o }}</option>
            </select>
            <input v-model="f.value" placeholder="value" aria-label="Filter value" />
            <button class="pg-del" aria-label="Remove filter" @click="removeFilter(i)" title="remove">×</button>
          </div>
          <p v-if="!filters.length" class="pg-empty">No filters.</p>
        </div>

        <div class="pg-block">
          <div class="pg-block-head">
            <span>sort</span>
            <button class="pg-add" @click="addSort">+ add sort</button>
          </div>
          <div v-for="(s, i) in sorts" :key="i" class="pg-filter">
            <select v-model="s.attr" aria-label="Sort field">
              <option v-for="o in fieldOptions" :key="o" :value="o">{{ o }}</option>
            </select>
            <select v-model="s.dir" aria-label="Sort direction">
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>
            <button class="pg-del" aria-label="Remove sort" @click="removeSort(i)" title="remove">×</button>
          </div>
          <p v-if="!sorts.length" class="pg-empty">No sort.</p>
        </div>

        <div class="pg-block">
          <div class="pg-block-head"><span>pagination</span></div>
          <div class="pg-pagemode">
            <button :class="{ on: pageMode === 'page' }" @click="pageMode = 'page'">page-based</button>
            <button :class="{ on: pageMode === 'offset' }" @click="pageMode = 'offset'">offset-based</button>
          </div>
          <div v-if="pageMode === 'page'" class="pg-nums">
            <label><span>pageNo</span><input type="number" min="1" v-model="pageNo" /></label>
            <label><span>itemsPerPage</span><input type="number" min="1" v-model="itemsPerPage" /></label>
          </div>
          <div v-else class="pg-nums">
            <label><span>offset</span><input type="number" min="0" v-model="offset" /></label>
            <label><span>limit</span><input type="number" min="1" v-model="limit" /></label>
          </div>
        </div>
      </div>

      <div class="pg-output">
        <div v-if="libError" class="pg-fallback">
          Live engine unavailable in this browser ({{ libError }}). The generated
          SQL examples throughout the docs still apply.
        </div>
        <div v-else-if="error" class="pg-error">⚠ {{ error }}</div>
        <template v-else-if="result">
          <div class="pg-out-block">
            <div class="pg-out-head">
              <span>query</span>
              <button @click="copy(result.query, 'q')">{{ copied === 'q' ? 'copied!' : 'copy' }}</button>
            </div>
            <pre><code>{{ result.query }}</code></pre>
          </div>
          <div class="pg-out-block">
            <div class="pg-out-head">
              <span>countQuery</span>
              <button @click="copy(result.countQuery, 'c')">{{ copied === 'c' ? 'copied!' : 'copy' }}</button>
            </div>
            <pre><code>{{ result.countQuery }}</code></pre>
          </div>
          <div class="pg-out-block">
            <div class="pg-out-head">
              <span>replacements</span>
              <button @click="copy(replacementsText, 'r')">{{ copied === 'r' ? 'copied!' : 'copy' }}</button>
            </div>
            <pre><code>{{ replacementsText }}</code></pre>
          </div>
        </template>
        <div v-else class="pg-loading">Loading engine…</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pg {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  padding: 18px;
  margin: clamp(1rem, 2vw, 1.5rem) 0;
  box-shadow: 0 10px 30px rgba(2, 12, 27, 0.06);
}
.pg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.pg-title {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pg-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ph-cyan);
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.18);
  animation: pgpulse 1.8s ease-in-out infinite;
}
@keyframes pgpulse {
  50% {
    box-shadow: 0 0 0 7px rgba(34, 211, 238, 0.05);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pg-dot {
    animation: none;
  }
}
.pg-dialect button,
.pg-pagemode button {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pg-dialect button:first-child {
  border-radius: 8px 0 0 8px;
}
.pg-dialect button:last-child {
  border-radius: 0 8px 8px 0;
  margin-left: -1px;
}
.pg-dialect button.on,
.pg-pagemode button.on {
  background: var(--ph-grad);
  color: #fff;
  border-color: transparent;
}
.pg-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 16px;
}
.pg-presets button {
  border: 1px dashed var(--vp-c-divider);
  background: transparent;
  border-radius: 999px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}
.pg-presets button:hover {
  border-style: solid;
  border-color: var(--ph-violet);
  color: var(--vp-c-text-1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 92, 255, 0.15);
}
.pg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
@media (max-width: 760px) {
  .pg-grid {
    grid-template-columns: 1fr;
  }
}
.pg-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}
.pg-row > span,
.pg-block-head > span,
.pg-nums span {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
}
.pg-block {
  margin-bottom: 14px;
}
.pg-block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.pg-add {
  font-size: 12px;
  border: none;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 6px;
  padding: 3px 9px;
  cursor: pointer;
  font-weight: 600;
}
.pg-filter {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.2fr auto;
  gap: 6px;
  margin-bottom: 6px;
  min-width: 0;
}
.pg-controls {
  min-width: 0;
}
.pg-filter select,
.pg-filter input,
.pg-row input,
.pg-nums input {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  width: 100%;
  min-width: 0;
  font-family: var(--vp-font-family-mono);
}
.pg-del {
  border: none;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}
.pg-del:hover {
  color: #ef4444;
}
.pg-empty {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin: 0;
}
.pg-pagemode {
  display: flex;
  margin-bottom: 10px;
}
.pg-pagemode button:first-child {
  border-radius: 8px 0 0 8px;
}
.pg-pagemode button:last-child {
  border-radius: 0 8px 8px 0;
  margin-left: -1px;
}
.pg-nums {
  display: flex;
  gap: 10px;
}
.pg-nums label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.pg-output {
  min-width: 0;
}
.pg-out-block {
  margin-bottom: 12px;
}
.pg-out-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}
.pg-out-head button {
  border: none;
  background: transparent;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.pg-output pre {
  margin: 0;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 12px 14px;
  overflow-x: auto;
}
.pg-output code {
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--vp-c-text-1);
}
.pg-error,
.pg-fallback,
.pg-loading {
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
}
.pg-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--vp-c-danger-1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.pg-fallback {
  background: var(--vp-c-bg);
  border: 1px dashed var(--vp-c-divider);
  color: var(--vp-c-text-2);
}
.pg-loading {
  color: var(--vp-c-text-3);
}
</style>
