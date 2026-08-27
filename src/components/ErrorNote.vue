<script setup lang="ts">
defineProps<{ komunikat: string | null }>();

// `defineEmits` deklaruje zdarzenia w górę — odpowiednik `onDismiss` w propsach Reacta,
// tylko że rodzic podpina się przez `@zamknij`.
const emit = defineEmits<{ zamknij: [] }>();
</script>

<template>
  <div v-if="komunikat" class="blad" role="alert">
    <span>{{ komunikat }}</span>
    <button type="button" class="blad__zamknij" aria-label="Zamknij" @click="emit('zamknij')">
      ×
    </button>
  </div>
</template>
