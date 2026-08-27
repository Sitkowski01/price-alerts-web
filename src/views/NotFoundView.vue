<script setup lang="ts">
import { RouterLink } from "vue-router";

import BaseIcon from "../components/BaseIcon.vue";
</script>

<template>
  <section class="pustka">
    <h2>404</h2>
    <p>Nie ma tu nic pod tym adresem.</p>
    <RouterLink :to="{ name: 'alerty' }" class="przycisk przycisk--glowny">
      <BaseIcon nazwa="arrow-left" :rozmiar="15" /> Wróć do alertów
    </RouterLink>
  </section>
</template>
