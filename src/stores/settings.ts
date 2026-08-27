import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

const KLUCZ_PAMIECI = "pa-ustawienia";

export type TrybApi = "demo" | "http";

interface Zapisane {
  tryb: TrybApi;
  baseUrl: string;
  apiKey: string;
}

function wczytaj(): Zapisane {
  const domyslne: Zapisane = {
    // Domyślnie demo, żeby publiczny link działał bez backendu.
    tryb: (import.meta.env.VITE_API_MODE as TrybApi) ?? "demo",
    baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
    apiKey: "",
  };

  try {
    const surowe = localStorage.getItem(KLUCZ_PAMIECI);
    return surowe ? { ...domyslne, ...JSON.parse(surowe) } : domyslne;
  } catch {
    // Prywatne okno albo zablokowane dane witryny — działamy na domyślnych.
    return domyslne;
  }
}

/**
 * Store ustawień w stylu setup — czyli tak samo, jak pisze się komponent
 * w Composition API: `ref` to stan, `computed` to getter, zwykła funkcja to akcja.
 * Odpowiednik zustanda, którego już znasz, tylko z devtoolsami Vue w pakiecie.
 */
export const useSettingsStore = defineStore("settings", () => {
  const zapisane = wczytaj();

  const tryb = ref<TrybApi>(zapisane.tryb);
  const baseUrl = ref(zapisane.baseUrl);
  const apiKey = ref(zapisane.apiKey);

  const czyDemo = computed(() => tryb.value === "demo");
  // W trybie HTTP zapisy bez klucza skończą się na 401 — ostrzegamy wcześniej.
  const brakujeKlucza = computed(() => tryb.value === "http" && apiKey.value.trim() === "");

  // `watch` na kilku źródłach naraz: każda zmiana leci do localStorage.
  watch([tryb, baseUrl, apiKey], () => {
    try {
      localStorage.setItem(
        KLUCZ_PAMIECI,
        JSON.stringify({ tryb: tryb.value, baseUrl: baseUrl.value, apiKey: apiKey.value }),
      );
    } catch {
      /* brak dostępu do localStorage nie może wywrócić aplikacji */
    }
  });

  function ustawTryb(nowy: TrybApi): void {
    tryb.value = nowy;
  }

  return { tryb, baseUrl, apiKey, czyDemo, brakujeKlucza, ustawTryb };
});
