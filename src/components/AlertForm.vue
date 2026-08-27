<script setup lang="ts">
import { computed, ref } from "vue";

import BaseIcon from "./BaseIcon.vue";
import type { AlertCreate, Direction } from "../api/types";

const emit = defineEmits<{ zapisz: [dane: AlertCreate] }>();
defineProps<{ zajety?: boolean }>();

const ticker = ref("");
const direction = ref<Direction>("above");
const threshold = ref("");
const note = ref("");
const dotkniete = ref(false);

// Walidacja lustrzana do tej z backendu — ale to nie jest jej zamiennik.
// Serwer i tak sprawdza wszystko jeszcze raz; tutaj chodzi tylko o to,
// żeby użytkownik nie czekał na odpowiedź, by dowiedzieć się o literówce.
const bledy = computed(() => {
  const lista: string[] = [];
  if (!ticker.value.trim()) lista.push("Podaj ticker instrumentu.");
  if (ticker.value.trim().length > 16) lista.push("Ticker może mieć najwyżej 16 znaków.");

  const prog = Number(threshold.value);
  if (!threshold.value.trim()) lista.push("Podaj próg.");
  else if (!Number.isFinite(prog)) lista.push("Próg musi być liczbą.");
  else if (prog <= 0) lista.push("Próg musi być większy od zera.");

  return lista;
});

const poprawny = computed(() => bledy.value.length === 0);

// Podgląd reguły zwykłym językiem — najtańszy sposób na wyłapanie
// pomylonego kierunku, zanim alert zacznie żyć własnym życiem.
const podglad = computed(() => {
  if (!poprawny.value) return null;
  const kierunek = direction.value === "above" ? "wejdzie na" : "spadnie do";
  return `Powiadom, gdy ${ticker.value.trim().toUpperCase()} ${kierunek} ${Number(threshold.value).toFixed(2)}.`;
});

function wyslij(): void {
  dotkniete.value = true;
  if (!poprawny.value) return;

  emit("zapisz", {
    ticker: ticker.value,
    direction: direction.value,
    threshold: threshold.value,
    note: note.value.trim() || null,
  });

  ticker.value = "";
  threshold.value = "";
  note.value = "";
  dotkniete.value = false;
}
</script>

<template>
  <!-- `@submit.prevent` to `onSubmit` z wbudowanym `preventDefault()` -->
  <form class="formularz" @submit.prevent="wyslij">
    <div class="karta__naglowek">
      <BaseIcon nazwa="bell" :rozmiar="17" />
      <h2>Nowy alert</h2>
    </div>

    <div class="pola">
      <label class="pole">
        <span>Ticker</span>
        <!-- `v-model` to dwukierunkowe wiązanie: skrót na `:value` + `@input` -->
        <input v-model="ticker" type="text" placeholder="np. CDR" maxlength="16" />
      </label>

      <label class="pole">
        <span>Kierunek</span>
        <!-- Krótkie etykiety, bo dłuższe ucinały się w wąskiej kolumnie.
             Znaczenie i tak tłumaczy podgląd reguły poniżej. -->
        <select v-model="direction">
          <option value="above">w górę</option>
          <option value="below">w dół</option>
        </select>
      </label>

      <label class="pole">
        <span>Próg</span>
        <input v-model="threshold" type="text" inputmode="decimal" placeholder="np. 180.00" />
      </label>

      <label class="pole pole--szerokie">
        <span>Notatka <em>(opcjonalnie)</em></span>
        <input v-model="note" type="text" maxlength="280" placeholder="po co ten alert" />
      </label>
    </div>

    <p v-if="podglad" class="podglad">
      <BaseIcon :nazwa="direction === 'above' ? 'trend-up' : 'trend-down'" :rozmiar="16" />
      <span>{{ podglad }}</span>
    </p>

    <ul v-if="dotkniete && bledy.length" class="bledy">
      <li v-for="b in bledy" :key="b">{{ b }}</li>
    </ul>

    <button type="submit" class="przycisk przycisk--glowny" :disabled="zajety">
      {{ zajety ? "Zapisuję…" : "Załóż alert" }}
    </button>
  </form>
</template>
