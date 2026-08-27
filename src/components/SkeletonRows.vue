<script setup lang="ts">
withDefaults(defineProps<{ ile?: number }>(), { ile: 4 });
</script>

<template>
  <!--
    Szkielet zamiast napisu „Ładuję…": rezerwuje tę samą wysokość co wiersze,
    więc lista nie podskakuje, gdy dane dojdą.
  -->
  <div class="szkielet" aria-hidden="true">
    <div v-for="n in ile" :key="n" class="szkielet__wiersz">
      <span class="szkielet__pasek" style="width: 18%" />
      <span class="szkielet__pasek" style="width: 22%" />
      <span class="szkielet__pasek" style="width: 16%" />
      <span class="szkielet__pasek" style="width: 30%" />
    </div>
  </div>
  <span class="tylko-dla-czytnika" role="status">Ładuję alerty…</span>
</template>
