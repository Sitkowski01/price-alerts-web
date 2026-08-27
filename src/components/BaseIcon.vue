<script setup lang="ts">
import { computed } from "vue";

import { SCIEZKI_IKON, type NazwaIkony } from "./ikony";

const props = withDefaults(defineProps<{ nazwa: NazwaIkony; rozmiar?: number }>(), {
  rozmiar: 18,
});

const d = computed(() => SCIEZKI_IKON[props.nazwa]);
</script>

<template>
  <!-- aria-hidden, bo ikona zawsze towarzyszy tekstowi albo aria-label na przycisku -->
  <svg
    class="ikona"
    :width="rozmiar"
    :height="rozmiar"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="d" />
  </svg>
</template>
