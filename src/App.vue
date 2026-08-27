<script setup lang="ts">
// `<script setup>` to skrócona forma Composition API: wszystko, co tu zadeklarujesz,
// jest widoczne w szablonie. Nie ma `return { ... }` ani `this`.
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

import { useSettingsStore } from "./stores/settings";

const ustawienia = useSettingsStore();
const trasa = useRoute();

const linki = [
  { nazwa: "alerty", etykieta: "Alerty" },
  { nazwa: "notowanie", etykieta: "Notowanie" },
  { nazwa: "ustawienia", etykieta: "Ustawienia" },
] as const;

const aktywna = computed(() => trasa.name);
</script>

<template>
  <div class="powloka">
    <header class="naglowek">
      <div class="marka">
        <span class="logo">◈</span>
        <div>
          <h1>Price Alerts</h1>
          <p class="podtytul">Alerty cenowe — klient dla API w FastAPI</p>
        </div>
      </div>

      <nav class="nawigacja">
        <!-- `v-for` wymaga `:key` z tego samego powodu co `key` w Reakcie -->
        <RouterLink
          v-for="link in linki"
          :key="link.nazwa"
          :to="{ name: link.nazwa }"
          class="link"
          :class="{ 'link--aktywny': aktywna === link.nazwa }"
        >
          {{ link.etykieta }}
        </RouterLink>
      </nav>
    </header>

    <!-- `v-if` usuwa element z DOM, nie tylko go ukrywa -->
    <p v-if="ustawienia.czyDemo" class="pasek pasek--demo">
      Tryb demo — dane trzymane w pamięci przeglądarki, backend nie jest potrzebny.
      Przełącz w <RouterLink :to="{ name: 'ustawienia' }">Ustawieniach</RouterLink>, żeby
      rozmawiać z prawdziwym API.
    </p>
    <p v-else-if="ustawienia.brakujeKlucza" class="pasek pasek--ostrzezenie">
      Tryb HTTP bez klucza API — odczyty zadziałają, ale każdy zapis wróci z kodem 401.
    </p>

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
  </div>
</template>
