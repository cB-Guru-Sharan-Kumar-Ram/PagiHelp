<script setup>
import { withBase } from "vitepress";
import FeatureIcon from "./FeatureIcon.vue";

const lead = {
  icon: "filter",
  title: "Filters, search & sorting",
  body: "Describe filters as [field, operator, value] tuples, nest them into AND/OR groups, add free-text search and multi-column sorting. PagiHelp builds the WHERE, ORDER BY, and LIMIT clauses for you.",
  code: 'filters: [["status", "IN", ["Active", "Paused"]]]',
};

const cards = [
  {
    icon: "database",
    title: "MySQL & PostgreSQL",
    body: "Pick a dialect on the constructor. Identifiers, operators, and the pagination clause render per-dialect — including native Postgres @>, ILIKE, and ~*.",
  },
  {
    icon: "cursor",
    title: "Cursor pagination",
    body: "paginateCursor() generates keyset queries with opaque, fingerprinted cursor tokens, plus helpers to resolve pages and encode the next cursor.",
  },
  {
    icon: "join",
    title: "Joins & unions",
    body: "Add a joinQuery for joined tables, or pass multiple option blocks to UNION ALL several tables into one paginated result set.",
  },
  {
    icon: "shield",
    title: "Parameterized by default",
    body: "Values flow into a replacements array, never concatenated into SQL. Built-in validation catches malformed input before it reaches your database.",
  },
];
</script>

<template>
  <section class="caps">
    <p class="kicker">// what it does</p>
    <h2 class="caps-title">Everything a paginated query needs</h2>

    <div class="grid">
      <article class="card lead">
        <div class="ic"><FeatureIcon :name="lead.icon" /></div>
        <h3>{{ lead.title }}</h3>
        <p>{{ lead.body }}</p>
        <pre class="snippet"><code>{{ lead.code }}</code></pre>
      </article>

      <article v-for="c in cards" :key="c.title" class="card">
        <div class="ic"><FeatureIcon :name="c.icon" /></div>
        <h3>{{ c.title }}</h3>
        <p>{{ c.body }}</p>
      </article>

      <article class="card wide">
        <div class="wide-main">
          <div class="ic"><FeatureIcon name="legacy" /></div>
          <div class="wide-copy">
            <h3>Upgrading from v1?</h3>
            <p>
              Existing <code>require("pagi-help")</code> code keeps working
              unchanged. Move to the current API —
              <code>require("pagi-help/v2")</code> — for PostgreSQL, cursor
              pagination, and aggregate counts.
            </p>
          </div>
        </div>
        <a class="wide-cta" :href="withBase('/guide/migration')">
          Migration guide →
        </a>
      </article>
    </div>
  </section>
</template>

<style scoped>
.caps {
  max-width: 1340px;
  margin: 0 auto;
  padding: clamp(1.25rem, 3.5vw, 2.5rem) 32px;
}
.kicker {
  font-family: var(--ph-font-mono);
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--ph-text-3);
  margin: 0 0 0.75rem;
}
.caps-title {
  font-family: var(--ph-font-display);
  font-weight: 700;
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  letter-spacing: -0.02em;
  margin: 0 0 2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card {
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  padding: 22px;
  transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1),
    border-color 0.25s ease, box-shadow 0.25s ease;
}
.card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--ph-violet) 55%, var(--vp-c-divider));
  box-shadow: 0 18px 40px rgba(8, 6, 30, 0.18);
}
.card.lead {
  grid-column: span 2;
  grid-row: span 1;
  display: flex;
  flex-direction: column;
}

.ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-brand-soft);
  color: var(--ph-violet-hi);
  margin-bottom: 14px;
  flex-shrink: 0;
}
.card h3 {
  font-family: var(--ph-font-display);
  font-weight: 600;
  font-size: 1.08rem;
  letter-spacing: -0.01em;
  margin: 0 0 0.5rem;
}
.card p {
  color: var(--ph-text-2);
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
}
.snippet {
  margin: 14px 0 0;
  margin-top: auto;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 12px 14px;
  font-family: var(--ph-font-mono);
  font-size: 12.5px;
  color: var(--ph-sql-string);
  overflow-x: auto;
}

.card.wide {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--ph-violet) 10%, var(--vp-c-bg-soft)),
    var(--vp-c-bg-soft) 60%
  );
}
.card.wide .ic {
  margin-bottom: 0;
}
.wide-main {
  display: flex;
  align-items: center;
  gap: 16px;
}
.wide-copy h3 {
  margin: 0 0 0.3rem;
}
.wide-copy p {
  margin: 0;
}
.wide-copy code {
  font-family: var(--ph-font-mono);
  font-size: 0.82em;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 1px 6px;
}
.wide-cta {
  flex-shrink: 0;
  font-family: var(--ph-font-mono);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--ph-grad);
  background-size: 160% 160%;
  border-radius: 10px;
  padding: 11px 18px;
  white-space: nowrap;
  transition: transform 0.2s ease, background-position 0.6s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 6px 18px rgba(124, 92, 255, 0.28);
}
.wide-cta:hover {
  transform: translateY(-2px);
  background-position: 100% 50%;
  box-shadow: 0 12px 26px rgba(124, 92, 255, 0.4);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .card.lead {
    grid-column: span 2;
  }
}
@media (max-width: 640px) {
  .card.wide {
    flex-direction: column;
    align-items: flex-start;
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .card.lead {
    grid-column: span 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .card,
  .wide-cta {
    transition: none;
  }
}
</style>
