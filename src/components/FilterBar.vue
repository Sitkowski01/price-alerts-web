<script setup lang="ts">
import { ref, watch } from "vue";

import BaseIcon from "./BaseIcon.vue";
import type { AlertStatus, Direction } from "../api/types";

const emit = defineEmits<{
  zmiana: [filtry: { ticker?: string; status?: AlertStatus; direction?: Direction }];
}>();

const ticker = ref("");
const status = ref<AlertStatus | "">("");
const direction = ref<Direction | "">("");

function zglos(): void {
  emit("zmiana", {
    ticker: ticker.value.trim() || undefined,
    status: status.value || undefined,
    direction: direction.value || undefined,
  });
}

// Wpisywanie w pole tickera nie może odpytywać API na każdy znak.
// Prosty debounce: `watch` restartuje licznik przy każdej zmianie.
let licznik: ReturnType<typeof setTimeout> | undefined;
watch(ticker, () => {
  clearTimeout(licznik);
  licznik = setTimeout(zglos, 350);
});

// Listy rozwijane zgłaszamy od razu — tam nie ma czego opóźniać.
watch([status, direction], zglos);

function wyczysc(): void {
  ticker.value = "";
  status.value = "";
  direction.value = "";
}
</script>

<template>
  <div class="filtry">
    <div class="filtry__szukaj">
      <BaseIcon nazwa="search" :rozmiar="15" />
      <input v-model="ticker" type="search" placeholder="Filtruj po tickerze" aria-label="Ticker" />
    </div>

    <select v-model="status" aria-label="Status">
      <option value="">Każdy status</option>
      <option value="armed">uzbrojone</option>
      <option value="triggered">uruchomione</option>
      <option value="disabled">wyłączone</option>
    </select>

    <select v-model="direction" aria-label="Kierunek">
      <option value="">Każdy kierunek</option>
      <option value="above">w górę</option>
      <option value="below">w dół</option>
    </select>

    <button type="button" class="przycisk" @click="wyczysc">Wyczyść</button>
  </div>
</template>
