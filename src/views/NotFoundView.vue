<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="pustka">
    <h2>404</h2>
    <p>Nie ma tu nic pod tym adresem.</p>
    <RouterLink :to="{ name: 'alerty' }" class="przycisk przycisk--glowny">
      Wróć do alertów
    </RouterLink>
  </section>
</template>
