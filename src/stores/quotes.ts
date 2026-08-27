import { ref } from "vue";
import { defineStore } from "pinia";

import { useApi } from "../api";
import { ApiError } from "../api/types";
import type { QuoteResult } from "../api/types";

export const useQuotesStore = defineStore("quotes", () => {
  const wynik = ref<QuoteResult | null>(null);
  const wysylanie = ref(false);
  const blad = ref<string | null>(null);

  async function wyslij(ticker: string, price: string, quoteTs: string): Promise<boolean> {
    wysylanie.value = true;
    blad.value = null;
    try {
      wynik.value = await useApi().sendQuote({ ticker, price, quote_ts: quoteTs });
      return true;
    } catch (e) {
      blad.value = e instanceof ApiError ? e.message : `Nieoczekiwany błąd: ${String(e)}`;
      wynik.value = null;
      return false;
    } finally {
      wysylanie.value = false;
    }
  }

  function wyczysc(): void {
    wynik.value = null;
    blad.value = null;
  }

  return { wynik, wysylanie, blad, wyslij, wyczysc };
});
