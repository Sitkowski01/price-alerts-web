<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";

import AlertForm from "../components/AlertForm.vue";
import BaseIcon from "../components/BaseIcon.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import EmptyState from "../components/EmptyState.vue";
import ErrorNote from "../components/ErrorNote.vue";
import FilterBar from "../components/FilterBar.vue";
import SkeletonRows from "../components/SkeletonRows.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAlertsStore } from "../stores/alerts";
import { useToastsStore } from "../stores/toasts";
import type { Alert, AlertCreate } from "../api/types";

const store = useAlertsStore();
const toasty = useToastsStore();

// `storeToRefs` rozpakowuje stan i gettery, ZACHOWUJĄC reaktywność.
// Zwykłe `const { pozycje } = store` zerwałoby powiązanie i lista przestałaby się odświeżać.
// Akcje bierzemy prosto ze store'a — one reaktywności nie potrzebują.
const { pozycje, total, ladowanie, blad, uzbrojone, uruchomione, pusto, stronaOd, stronaDo, jestNastepna } =
  storeToRefs(store);

// Czy filtry cokolwiek zawężają — inny komunikat, gdy lista jest pusta z powodu filtra,
// a inny gdy alertów nie ma w ogóle.
const filtrowane = computed(() =>
  Boolean(store.filtry.ticker || store.filtry.status || store.filtry.direction),
);

const doUsuniecia = ref<Alert | null>(null);

onMounted(store.pobierz);

async function zapisz(dane: AlertCreate): Promise<void> {
  const alert = await store.utworz(dane);
  if (alert) toasty.pokaz(`Alert dla ${alert.ticker} założony.`);
}

async function przelacz(alert: Alert): Promise<void> {
  const uzbrajamy = alert.status !== "armed";
  const ok = uzbrajamy
    ? await store.uzbrojPonownie(alert.id)
    : await store.ustawStatus(alert.id, "disabled");

  if (ok) {
    toasty.pokaz(`${alert.ticker} — alert ${uzbrajamy ? "uzbrojony" : "wyłączony"}.`);
  }
}

async function potwierdzUsuniecie(): Promise<void> {
  const alert = doUsuniecia.value;
  doUsuniecia.value = null;
  if (!alert) return;

  if (await store.usun(alert.id)) toasty.pokaz(`Alert dla ${alert.ticker} usunięty.`);
}

function sformatuj(kwota: string): string {
  return Number(kwota).toFixed(2);
}
</script>

<template>
  <section>
    <div class="podsumowanie">
      <div class="kafel">
        <span class="kafel__gora"><BaseIcon nazwa="inbox" :rozmiar="15" /> Wszystkich</span>
        <span class="kafel__liczba">{{ total }}</span>
        <span class="kafel__opis">po uwzględnieniu filtrów</span>
      </div>
      <div class="kafel">
        <span class="kafel__gora"><BaseIcon nazwa="check" :rozmiar="15" /> Uzbrojonych</span>
        <span class="kafel__liczba">{{ uzbrojone }}</span>
        <span class="kafel__opis">czeka na notowanie</span>
      </div>
      <div class="kafel">
        <span class="kafel__gora"><BaseIcon nazwa="pulse" :rozmiar="15" /> Uruchomionych</span>
        <span class="kafel__liczba">{{ uruchomione }}</span>
        <span class="kafel__opis">wymaga ponownego uzbrojenia</span>
      </div>
    </div>

    <AlertForm :zajety="ladowanie" @zapisz="zapisz" />

    <ErrorNote :komunikat="blad" @zamknij="blad = null" />

    <FilterBar @zmiana="store.ustawFiltry" />

    <SkeletonRows v-if="ladowanie" />

    <EmptyState
      v-else-if="pusto && filtrowane"
      tytul="Nic nie pasuje do tych filtrów"
      opis="Zmień ticker, status albo kierunek — albo wyczyść filtry."
      ikona="search"
    />
    <EmptyState
      v-else-if="pusto"
      tytul="Nie masz jeszcze żadnego alertu"
      opis="Załóż pierwszy formularzem powyżej — powiemy Ci, gdy cena przebije Twój próg."
    />

    <div v-else class="tabela-oprawa">
      <table class="tabela">
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
              <span class="regula-komorka" :class="`kierunek--${alert.direction}`">
                <BaseIcon
                  :nazwa="alert.direction === 'above' ? 'trend-up' : 'trend-down'"
                  :rozmiar="15"
                />
                {{ alert.direction === "above" ? "≥" : "≤" }} {{ sformatuj(alert.threshold) }}
              </span>
            </td>
            <td><StatusBadge :status="alert.status" /></td>
            <td class="notatka">{{ alert.note ?? "—" }}</td>
            <td class="do-prawej">
              <div class="akcje-wiersza">
              <button type="button" class="przycisk przycisk--maly" @click="przelacz(alert)">
                <BaseIcon :nazwa="alert.status === 'armed' ? 'pause' : 'check'" :rozmiar="14" />
                {{ alert.status === "armed" ? "Wyłącz" : "Uzbrój" }}
              </button>
              <button
                type="button"
                class="przycisk przycisk--maly przycisk--grozny"
                @click="doUsuniecia = alert"
              >
                <BaseIcon nazwa="trash" :rozmiar="14" />
                Usuń
              </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > 0 && !ladowanie" class="stronicowanie">
      <button type="button" class="przycisk" :disabled="stronaOd <= 1" @click="store.przejdz(-1)">
        <BaseIcon nazwa="arrow-left" :rozmiar="14" /> Poprzednia
      </button>
      <span>{{ stronaOd }}–{{ stronaDo }} z {{ total }}</span>
      <button type="button" class="przycisk" :disabled="!jestNastepna" @click="store.przejdz(1)">
        Następna <BaseIcon nazwa="arrow-right" :rozmiar="14" />
      </button>
    </div>

    <!-- Usuwanie jest nieodwracalne, więc pytamy — reguła: potwierdzaj akcje destrukcyjne -->
    <ConfirmDialog
      :otwarte="doUsuniecia !== null"
      tytul="Usunąć alert?"
      :tresc="`Alert dla ${doUsuniecia?.ticker ?? ''} zniknie razem z całą historią uruchomień. Tego nie da się cofnąć.`"
      @potwierdz="potwierdzUsuniecie"
      @anuluj="doUsuniecia = null"
    />
  </section>
</template>
