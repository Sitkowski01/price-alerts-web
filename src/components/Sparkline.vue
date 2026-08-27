<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    wartosci: number[];
    szerokosc?: number;
    wysokosc?: number;
    /** Opcjonalna linia progu — rysowana przerywaną kreską. */
    prog?: number | null;
  }>(),
  { szerokosc: 88, wysokosc: 26, prog: null },
);

// Skala wspólna dla serii i progu, żeby linia progu leżała tam, gdzie powinna.
const zakres = computed(() => {
  const dane = props.prog != null ? [...props.wartosci, props.prog] : props.wartosci;
  const min = Math.min(...dane);
  const max = Math.max(...dane);
  // Płaska seria dałaby dzielenie przez zero — wtedy rysujemy ją przez środek.
  const rozpietosc = max - min || 1;
  return { min, rozpietosc };
});

function naY(wartosc: number): number {
  const { min, rozpietosc } = zakres.value;
  const margines = 3;
  const uzyteczna = props.wysokosc - margines * 2;
  return props.wysokosc - margines - ((wartosc - min) / rozpietosc) * uzyteczna;
}

const punkty = computed(() => {
  const n = props.wartosci.length;
  if (n < 2) return "";
  const krok = props.szerokosc / (n - 1);
  return props.wartosci.map((w, i) => `${(i * krok).toFixed(1)},${naY(w).toFixed(1)}`).join(" ");
});

const yProgu = computed(() => (props.prog != null ? naY(props.prog) : null));

const rosnie = computed(() => {
  const w = props.wartosci;
  return w.length < 2 || w[w.length - 1] >= w[0];
});
</script>

<template>
  <svg
    class="iskra"
    :width="szerokosc"
    :height="wysokosc"
    :viewBox="`0 0 ${szerokosc} ${wysokosc}`"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <line
      v-if="yProgu !== null"
      :x1="0"
      :x2="szerokosc"
      :y1="yProgu"
      :y2="yProgu"
      stroke="currentColor"
      stroke-width="1"
      stroke-dasharray="3 3"
      opacity="0.45"
    />
    <polyline
      v-if="punkty"
      :points="punkty"
      :stroke="rosnie ? 'var(--bull)' : 'var(--bear)'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
