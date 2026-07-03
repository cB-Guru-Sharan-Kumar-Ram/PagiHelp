<script setup>
import { withBase } from "vitepress";
import HeroConsole from "./components/HeroConsole.vue";
import Pipeline from "./components/Pipeline.vue";
import Capabilities from "./components/Capabilities.vue";
import DialectShowcase from "./components/DialectShowcase.vue";
import Playground from "./components/Playground.vue";
</script>

<template>
  <div class="console-home">
    <HeroConsole />
    <Pipeline />
    <Capabilities />
    <DialectShowcase />

    <section class="pg-section">
      <p class="kicker">// live proof</p>
      <h2 class="sec-title">See your request turn into safe SQL</h2>
      <p class="sec-sub">No install needed — the real engine runs in your browser.</p>
      <Playground />
      <p class="more">
        <a :href="withBase('/examples/sample-data')">See it on sample tables →</a>
        <span class="sep">·</span>
        <a :href="withBase('/playground')">Open the full playground →</a>
      </p>
    </section>

    <section class="cta-band">
      <div class="cta-inner">
        <h2>Ready to paginate?</h2>
        <p>Start building safe, parameterized SQL for MySQL and PostgreSQL in minutes.</p>
        <div class="cta-row">
          <code>npm install pagi-help</code>
          <a class="cta-btn" :href="withBase('/guide/getting-started')"
            >Get Started →</a
          >
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.console-home {
  /* hide the now-empty default VPHome hero/features wrappers' gap */
  margin-top: -1px;
}

.kicker {
  font-family: var(--ph-font-mono);
  font-size: 13px;
  color: var(--ph-text-3);
  margin: 0 0 0.75rem;
}

.pg-section {
  max-width: 1340px;
  margin: 0 auto;
  padding: clamp(1.25rem, 3.5vw, 2.5rem) 32px;
}
.sec-title {
  font-family: var(--ph-font-display);
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  letter-spacing: -0.02em;
  margin: 0 0 0.4rem;
}
.sec-sub {
  color: var(--ph-text-2);
  margin: 0 0 1rem;
}
.more {
  text-align: center;
  margin-top: 1.5rem;
}
.more a {
  font-family: var(--ph-font-mono);
  font-size: 14px;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.more .sep {
  color: var(--ph-text-3);
  margin: 0 8px;
}

.cta-band {
  margin: clamp(1.5rem, 4vw, 2.5rem) auto clamp(2rem, 4vw, 3rem);
  max-width: 1280px;
  padding: 0 32px;
}
.cta-inner {
  position: relative;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: var(--vp-c-bg-soft);
  padding: clamp(1.5rem, 4vw, 2.5rem);
  text-align: center;
  overflow: hidden;
}
.cta-inner::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    60% 120% at 50% 0%,
    rgba(124, 92, 255, 0.16),
    transparent 70%
  );
  pointer-events: none;
}
.cta-inner > * {
  position: relative;
}
.cta-inner h2 {
  font-family: var(--ph-font-display);
  font-weight: 700;
  font-size: clamp(1.6rem, 3.4vw, 2.4rem);
  letter-spacing: -0.02em;
  margin: 0 0 0.6rem;
}
.cta-inner p {
  color: var(--ph-text-2);
  margin: 0 auto 1.6rem;
  max-width: 34rem;
}
.cta-row {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.cta-row code {
  font-family: var(--ph-font-mono);
  font-size: 14px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 11px 18px;
  color: var(--ph-text-1);
}
.cta-btn {
  background: var(--ph-grad);
  background-size: 160% 160%;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  padding: 12px 22px;
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.32);
  transition: transform 0.2s ease, background-position 0.6s ease,
    box-shadow 0.2s ease;
}
.cta-btn:hover {
  transform: translateY(-2px);
  background-position: 100% 50%;
  box-shadow: 0 14px 32px rgba(124, 92, 255, 0.42);
}

@media (prefers-reduced-motion: reduce) {
  .cta-btn {
    transition: none;
  }
}
</style>
