<script setup>
// Monoline SVG icon set — drawn, never emoji. 1.6px stroke, currentColor.
defineProps({ name: { type: String, required: true } });
</script>

<template>
  <svg
    class="ph-ic"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- filters / search / sorting -->
    <template v-if="name === 'filter'">
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
    </template>

    <!-- MySQL & PostgreSQL -->
    <template v-else-if="name === 'database'">
      <ellipse cx="12" cy="5.5" rx="7" ry="2.8" />
      <path d="M5 5.5v6c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-6" />
      <path d="M5 11.5v6c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-6" />
    </template>

    <!-- cursor pagination (keyset / next) -->
    <template v-else-if="name === 'cursor'">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l4 4-4 4" />
    </template>

    <!-- joins & unions -->
    <template v-else-if="name === 'join'">
      <circle cx="9" cy="12" r="5.2" />
      <circle cx="15" cy="12" r="5.2" />
    </template>

    <!-- parameterized / safe -->
    <template v-else-if="name === 'shield'">
      <path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </template>

    <!-- legacy compatible -->
    <template v-else-if="name === 'legacy'">
      <path d="M4 12a8 8 0 1 1 2.3 5.6" />
      <path d="M4 19v-4h4" />
      <path d="M12 8v4l3 2" />
    </template>

    <!-- pipeline steps -->
    <template v-else-if="name === 'request'">
      <path d="M4 6h16M4 12h10M4 18h7" />
    </template>
    <template v-else-if="name === 'build'">
      <path d="M14 3l-9 9 3 3 9-9-3-3z" />
      <path d="M11 6l3 3M5 15l-2 6 6-2" />
    </template>
    <template v-else-if="name === 'run'">
      <path d="M6 4l13 8-13 8V4z" />
    </template>
  </svg>
</template>

<style scoped>
.ph-ic {
  width: 22px;
  height: 22px;
  display: block;
}
</style>
