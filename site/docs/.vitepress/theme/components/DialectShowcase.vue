<script setup>
import { ref, onMounted } from "vue";
import { withBase } from "vitepress";
import { tokenize } from "../utils/sql.js";

// One request rendered for both dialects; SSR shows verified library output, re-derived live on mount.
const REQUEST = {
  search: "Active",
  filters: [["status", "IN", ["Active", "Paused"]]],
  sort: { attributes: ["created_at"], sorts: ["desc"] },
  pageNo: 1,
  itemsPerPage: 20,
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

const SQL = {
  mysql:
    "SELECT id AS id,status AS status,created_at AS created_at FROM `events` WHERE (status IN (?,?)) AND ( status LIKE ? ) ORDER BY `created_at`DESC,`id`DESC LIMIT ?,?",
  postgres:
    'SELECT id AS "id",status AS "status",created_at AS "created_at" FROM "events" WHERE (status IN (?,?)) AND ( status LIKE ? ) ORDER BY "created_at"DESC,"id"DESC LIMIT ? OFFSET ?',
};

const sql = ref({
  mysql: tokenize(SQL.mysql),
  postgres: tokenize(SQL.postgres),
});

function loadEngine() {
  return new Promise((resolve, reject) => {
    if (globalThis.window === undefined) return reject(new Error("ssr"));
    if (globalThis.__PagiHelp) return resolve(globalThis.__PagiHelp);
    const s = document.createElement("script");
    s.src = withBase("/pagihelp.global.js");
    s.async = true;
    s.onload = () =>
      globalThis.__PagiHelp ? resolve(globalThis.__PagiHelp) : reject(new Error("x"));
    s.onerror = () => reject(new Error("x"));
    document.head.appendChild(s);
  });
}

onMounted(async () => {
  let Engine = null;
  try {
    const e = await loadEngine();
    Engine = e && e.default ? e.default : e;
  } catch {
    return;
  }
  for (const d of ["mysql", "postgres"]) {
    try {
      sql.value[d] = tokenize(new Engine({ dialect: d }).paginate(REQUEST, OPTIONS).query);
    } catch {}
  }
});
</script>

<template>
  <section class="ds">
    <p class="kicker">// one request, two dialects</p>
    <h2 class="ds-title">The same query, rendered per dialect</h2>
    <div class="cols">
      <div class="col">
        <div class="head"><span class="dot my"></span> MySQL</div>
        <pre><code><span v-for="(t, i) in sql.mysql" :key="i" :class="'t-' + t.cls">{{ t.t }}</span></code></pre>
      </div>
      <div class="col">
        <div class="head"><span class="dot pg"></span> PostgreSQL</div>
        <pre><code><span v-for="(t, i) in sql.postgres" :key="i" :class="'t-' + t.cls">{{ t.t }}</span></code></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ds {
  max-width: 1340px;
  margin: 0 auto;
  padding: clamp(1.25rem, 3.5vw, 2.5rem) 32px;
}
.kicker {
  font-family: var(--ph-font-mono);
  font-size: 13px;
  color: var(--ph-text-3);
  margin: 0 0 0.75rem;
}
.ds-title {
  font-family: var(--ph-font-display);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  letter-spacing: -0.02em;
  margin: 0 0 1.25rem;
}
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.col {
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-alt) 70%, transparent);
  font-family: var(--ph-font-mono);
  font-size: 13px;
  font-weight: 600;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.dot.my {
  background: var(--ph-cyan);
}
.dot.pg {
  background: var(--ph-violet);
}
pre {
  margin: 0;
  padding: 16px;
  font-family: var(--ph-font-mono);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
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
  color: var(--ph-sql-ident);
}

@media (max-width: 760px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
</style>
