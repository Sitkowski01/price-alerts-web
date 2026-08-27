import { ref } from "vue";
import { defineStore } from "pinia";

export type RodzajToastu = "sukces" | "blad";

export interface Toast {
  id: number;
  rodzaj: RodzajToastu;
  tresc: string;
}

/**
 * Krótkie potwierdzenia akcji. Bez nich kliknięcie „Wyłącz" zmienia jedną
 * plakietkę w tabeli i łatwo tego nie zauważyć — użytkownik nie wie,
 * czy cokolwiek się stało.
 */
export const useToastsStore = defineStore("toasts", () => {
  const pozycje = ref<Toast[]>([]);
  let licznik = 0;

  function pokaz(tresc: string, rodzaj: RodzajToastu = "sukces"): void {
    licznik += 1;
    const id = licznik;
    pozycje.value.push({ id, rodzaj, tresc });
    // Zgodnie z regułą 3–5 s; dłużej zasłania treść, krócej nie da się przeczytać.
    setTimeout(() => zamknij(id), 4000);
  }

  function zamknij(id: number): void {
    pozycje.value = pozycje.value.filter((t) => t.id !== id);
  }

  return { pozycje, pokaz, zamknij };
});
