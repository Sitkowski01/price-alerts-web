<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { RouterLink } from "vue-router";

import ErrorNote from "../components/ErrorNote.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAlertsStore } from "../stores/alerts";
import { useQuotesStore } from "../stores/quotes";

const quotes = useQuotesStore();
const alerts = useAlertsStore();
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
    // Lista alertów mogła się zmienić — status uruchomionych poszedł na `triggered`.
    await alerts.pobierz();
  }
}
</script>

<template>
  <section>
    <h2>Wyślij notowanie</h2>
    <p class="wstep">
      Notowanie jest oceniane względem <strong>uzbrojonych</strong> alertów na ten instrument.
      Alert z progiem w górę zadziała, gdy cena jest równa progowi albo wyższa.
    </p>

    <form class="formularz" @submit.prevent="wyslij">
      <div class="pola">
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
        {{ wysylanie ? "Wysyłam…" : "Wyślij notowanie" }}
      </button>
    </form>

    <ErrorNote :komunikat="blad" @zamknij="quotes.wyczysc" />

    <div v-if="wynik" class="wynik">
      <h3>Wynik</h3>
      <p>
        {{ wynik.ticker }} po {{ Number(wynik.price).toFixed(2) }} —
        sprawdzono <strong>{{ wynik.evaluated }}</strong>
        {{ wynik.evaluated === 1 ? "uzbrojony alert" : "uzbrojonych alertów" }}.
      </p>

      <p v-if="wynik.triggered.length === 0" class="stan">
        Żaden alert nie zadziałał. Jeśli spodziewałeś się reakcji, sprawdź, czy alert jest
        uzbrojony — ten, który już raz zadziałał, milczy do ponownego uzbrojenia.
      </p>

      <ul v-else class="uruchomione">
        <li v-for="alert in wynik.triggered" :key="alert.id">
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
