<script setup lang="ts">
import BaseIcon from "./BaseIcon.vue";

defineProps<{ komunikat: string | null }>();
const emit = defineEmits<{ zamknij: [] }>();
</script>

<template>
  <!-- role="alert" ogłasza błąd czytnikowi ekranu bez zabierania fokusu -->
  <div v-if="komunikat" class="blad" role="alert">
    <BaseIcon nazwa="warning" :rozmiar="17" />
    <span>{{ komunikat }}</span>
    <button type="button" class="blad__zamknij" aria-label="Zamknij komunikat" @click="emit('zamknij')">
      <BaseIcon nazwa="close" :rozmiar="14" />
    </button>
  </div>
</template>
