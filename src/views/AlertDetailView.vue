<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import BaseIcon from "../components/BaseIcon.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import EmptyState from "../components/EmptyState.vue";
import ErrorNote from "../components/ErrorNote.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useToastsStore } from "../stores/toasts";
import { useApi } from "../api";
import { ApiError } from "../api/types";
import type { Alert, Trigger } from "../api/types";
import { useAlertsStore } from "../stores/alerts";

// Props z parametru trasy (`props: true` w routerze) — widok nie sięga po `useRoute`.
const props = defineProps<{ id: string }>();

const router = useRouter();
const store = useAlertsStore();
const toasty = useToastsStore();
const pytamyOUsuniecie = ref(false);

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
  const nazwa = alert.value.ticker;
  if (await store.uzbrojPonownie(alert.value.id)) {
    toasty.pokaz(nazwa + " — alert uzbrojony.");
    await wczytaj();
  }
}

async function usun(): Promise<void> {
  pytamyOUsuniecie.value = false;
  if (!alert.value) return;
  const nazwa = alert.value.ticker;
  if (await store.usun(alert.value.id)) {
    toasty.pokaz("Alert dla " + nazwa + " usunięty.");
    await router.push({ name: "alerty" });
  }
}

function czas(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL");
}
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'alerty' }" class="powrot">
      <BaseIcon nazwa="arrow-left" :rozmiar="15" /> Wszystkie alerty
    </RouterLink>

    <p v-if="ladowanie" class="stan">Ładuję…</p>
    <ErrorNote :komunikat="blad" @zamknij="blad = null" />

    <template v-if="alert">
      <header class="szczegoly__naglowek">
        <div>
          <h2>{{ alert.ticker }}</h2>
          <p class="regula" :class="'kierunek--' + alert.direction">
            <BaseIcon
              :nazwa="alert.direction === 'above' ? 'trend-up' : 'trend-down'"
              :rozmiar="16"
            />
            <span>
              Powiadom, gdy cena {{ alert.direction === "above" ? "wejdzie na" : "spadnie do" }}
              <strong>{{ Number(alert.threshold).toFixed(2) }}</strong>
            </span>
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
          <BaseIcon nazwa="check" :rozmiar="15" /> Uzbrój ponownie
        </button>
        <button type="button" class="przycisk przycisk--grozny" @click="pytamyOUsuniecie = true">
          <BaseIcon nazwa="trash" :rozmiar="15" /> Usuń alert
        </button>
      </div>

      <h3>Historia uruchomień</h3>
      <EmptyState
        v-if="historia.length === 0"
        tytul="Ten alert jeszcze nie zadziałał"
        opis="Wpis pojawi się tutaj, gdy notowanie przebije próg."
        ikona="pulse"
      />
      <div v-else class="tabela-oprawa">
        <table class="tabela">
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
      </div>
      <ConfirmDialog
        :otwarte="pytamyOUsuniecie"
        tytul="Usunąć alert?"
        :tresc="'Alert dla ' + alert.ticker + ' zniknie razem z całą historią uruchomień. Tego nie da się cofnąć.'"
        @potwierdz="usun"
        @anuluj="pytamyOUsuniecie = false"
      />
    </template>
  </section>
</template>
