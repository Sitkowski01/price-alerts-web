<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

import BaseIcon from "./components/BaseIcon.vue";
import TickerTape from "./components/TickerTape.vue";
import ToastHost from "./components/ToastHost.vue";
import type { NazwaIkony } from "./components/ikony";
import { useMarketStore } from "./stores/market";
import { useSettingsStore } from "./stores/settings";

const ustawienia = useSettingsStore();
const market = useMarketStore();
const trasa = useRoute();

// Symulacja rusza sama, ale tylko w trybie demo — w trybie HTTP zalewałaby
// czyjś backend zapytaniami bez pytania o zgodę.
onMounted(market.startJesliDemo);

// Interwał trzeba posprzątać ręcznie. Store żyje dłużej niż komponent,
// więc bez tego zostałby działający timer po odmontowaniu aplikacji.
onUnmounted(market.stop);

const linki: Array<{ nazwa: string; etykieta: string; ikona: NazwaIkony }> = [
  { nazwa: "alerty", etykieta: "Alerty", ikona: "bell" },
  { nazwa: "notowanie", etykieta: "Notowanie", ikona: "pulse" },
  { nazwa: "ustawienia", etykieta: "Ustawienia", ikona: "settings" },
];

const aktywna = computed(() => trasa.name);
</script>

<template>
  <div class="powloka">
    <header class="naglowek">
      <div class="marka">
        <span class="marka__znak"><BaseIcon nazwa="bell" :rozmiar="20" /></span>
        <div>
          <h1>Price Alerts</h1>
          <p class="podtytul">Alerty cenowe — klient dla API w FastAPI</p>
        </div>
      </div>

      <nav class="nawigacja" aria-label="Nawigacja główna">
        <RouterLink
          v-for="link in linki"
          :key="link.nazwa"
          :to="{ name: link.nazwa }"
          class="link"
          :class="{ 'link--aktywny': aktywna === link.nazwa }"
        >
          <BaseIcon :nazwa="link.ikona" :rozmiar="16" />
          {{ link.etykieta }}
        </RouterLink>
      </nav>
    </header>

    <p v-if="ustawienia.czyDemo" class="pasek pasek--demo">
      <BaseIcon nazwa="warning" :rozmiar="15" />
      <span>
        Tryb demo — dane trzymane w pamięci przeglądarki, backend nie jest potrzebny.
        Przełącz w <RouterLink :to="{ name: 'ustawienia' }">Ustawieniach</RouterLink>, żeby
        rozmawiać z prawdziwym API.
      </span>
    </p>
    <p v-else-if="ustawienia.brakujeKlucza" class="pasek pasek--ostrzezenie">
      <BaseIcon nazwa="warning" :rozmiar="15" />
      <span>Tryb HTTP bez klucza API — odczyty zadziałają, ale każdy zapis wróci z kodem 401.</span>
    </p>

    <TickerTape />

    <main class="tresc">
      <RouterView />
    </main>

    <footer class="stopka">
      <a href="https://github.com/Sitkowski01/price-alerts-api" target="_blank" rel="noreferrer">
        Backend: price-alerts-api
      </a>
      <span aria-hidden="true">·</span>
      <a href="https://github.com/Sitkowski01" target="_blank" rel="noreferrer">Sitkowski01</a>
    </footer>

    <ToastHost />
  </div>
</template>
