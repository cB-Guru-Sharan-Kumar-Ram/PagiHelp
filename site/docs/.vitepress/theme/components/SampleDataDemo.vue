<script setup>
import { ref, computed, onMounted } from "vue";
import DataTable from "./DataTable.vue";
import { tokenize } from "../utils/sql.js";
import { TABLES, runRequest } from "../utils/demoData.js";

// Single demo table the whole page queries against.
const TABLE_KEY = "products";
const table = TABLES[TABLE_KEY];

const dialect = ref("mysql");

function format(value) {
  return JSON.stringify(value, null, 2);
}

// Default request (paginationObject) the dev edits — every field shown.
const DEFAULT_REQUEST = format({
  search: "",
  filters: [["price", ">=", 2000]],
  sort: { attributes: ["price"], sorts: ["desc"] },
  pageNo: 1,
  itemsPerPage: 5,
});
// Default options; joinQuery / additionalWhereConditions are added via the buttons below.
const DEFAULT_OPTIONS = format([
  {
    tableName: "products",
    columnList: table.columns.map((c) => ({ name: c.name, alias: c.name })),
    searchColumnList: table.searchColumns.map((name) => ({ name })),
  },
]);

const requestText = ref(DEFAULT_REQUEST);
const optionsText = ref(DEFAULT_OPTIONS);
const optionsOpen = ref(false);

const parseError = ref("");
const optionsError = ref("");

function parseJs(text) {
  try {
    const value = new Function("return (" + text + ")")();
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) };
  }
}

const presets = {
  "Filter + sort": {
    request: { filters: [["price", ">=", 2000]], sort: { attributes: ["price"], sorts: ["desc"] }, pageNo: 1, itemsPerPage: 5 },
  },
  "Nested AND / OR": {
    request: {
      filters: [["category", "=", "Audio"], [["stock", ">", 0], ["price", "<", 2500]]],
      sort: { attributes: ["price"], sorts: ["asc"] },
      pageNo: 1,
      itemsPerPage: 5,
    },
  },
  "Edit options": {
    request: { search: "USB", sort: { attributes: ["name"], sorts: ["asc"] }, pageNo: 1, itemsPerPage: 5 },
    options: [
      {
        tableName: "products",
        columnList: [
          { name: "id", alias: "id" },
          { name: "name", alias: "name" },
          { name: "category", alias: "category" },
          { name: "price", alias: "price" },
        ],
        searchColumnList: [{ name: "name" }],
        additionalWhereConditions: [["stock", ">", 0]],
      },
    ],
    openOptions: true,
  },
};
function applyPreset(name) {
  const p = presets[name];
  requestText.value = format(p.request);
  if (p.options) optionsText.value = format(p.options);
  if (p.openOptions) optionsOpen.value = true;
  run();
}

// Append an optional option key (with a valid example) to the options JSON.
function addOption(field) {
  const parsed = parseJs(optionsText.value);
  if (!parsed.ok || !Array.isArray(parsed.value) || !parsed.value[0]) return;
  const opt = parsed.value[0];
  if (field === "join" && opt.joinQuery === undefined) opt.joinQuery = "";
  else if (field === "awc" && opt.additionalWhereConditions === undefined)
    opt.additionalWhereConditions = [["stock", ">", 0]];
  else return;
  optionsText.value = format(parsed.value);
  optionsOpen.value = true;
}

// Live engine — the same pre-bundled global the Playground loads.
let Engine = null;
const ready = ref(false);
const libError = ref("");

function loadEngine() {
  return new Promise((resolve, reject) => {
    if (globalThis.__PagiHelp) return resolve(globalThis.__PagiHelp);
    const base = import.meta.env.BASE_URL || "/";
    const s = document.createElement("script");
    s.src = `${base}pagihelp.global.js`;
    s.async = true;
    s.onload = () =>
      globalThis.__PagiHelp ? resolve(globalThis.__PagiHelp) : reject(new Error("engine global not found"));
    s.onerror = () => reject(new Error("failed to load engine script"));
    document.head.appendChild(s);
  });
}

const hasRun = ref(false);
const ranRequest = ref(null);
const ranOptions = ref(null);
const ranResult = ref(null);
const ranData = ref({ computable: true, rows: [], total: 0 });
const sqlError = ref("");
const sqlOpen = ref(false);

function run() {
  const pr = parseJs(requestText.value);
  if (!pr.ok || !pr.value || typeof pr.value !== "object" || Array.isArray(pr.value)) {
    parseError.value = pr.ok ? "Request must be an object, e.g. { filters: [...], pageNo: 1, itemsPerPage: 5 }" : pr.error;
    hasRun.value = true;
    return;
  }
  parseError.value = "";

  const po = parseJs(optionsText.value);
  if (!po.ok || !Array.isArray(po.value)) {
    optionsError.value = po.ok ? "Options must be an array of { tableName, columnList, ... } blocks" : po.error;
    hasRun.value = true;
    return;
  }
  optionsError.value = "";

  ranRequest.value = pr.value;
  ranOptions.value = po.value;

  if (ready.value && Engine) {
    try {
      const pagi = new Engine({ dialect: dialect.value });
      ranResult.value = pagi.paginate(pr.value, po.value);
      sqlError.value = "";
    } catch (e) {
      ranResult.value = null;
      sqlError.value = String(e && e.message ? e.message : e);
      sqlOpen.value = true;
    }
  }

  ranData.value = sqlError.value
    ? { computable: true, rows: [], total: 0 }
    : runRequest(TABLE_KEY, pr.value, po.value);

  hasRun.value = true;
}

function rerunDialect(d) {
  dialect.value = d;
  if (hasRun.value) run();
}

onMounted(async () => {
  try {
    const engine = await loadEngine();
    Engine = engine && engine.default ? engine.default : engine;
    ready.value = true;
  } catch (e) {
    libError.value = String(e && e.message ? e.message : e);
  }
  run();
});

// Result table columns reflect the edited columnList (named columns only).
const displayColumns = computed(() => {
  const opt = ranOptions.value && ranOptions.value[0];
  if (opt && Array.isArray(opt.columnList)) {
    const names = new Set(opt.columnList.filter((c) => c?.name).map((c) => c.name));
    const cols = table.columns.filter((c) => names.has(c.name));
    if (cols.length) return cols;
  }
  return table.columns;
});

const queryTokens = computed(() => tokenize(ranResult.value ? ranResult.value.query : ""));
const countTokens = computed(() => tokenize(ranResult.value ? ranResult.value.countQuery : ""));
const replacementsText = computed(() =>
  ranResult.value ? JSON.stringify(ranResult.value.replacements) : "[]"
);
</script>

<template>
  <div class="demo">
    <div class="toolbar">
      <p class="kicker">// interactive demo · for developers</p>
      <fieldset class="seg" aria-label="SQL dialect">
        <button :class="{ on: dialect === 'mysql' }" :aria-pressed="dialect === 'mysql'" @click="rerunDialect('mysql')">MySQL</button>
        <button :class="{ on: dialect === 'postgres' }" :aria-pressed="dialect === 'postgres'" @click="rerunDialect('postgres')">PostgreSQL</button>
      </fieldset>
    </div>

    <p class="intro">
      Edit the <strong>request</strong> (and the <strong>options</strong>) as JSON,
      hit <strong>Run query</strong>, and see the SQL PagiHelp generates and the
      rows + total count it returns — against the single <code>products</code>
      table below. Invalid input shows the exact error, so this doubles as a quick
      request validator.
    </p>

    <DataTable
      class="src"
      :title="table.name"
      :subtitle="`source data · ${table.rows.length} rows`"
      :columns="table.columns"
      :rows="table.rows"
    />

    <div class="opts">
      <button class="opts-toggle" :aria-expanded="optionsOpen" @click="optionsOpen = !optionsOpen">
        <svg class="chev" :class="{ open: optionsOpen }" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 4l4 4-4 4" /></svg>
        <span><strong>options</strong> — 2nd argument to <code>paginate()</code></span>
        <span class="opts-hint">columnList · searchColumnList · additionalWhereConditions · joinQuery</span>
      </button>
      <div v-show="optionsOpen" class="editor-body">
        <div class="opts-add">
          <span>add:</span>
          <button @click="addOption('awc')">+ additionalWhereConditions</button>
          <button @click="addOption('join')">+ joinQuery</button>
        </div>
        <textarea v-model="optionsText" spellcheck="false" rows="14" aria-label="Options JSON" @keydown.ctrl.enter="run" @keydown.meta.enter="run"></textarea>
        <p v-if="optionsError" class="parse-err">⚠ Couldn’t parse options: {{ optionsError }}</p>
        <p v-else class="hint">Edit which columns are selected or searched, then <strong>Run query</strong>.</p>
      </div>
    </div>

    <div class="req">
      <div class="req-head">
        <span class="req-title"><strong>request</strong> — the paginationObject (1st argument)</span>
        <div class="presets">
          <span>presets:</span>
          <button v-for="(_, name) in presets" :key="name" @click="applyPreset(name)">{{ name }}</button>
        </div>
      </div>
      <div class="editor-body">
        <textarea v-model="requestText" spellcheck="false" rows="9" aria-label="Request JSON" @keydown.ctrl.enter="run" @keydown.meta.enter="run"></textarea>
        <p v-if="parseError" class="parse-err">⚠ Couldn’t parse the request: {{ parseError }}</p>
        <p v-else class="hint">Top-level filters are <code>AND</code>-ed; a nested array becomes an <code>OR</code> group. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run.</p>
      </div>
    </div>

    <button class="run" @click="run">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4 2.8v10.4a.6.6 0 0 0 .92.5l8.2-5.2a.6.6 0 0 0 0-1L4.92 2.3A.6.6 0 0 0 4 2.8Z" /></svg>
      Run query
    </button>

    <section v-if="hasRun && !parseError && !optionsError" class="results">
      <div class="pane sql-pane">
        <button class="pane-h pane-toggle" :aria-expanded="sqlOpen" @click="sqlOpen = !sqlOpen">
          <span>generated sql · {{ dialect }}</span>
          <span class="view-ic">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1 8s2.5-4.5 7-4.5 7 4.5 7 4.5-2.5 4.5-7 4.5S1 8 1 8Z" /><circle cx="8" cy="8" r="2" /></svg>
            {{ sqlOpen ? "hide" : "view" }}
          </span>
        </button>
        <template v-if="sqlOpen">
          <div v-if="libError" class="note">Live engine unavailable ({{ libError }}).</div>
          <div v-else-if="sqlError" class="note err">⚠ Invalid request: {{ sqlError }}</div>
          <template v-else-if="ranResult">
            <pre class="code"><code><span v-for="(t, i) in queryTokens" :key="i" :class="'t-' + t.cls">{{ t.t }}</span></code></pre>
            <div class="pane-h sub">countQuery</div>
            <pre class="code"><code><span v-for="(t, i) in countTokens" :key="i" :class="'t-' + t.cls">{{ t.t }}</span></code></pre>
            <div class="pane-h sub">replacements</div>
            <pre class="code"><code>{{ replacementsText }}</code></pre>
          </template>
          <div v-else class="note">Loading engine…</div>
        </template>
      </div>

      <template v-if="!sqlError && !libError">
        <template v-if="ranData.computable">
          <div class="stats">
            <div class="stat">
              <span class="stat-n">{{ ranData.total }}</span>
              <span class="stat-l">total count <em>(from countQuery)</em></span>
            </div>
            <div class="stat">
              <span class="stat-n">{{ ranData.rows.length }}</span>
              <span class="stat-l">rows on this page</span>
            </div>
            <div class="stat">
              <span class="stat-n">{{ ranRequest && ranRequest.pageNo ? ranRequest.pageNo : 1 }}</span>
              <span class="stat-l">page</span>
            </div>
          </div>

          <DataTable
            :title="`${table.name} · result`"
            :subtitle="`showing ${ranData.rows.length} of ${ranData.total} matching rows`"
            :columns="displayColumns"
            :rows="ranData.rows"
            empty-text="No matching rows"
          />
        </template>

        <div v-else class="data-na">
          <strong>Row preview isn’t available in the browser</strong> for
          {{ ranData.reason }}. The generated SQL above is exact — run it against
          your own MySQL / PostgreSQL database to see the rows it returns.
        </div>
      </template>
    </section>

    <p class="foot-note">
      Values are always parameterized — every <code>?</code> maps to an entry in
      the <code>replacements</code> array, never string-concatenated. The
      <code>countQuery</code> returns the <code>total count</code>, and PagiHelp
      appends the primary key to <code>ORDER BY</code> as a tiebreaker for
      deterministic paging.
    </p>
  </div>
</template>

<style scoped>
.demo {
  max-width: 1100px;
  margin: 0 auto;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0.5rem;
}
.kicker {
  font-family: var(--ph-font-mono);
  font-size: 13px;
  color: var(--ph-text-3);
  margin: 0;
}
.seg {
  display: inline-flex;
  margin: 0;
  padding: 0;
  min-inline-size: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
.seg button {
  font-family: var(--ph-font-mono);
  font-size: 12px;
  padding: 5px 12px;
  background: transparent;
  color: var(--ph-text-2);
  border: none;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;
}
.seg button.on {
  background: var(--ph-grad);
  color: #fff;
}
.intro {
  color: var(--ph-text-2);
  margin: 0 0 1.5rem;
}
.intro strong {
  color: var(--ph-text-1);
}
.src {
  margin-bottom: 1.25rem;
}

.opts {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  margin-bottom: 1rem;
  overflow: hidden;
}
.opts-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--ph-text-1);
  font-size: 0.92rem;
  text-align: left;
}
.opts-toggle code {
  font-family: var(--ph-font-mono);
  font-size: 0.85em;
}
.chev {
  flex-shrink: 0;
  transition: transform 0.18s ease;
  color: var(--ph-violet-hi);
}
.chev.open {
  transform: rotate(90deg);
}
.opts-hint {
  margin-left: auto;
  font-family: var(--ph-font-mono);
  font-size: 11px;
  color: var(--ph-text-3);
}
@media (max-width: 640px) {
  .opts-hint {
    display: none;
  }
}
.editor-body {
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.opts .editor-body {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 12px;
}
.opts-add {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--ph-text-3);
}
.opts-add button {
  border: 1px dashed var(--vp-c-divider);
  background: transparent;
  border-radius: 999px;
  padding: 4px 11px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--ph-font-mono);
  color: var(--ph-text-2);
  transition: all 0.18s ease;
}
.opts-add button:hover {
  border-style: solid;
  border-color: var(--ph-violet);
  color: var(--ph-text-1);
}

.req {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  margin-bottom: 1.25rem;
}
.req-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px 0;
}
.req-title {
  font-size: 0.92rem;
  color: var(--ph-text-1);
}
.req-title code {
  font-family: var(--ph-font-mono);
}
.req .editor-body {
  padding-top: 12px;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: var(--ph-text-3);
}
.presets button {
  border: 1px dashed var(--vp-c-divider);
  background: transparent;
  border-radius: 999px;
  padding: 4px 11px;
  cursor: pointer;
  font-size: 12px;
  color: var(--ph-text-2);
  transition: all 0.18s ease;
}
.presets button:hover {
  border-style: solid;
  border-color: var(--ph-violet);
  color: var(--ph-text-1);
}

textarea {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: 10px;
  padding: 12px 14px;
  font-family: var(--ph-font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  resize: vertical;
  tab-size: 2;
}
textarea:focus {
  outline: none;
  border-color: var(--ph-violet);
  box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.18);
}
.hint {
  font-size: 12px;
  color: var(--ph-text-3);
  margin: 0;
}
.hint code {
  font-family: var(--ph-font-mono);
  font-size: 0.9em;
}
.hint kbd {
  font-family: var(--ph-font-mono);
  font-size: 11px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0 5px;
  background: var(--vp-c-bg-alt);
}
.parse-err {
  font-size: 12.5px;
  color: #dc2626;
  margin: 0;
}

.run {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ph-font-mono);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--ph-grad);
  background-size: 160% 160%;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 22px rgba(124, 92, 255, 0.32);
  transition: transform 0.18s ease, background-position 0.5s ease, box-shadow 0.18s ease;
}
.run:hover {
  transform: translateY(-2px);
  background-position: 100% 50%;
  box-shadow: 0 12px 28px rgba(124, 92, 255, 0.45);
}
.run:active {
  transform: scale(0.98);
}

.sql-pane {
  margin-bottom: 14px;
}
.pane {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.pane-h {
  font-family: var(--ph-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ph-text-3);
  padding: 9px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-alt) 72%, transparent);
}
.pane-h.sub {
  border-top: 1px solid var(--vp-c-divider);
}
.pane-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 0;
  border-bottom: 1px solid var(--vp-c-divider);
  cursor: pointer;
}
.view-ic {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ph-violet-hi);
  text-transform: none;
  letter-spacing: 0;
}
.pane-toggle:hover .view-ic {
  text-decoration: underline;
}
.code {
  margin: 0;
  padding: 14px;
  font-family: var(--ph-font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}
.note {
  padding: 14px;
  font-size: 13px;
  color: var(--ph-text-2);
}
.note.err {
  color: #dc2626;
}
.t-k {
  color: var(--ph-sql-keyword);
  font-weight: 600;
}
.t-s {
  color: var(--ph-sql-string);
}
.t-n {
  color: var(--ph-sql-number);
}
.t-p {
  color: var(--ph-sql-punct);
}
.t-i {
  color: var(--ph-text-2);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}
.stat {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-n {
  font-family: var(--ph-font-display);
  font-weight: 700;
  font-size: 1.6rem;
  color: var(--ph-violet-hi);
  font-variant-numeric: tabular-nums;
}
.stat-l {
  font-size: 12px;
  color: var(--ph-text-3);
}
.stat-l em {
  font-style: normal;
  opacity: 0.8;
}

.data-na {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 16px 18px;
  font-size: 0.92rem;
  color: var(--ph-text-2);
  line-height: 1.6;
}
.data-na strong {
  color: var(--ph-text-1);
}

.foot-note {
  margin-top: 2rem;
  padding: 14px 16px;
  border-left: 3px solid var(--ph-cyan);
  border-radius: 0 10px 10px 0;
  background: var(--vp-c-bg-soft);
  color: var(--ph-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .run,
  .chev {
    transition: none;
  }
}
</style>
