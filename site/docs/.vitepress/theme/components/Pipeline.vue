<script setup>
import FeatureIcon from "./FeatureIcon.vue";

const steps = [
  {
    icon: "request",
    n: "01",
    title: "Describe the request",
    body: "Filters, search, sort and page size as a plain object.",
  },
  {
    icon: "build",
    n: "02",
    title: "PagiHelp builds the SQL",
    body: "Per-dialect query, count query, and a replacements array.",
  },
  {
    icon: "run",
    n: "03",
    title: "Run it on your driver",
    body: "Hand the SQL + replacements straight to mysql2 or pg.",
  },
];
</script>

<template>
  <section class="pipe">
    <p class="kicker">// how it works</p>
    <div class="strip">
      <template v-for="(s, i) in steps" :key="s.n">
        <div class="step">
          <div class="top">
            <span class="ic"><FeatureIcon :name="s.icon" /></span>
            <span class="num">{{ s.n }}</span>
          </div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.body }}</p>
        </div>
        <div v-if="i < steps.length - 1" class="arrow" aria-hidden="true">→</div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.pipe {
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
.strip {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.step {
  flex: 1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  padding: 20px;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-brand-soft);
  color: var(--ph-violet-hi);
}
.num {
  font-family: var(--ph-font-mono);
  font-size: 13px;
  color: var(--ph-text-3);
}
.step h3 {
  font-family: var(--ph-font-display);
  font-weight: 600;
  font-size: 1rem;
  margin: 0 0 0.4rem;
}
.step p {
  color: var(--ph-text-2);
  font-size: 0.88rem;
  line-height: 1.55;
  margin: 0;
}
.arrow {
  display: flex;
  align-items: center;
  color: var(--ph-cyan);
  font-size: 20px;
  padding: 0 4px;
}

@media (max-width: 760px) {
  .strip {
    flex-direction: column;
  }
  .arrow {
    justify-content: center;
    transform: rotate(90deg);
    padding: 4px 0;
  }
}
</style>
