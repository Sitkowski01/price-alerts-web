<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import BaseIcon from "./BaseIcon.vue";

const props = defineProps<{ otwarte: boolean; tytul: string; tresc: string }>();
const emit = defineEmits<{ potwierdz: []; anuluj: [] }>();

const przyciskAnuluj = ref<HTMLButtonElement | null>(null);

// Po otwarciu fokus ląduje na akcji bezpiecznej, nie na destrukcyjnej.
watch(
  () => props.otwarte,
  async (czyOtwarte) => {
    if (czyOtwarte) {
      await new Promise((r) => requestAnimationFrame(r));
      przyciskAnuluj.value?.focus();
    }
  },
);

// Escape zamyka — każde okno modalne musi mieć drogę ucieczki.
function naKlawisz(e: KeyboardEvent): void {
  if (e.key === "Escape" && props.otwarte) emit("anuluj");
}

onMounted(() => window.addEventListener("keydown", naKlawisz));
</script>

<template>
  <Transition name="modal">
    <div v-if="otwarte" class="przeslona" @click.self="emit('anuluj')">
      <div class="modal" role="alertdialog" aria-modal="true" :aria-label="tytul">
        <div class="modal__ikona"><BaseIcon nazwa="warning" :rozmiar="20" /></div>
        <h3>{{ tytul }}</h3>
        <p>{{ tresc }}</p>
        <div class="modal__akcje">
          <button ref="przyciskAnuluj" type="button" class="przycisk" @click="emit('anuluj')">
            Anuluj
          </button>
          <button type="button" class="przycisk przycisk--grozny-pelny" @click="emit('potwierdz')">
            Usuń
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
