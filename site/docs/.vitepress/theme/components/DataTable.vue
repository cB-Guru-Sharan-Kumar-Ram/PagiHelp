<script setup>
defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  emptyText: { type: String, default: "No rows" },
});

function display(col, row) {
  const v = row[col.name];
  if (v === null || v === undefined) return { text: "NULL", null: true };
  // DECIMAL columns render with 2 fixed decimal places.
  if (/^DECIMAL/i.test(col.type) && typeof v === "number")
    return { text: v.toFixed(2), null: false };
  return { text: String(v), null: false };
}
</script>

<template>
  <figure class="wb">
    <figcaption class="wb-bar">
      <span class="wb-grid-ic" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3">
          <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" />
          <path d="M1.5 6h13M1.5 10.5h13M6 1.5v13" />
        </svg>
      </span>
      <span class="wb-name">{{ title }}</span>
      <span v-if="subtitle" class="wb-sub">{{ subtitle }}</span>
    </figcaption>

    <div class="wb-scroll">
      <table>
        <thead>
          <tr>
            <th class="gutter" scope="col"></th>
            <th
              v-for="c in columns"
              :key="c.name"
              scope="col"
              :class="{ 'is-num': c.align === 'right' }"
            >
              <span class="col-line">
                <span class="col-name">{{ c.name }}</span>
                <span v-if="c.key" :class="['key', c.key.toLowerCase()]">{{ c.key }}</span>
              </span>
              <span class="col-type">{{ c.type }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td class="gutter">{{ i + 1 }}</td>
            <td
              v-for="c in columns"
              :key="c.name"
              :class="{ 'is-num': c.align === 'right', 'is-null': display(c, row).null }"
            >
              {{ display(c, row).text }}
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td class="gutter"></td>
            <td class="empty" :colspan="columns.length">{{ emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.wb {
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(2, 6, 16, 0.16);
}
.wb-bar {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-alt) 72%, transparent);
}
.wb-grid-ic {
  color: var(--ph-cyan);
  display: inline-flex;
}
.wb-name {
  font-family: var(--ph-font-mono);
  font-weight: 600;
  font-size: 13px;
}
.wb-sub {
  margin-left: auto;
  font-family: var(--ph-font-mono);
  font-size: 11.5px;
  color: var(--ph-text-3);
}

.wb-scroll {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-family: var(--ph-font-mono);
  font-size: 12.5px;
}
thead th {
  position: sticky;
  top: 0;
  text-align: left;
  vertical-align: top;
  padding: 8px 12px;
  background: var(--vp-c-bg-alt);
  border-bottom: 2px solid var(--vp-c-divider);
  border-right: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}
.col-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.col-name {
  color: var(--ph-text-1);
  font-weight: 600;
}
.key {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 1px 4px;
  border-radius: 4px;
  line-height: 1.4;
}
.key.pk {
  color: #fff;
  background: var(--ph-grad);
}
.key.fk {
  color: var(--ph-cyan);
  border: 1px solid color-mix(in srgb, var(--ph-cyan) 50%, transparent);
}
.col-type {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ph-text-3);
}

tbody td {
  padding: 7px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  border-right: 1px solid var(--vp-c-divider);
  color: var(--ph-text-1);
  white-space: nowrap;
}
tbody tr:nth-child(even) td {
  background: color-mix(in srgb, var(--vp-c-bg-alt) 35%, transparent);
}
tbody tr:hover td {
  background: rgba(124, 92, 255, 0.08);
}
.is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.is-null {
  color: var(--ph-text-3);
  font-style: italic;
}
.gutter {
  width: 1%;
  text-align: right;
  color: var(--ph-text-3);
  background: var(--vp-c-bg-alt);
  border-right: 1px solid var(--vp-c-divider);
  position: sticky;
  left: 0;
  user-select: none;
}
thead th.gutter {
  z-index: 1;
}
.empty {
  text-align: center;
  color: var(--ph-text-3);
  font-style: italic;
  padding: 18px;
}
</style>
