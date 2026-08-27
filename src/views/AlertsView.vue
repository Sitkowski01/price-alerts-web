<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";

import AlertForm from "../components/AlertForm.vue";
import ErrorNote from "../components/ErrorNote.vue";
import FilterBar from "../components/FilterBar.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAlertsStore } from "../stores/alerts";
import type { AlertCreate } from "../api/types";

const store = useAlertsStore();

// `storeToRefs` rozpakowuje stan i gettery, ZACHOWUJĄC reaktywność.
// Zwykłe `const { pozycje } = store` zerwałoby powiązanie i lista przestałaby się odświeżać.
// Akcje bierzemy prosto ze store'a — one reaktywności nie potrzebują.
const { pozycje, total, ladowanie, blad, uzbrojone, uruchomione, pusto, stronaOd, stronaDo, jestNastepna } =
  storeToRefs(store);

onMounted(store.pobierz);

async function zapisz(dane: AlertCreate): Promise<void> {
  await store.utworz(dane);
}

function sformatuj(kwota: string): string {
  return Number(kwota).toFixed(2);
}
</script>

<template>
  <section>
    <div class="podsumowanie">
      <div class="kafel">
        <span class="kafel__liczba">{{ total }}</span>
        <span class="kafel__opis">wszystkich</span>
      </div>
      <div class="kafel">
        <span class="kafel__liczba">{{ uzbrojone }}</span>
        <span class="kafel__opis">uzbrojonych na tej stronie</span>
      </div>
      <div class="kafel">
        <span class="kafel__liczba">{{ uruchomione }}</span>
        <span class="kafel__opis">uruchomionych na tej stronie</span>
      </div>
    </div>

    <AlertForm :zajety="ladowanie" @zapisz="zapisz" />

    <ErrorNote :komunikat="blad" @zamknij="blad = null" />

    <FilterBar @zmiana="store.ustawFiltry" />

    <p v-if="ladowanie" class="stan">Ładuję…</p>
    <p v-else-if="pusto" class="stan">
      Brak alertów dla tych filtrów. Załóż pierwszy formularzem powyżej.
    </p>

    <table v-else class="tabela">
      <thead>
        <tr>
          <th>Instrument</th>
          <th>Reguła</th>
          <th>Status</th>
          <th>Notatka</th>
          <th class="do-prawej">Akcje</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="alert in pozycje" :key="alert.id">
          <td>
            <RouterLink :to="{ name: 'alert', params: { id: alert.id } }" class="ticker">
              {{ alert.ticker }}
            </RouterLink>
          </td>
          <td>
            {{ alert.direction === "above" ? "≥" : "≤" }}
            {{ sformatuj(alert.threshold) }}
          </td>
          <td><StatusBadge :status="alert.status" /></td>
          <td class="notatka">{{ alert.note ?? "—" }}</td>
          <td class="do-prawej">
            <button
              v-if="alert.status !== 'armed'"
              type="button"
              class="przycisk przycisk--maly"
              @click="store.uzbrojPonownie(alert.id)"
            >
              Uzbrój
            </button>
            <button
              v-if="alert.status === 'armed'"
              type="button"
              class="przycisk przycisk--maly"
              @click="store.ustawStatus(alert.id, 'disabled')"
            >
              Wyłącz
            </button>
            <button
              type="button"
              class="przycisk przycisk--maly przycisk--grozny"
              @click="store.usun(alert.id)"
            >
              Usuń
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="total > 0" class="stronicowanie">
      <button
        type="button"
        class="przycisk"
        :disabled="stronaOd <= 1"
        @click="store.przejdz(-1)"
      >
        ← Poprzednia
      </button>
      <span>{{ stronaOd }}–{{ stronaDo }} z {{ total }}</span>
      <button type="button" class="przycisk" :disabled="!jestNastepna" @click="store.przejdz(1)">
        Następna →
      </button>
    </div>
  </section>
</template>
