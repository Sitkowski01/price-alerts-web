<script setup lang="ts">
import { storeToRefs } from "pinia";

import BaseIcon from "./BaseIcon.vue";
import { useToastsStore } from "../stores/toasts";

const store = useToastsStore();
const { pozycje } = storeToRefs(store);
</script>

<template>
  <!--
    aria-live="polite" ogłasza treść czytnikowi ekranu, ale NIE zabiera fokusu —
    inaczej toast przerywałby to, co użytkownik właśnie robi.
  -->
  <div class="toasty" role="status" aria-live="polite" aria-label="Powiadomienia">
    <TransitionGroup name="toast">
      <div v-for="toast in pozycje" :key="toast.id" class="toast" :class="`toast--${toast.rodzaj}`">
        <BaseIcon :nazwa="toast.rodzaj === 'sukces' ? 'check' : 'warning'" :rozmiar="16" />
        <span>{{ toast.tresc }}</span>
        <button
          type="button"
          class="toast__zamknij"
          aria-label="Zamknij powiadomienie"
          @click="store.zamknij(toast.id)"
        >
          <BaseIcon nazwa="close" :rozmiar="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
