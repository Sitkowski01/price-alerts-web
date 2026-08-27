<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink } from "vue-router";

import BaseIcon from "../components/BaseIcon.vue";
import EmptyState from "../components/EmptyState.vue";
import ErrorNote from "../components/ErrorNote.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAlertsStore } from "../stores/alerts";
import { useQuotesStore } from "../stores/quotes";
import { useToastsStore } from "../stores/toasts";

const quotes = useQuotesStore();
const alerts = useAlertsStore();
const toasty = useToastsStore();
const { wynik, wysylanie, blad } = storeToRefs(quotes);

const ticker = ref("CDR");
const price = ref("");
// Domyślnie „teraz", ale pole jest edytowalne — na tym opiera się demonstracja
// idempotencji: dwa razy ten sam znacznik to jeden wpis w historii.
const quoteTs = ref(new Date().toISOString().slice(0, 16));

const poprawne = computed(() => {
  const p = Number(price.value);
  return ticker.value.trim() !== "" && Number.isFinite(p) && p > 0;
});

async function wyslij(): Promise<void> {
  if (!poprawne.value) return;
  const iso = new Date(quoteTs.value).toISOString();

  if (await quotes.wyslij(ticker.value, price.value, iso)) {
    const ile = wynik.value?.triggered.length ?? 0;
    toasty.pokaz(
      ile === 0 ? "Notowanie przyjęte — żaden alert nie zadziałał." : `Uruchomiono ${ile} alert(y).`,
    );
    // Lista alertów mogła się zmienić — status uruchomionych poszedł na `triggered`.
    await alerts.pobierz();
  }
}
</script>

<template>
  <section>
    <div class="karta">
      <div class="karta__naglowek">
        <BaseIcon nazwa="pulse" :rozmiar="17" />
        <h2>Wyślij notowanie</h2>
      </div>

      <p class="wstep">
        Notowanie jest oceniane względem <strong>uzbrojonych</strong> alertów na ten instrument.
        Alert z progiem w górę zadziała, gdy cena jest równa progowi albo wyższa. Alert, który
        już raz zadziałał, milczy do ponownego uzbrojenia.
      </p>

      <form @submit.prevent="wyslij">
        <div class="pola" style="margin-top: 16px">
          <label class="pole">
            <span>Ticker</span>
            <input v-model="ticker" type="text" maxlength="16" placeholder="np. CDR" />
          </label>
          <label class="pole">
            <span>Cena</span>
            <input v-model="price" type="text" inputmode="decimal" placeholder="np. 182.40" />
          </label>
          <label class="pole">
            <span>Znacznik czasu</span>
            <input v-model="quoteTs" type="datetime-local" />
          </label>
        </div>

        <button type="submit" class="przycisk przycisk--glowny" :disabled="!poprawne || wysylanie">
          <BaseIcon nazwa="arrow-right" :rozmiar="15" />
          {{ wysylanie ? "Wysyłam…" : "Wyślij notowanie" }}
        </button>
      </form>
    </div>

    <ErrorNote :komunikat="blad" @zamknij="quotes.wyczysc" />

    <div v-if="wynik" class="wynik">
      <h3>Wynik</h3>
      <p class="wynik__podsumowanie">
        <BaseIcon nazwa="pulse" :rozmiar="16" />
        <span>
          {{ wynik.ticker }} po
          <span class="wynik__cena">{{ Number(wynik.price).toFixed(2) }}</span> — sprawdzono
          <strong>{{ wynik.evaluated }}</strong>
          {{ wynik.evaluated === 1 ? "uzbrojony alert" : "uzbrojonych alertów" }}.
        </span>
      </p>

      <EmptyState
        v-if="wynik.triggered.length === 0"
        tytul="Żaden alert nie zadziałał"
        opis="Jeśli spodziewałeś się reakcji, sprawdź, czy alert jest uzbrojony — ten, który już raz zadziałał, milczy do ponownego uzbrojenia."
        ikona="search"
      />

      <ul v-else class="uruchomione">
        <li v-for="alert in wynik.triggered" :key="alert.id">
          <BaseIcon
            :nazwa="alert.direction === 'above' ? 'trend-up' : 'trend-down'"
            :rozmiar="16"
          />
          <RouterLink :to="{ name: 'alert', params: { id: alert.id } }">
            {{ alert.ticker }} {{ alert.direction === "above" ? "≥" : "≤" }}
            {{ Number(alert.threshold).toFixed(2) }}
          </RouterLink>
          <StatusBadge :status="alert.status" />
        </li>
      </ul>
    </div>
  </section>
</template>
