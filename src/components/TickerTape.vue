<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";

import BaseIcon from "./BaseIcon.vue";
import Sparkline from "./Sparkline.vue";
import { useMarketStore } from "../stores/market";

const market = useMarketStore();
const { notowania, dziala, zmiany } = storeToRefs(market);

// Taśma przesuwa się o połowę swojej szerokości, więc listę trzeba podać
// dwa razy — inaczej po pierwszym przejściu zostałaby pusta przestrzeń.
const tasma = computed(() => [...notowania.value, ...notowania.value]);

function format(cena: number): string {
  return cena >= 1000 ? cena.toFixed(0) : cena.toFixed(2);
}
</script>

<template>
  <section class="tasma" aria-label="Symulowane notowania">
    <div class="tasma__sterowanie">
      <button
        type="button"
        class="tasma__przycisk"
        :class="{ 'tasma__przycisk--gra': dziala }"
        :aria-pressed="dziala"
        @click="market.przelacz()"
      >
        <span class="tasma__dioda" />
        {{ dziala ? "Symulacja gra" : "Symulacja stoi" }}
      </button>
    </div>

    <div class="tasma__okno">
      <div class="tasma__ruch" :class="{ 'tasma__ruch--stoi': !dziala }">
        <div v-for="(pozycja, i) in tasma" :key="`${pozycja.ticker}-${i}`" class="notowanie">
          <span class="notowanie__ticker">{{ pozycja.ticker }}</span>
          <span class="notowanie__cena">{{ format(pozycja.cena) }}</span>
          <span
            class="notowanie__zmiana"
            :class="zmiany[pozycja.ticker] >= 0 ? 'kierunek--above' : 'kierunek--below'"
          >
            <BaseIcon
              :nazwa="zmiany[pozycja.ticker] >= 0 ? 'trend-up' : 'trend-down'"
              :rozmiar="12"
            />
            {{ zmiany[pozycja.ticker] >= 0 ? "+" : "" }}{{ zmiany[pozycja.ticker].toFixed(2) }}%
          </span>
          <Sparkline :wartosci="pozycja.historia" :szerokosc="58" :wysokosc="18" />
        </div>
      </div>
    </div>
  </section>
</template>
