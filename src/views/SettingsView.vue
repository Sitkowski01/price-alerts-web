<script setup lang="ts">
import { storeToRefs } from "pinia";

import BaseIcon from "../components/BaseIcon.vue";
import { useSettingsStore } from "../stores/settings";

const ustawienia = useSettingsStore();
const { tryb, baseUrl, apiKey, czyDemo } = storeToRefs(ustawienia);
</script>

<template>
  <section>
    <div class="karta">
      <div class="karta__naglowek">
        <BaseIcon nazwa="settings" :rozmiar="17" />
        <h2>Ustawienia</h2>
      </div>

      <fieldset class="pole">
        <legend>Źródło danych</legend>

        <label class="wybor">
          <input v-model="tryb" type="radio" value="demo" />
          <span>
            <strong>Demo</strong> — dane w pamięci przeglądarki. Nic nie trzeba stawiać,
            reguły działają tak samo jak w API.
          </span>
        </label>

        <label class="wybor">
          <input v-model="tryb" type="radio" value="http" />
          <span>
            <strong>Prawdziwe API</strong> — rozmowa z uruchomionym
            <code>price-alerts-api</code>.
          </span>
        </label>
      </fieldset>

      <template v-if="!czyDemo">
        <label class="pole">
          <span>Adres API</span>
          <input v-model="baseUrl" type="url" placeholder="http://localhost:8000" />
        </label>

        <label class="pole">
          <span>Klucz API (nagłówek <code>X-API-Key</code>)</span>
          <input v-model="apiKey" type="password" placeholder="wymagany przy zapisach" />
        </label>

        <p class="wstep">
          Backend uruchomisz przez <code>docker compose up</code> w repozytorium
          <a href="https://github.com/Sitkowski01/price-alerts-api" target="_blank" rel="noreferrer">
            price-alerts-api </a>. Klucz ustawiasz zmienną <code>API_KEY</code>.
        </p>
      </template>

      <p class="wstep">
        Ustawienia zapisują się w <code>localStorage</code> tej przeglądarki i nigdzie nie
        są wysyłane.
      </p>
    </div>
  </section>
</template>
