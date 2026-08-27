<script setup lang="ts">
import { computed } from "vue";

import type { AlertStatus } from "../api/types";

// `defineProps` z typem generycznym — odpowiednik typowanych propsów w Reakcie.
// Nie trzeba go importować, jest dostępny w `<script setup>`.
const props = defineProps<{ status: AlertStatus }>();

const opisy: Record<AlertStatus, string> = {
  armed: "uzbrojony",
  triggered: "uruchomiony",
  disabled: "wyłączony",
};

const etykieta = computed(() => opisy[props.status]);
</script>

<template>
  <span class="plakietka" :class="`plakietka--${status}`">{{ etykieta }}</span>
</template>
