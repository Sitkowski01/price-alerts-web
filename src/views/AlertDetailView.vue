<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import ErrorNote from "../components/ErrorNote.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useApi } from "../api";
import { ApiError } from "../api/types";
import type { Alert, Trigger } from "../api/types";
import { useAlertsStore } from "../stores/alerts";

// Props z parametru trasy (`props: true` w routerze) — widok nie sięga po `useRoute`.
const props = defineProps<{ id: string }>();

const router = useRouter();
const store = useAlertsStore();

const alert = ref<Alert | null>(null);
const historia = ref<Trigger[]>([]);
const ladowanie = ref(true);
const blad = ref<string | null>(null);

async function wczytaj(): Promise<void> {
  ladowanie.value = true;
  blad.value = null;
  try {
    const api = useApi();
    // Dwa niezależne zapytania — nie ma powodu czekać na nie po kolei.
    const [dane, wpisy] = await Promise.all([api.get(props.id), api.triggers(props.id)]);
    alert.value = dane;
    historia.value = wpisy;
  } catch (e) {
    blad.value = e instanceof ApiError ? e.message : String(e);
    alert.value = null;
  } finally {
    ladowanie.value = false;
  }
}

onMounted(wczytaj);

async function uzbroj(): Promise<void> {
  if (!alert.value) return;
  if (await store.uzbrojPonownie(alert.value.id)) await wczytaj();
}

async function usun(): Promise<void> {
  if (!alert.value) return;
  if (await store.usun(alert.value.id)) await router.push({ name: "alerty" });
}

function czas(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL");
}
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'alerty' }" class="powrot">← Wszystkie alerty</RouterLink>

    <p v-if="ladowanie" class="stan">Ładuję…</p>
    <ErrorNote :komunikat="blad" @zamknij="blad = null" />

    <template v-if="alert">
      <header class="szczegoly__naglowek">
        <div>
          <h2>{{ alert.ticker }}</h2>
          <p class="regula">
            Powiadom, gdy cena {{ alert.direction === "above" ? "wejdzie na" : "spadnie do" }}
            <strong>{{ Number(alert.threshold).toFixed(2) }}</strong>
          </p>
        </div>
        <StatusBadge :status="alert.status" />
      </header>

      <dl class="dane">
        <div><dt>Notatka</dt><dd>{{ alert.note ?? "—" }}</dd></div>
        <div><dt>Założony</dt><dd>{{ czas(alert.created_at) }}</dd></div>
        <div><dt>Zmieniony</dt><dd>{{ czas(alert.updated_at) }}</dd></div>
      </dl>

      <div class="akcje">
        <button
          v-if="alert.status !== 'armed'"
          type="button"
          class="przycisk przycisk--glowny"
          @click="uzbroj"
        >
          Uzbrój ponownie
        </button>
        <button type="button" class="przycisk przycisk--grozny" @click="usun">Usuń alert</button>
      </div>

      <h3>Historia uruchomień</h3>
      <p v-if="historia.length === 0" class="stan">
        Ten alert jeszcze nie zadziałał.
      </p>
      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Cena</th>
            <th>Znacznik notowania</th>
            <th>Zapisano</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="wpis in historia" :key="wpis.id">
            <td>{{ Number(wpis.price).toFixed(2) }}</td>
            <td>{{ czas(wpis.quote_ts) }}</td>
            <td>{{ czas(wpis.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </section>
</template>
