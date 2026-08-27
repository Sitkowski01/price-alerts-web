<script setup lang="ts">
import BaseIcon from "./BaseIcon.vue";
import type { NazwaIkony } from "./ikony";

withDefaults(defineProps<{ tytul: string; opis: string; ikona?: NazwaIkony }>(), {
  ikona: "inbox",
});
</script>

<template>
  <div class="pusto">
    <div class="pusto__ikona"><BaseIcon :nazwa="ikona" :rozmiar="26" /></div>
    <h3>{{ tytul }}</h3>
    <p>{{ opis }}</p>
    <slot />
  </div>
</template>
