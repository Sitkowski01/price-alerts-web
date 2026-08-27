import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { useApi } from "../api";
import { DLUGOSC_HISTORII, INSTRUMENTY } from "../market/instrumenty";
import { useAlertsStore } from "./alerts";
import { useSettingsStore } from "./settings";
import { useToastsStore } from "./toasts";

export interface Notowanie {
  ticker: string;
  nazwa: string;
  cena: number;
  otwarcie: number;
  historia: number[];
}

const TIK_MS = 1200;

export const useMarketStore = defineStore("market", () => {
  const notowania = ref<Notowanie[]>(
    INSTRUMENTY.map((i) => ({
      ticker: i.ticker,
      nazwa: i.nazwa,
      cena: i.bazowa,
      otwarcie: i.bazowa,
      historia: [i.bazowa],
    })),
  );

  const dziala = ref(false);
  let uchwyt: ReturnType<typeof setInterval> | undefined;

  const zmiany = computed(() =>
    Object.fromEntries(
      notowania.value.map((n) => [n.ticker, ((n.cena - n.otwarcie) / n.otwarcie) * 100]),
    ),
  );

  /**
   * Błądzenie losowe z lekkim ciągnięciem do ceny otwarcia.
   * Bez tego ciągnięcia szereg po kilku minutach ucieka w kosmos i wykres
   * przestaje cokolwiek znaczyć.
   */
  function nastepnaCena(cena: number, otwarcie: number, zmiennosc: number): number {
    const szum = (Math.random() - 0.5) * 2 * zmiennosc;
    const powrot = (otwarcie - cena) / otwarcie * 0.05;
    const nowa = cena * (1 + szum + powrot);
    return Math.max(0.01, Number(nowa.toFixed(2)));
  }

  async function tik(): Promise<void> {
    const alerts = useAlertsStore();
    const toasty = useToastsStore();

    // Instrumenty, na które ktoś faktycznie czeka — tylko dla nich wysyłamy
    // notowanie do API. Reszta rusza się wyłącznie na wykresie.
    const zAlertem = new Set(
      alerts.pozycje.filter((a) => a.status === "armed").map((a) => a.ticker),
    );

    const znacznik = new Date().toISOString();

    for (const [indeks, notowanie] of notowania.value.entries()) {
      const zmiennosc = INSTRUMENTY[indeks].zmiennosc;
      const cena = nastepnaCena(notowanie.cena, notowanie.otwarcie, zmiennosc);

      notowanie.cena = cena;
      notowanie.historia.push(cena);
      if (notowanie.historia.length > DLUGOSC_HISTORII) notowanie.historia.shift();
    }

    if (zAlertem.size === 0) return;

    for (const ticker of zAlertem) {
      const notowanie = notowania.value.find((n) => n.ticker === ticker);
      if (!notowanie) continue;

      try {
        const wynik = await useApi().sendQuote({
          ticker,
          price: notowanie.cena.toFixed(2),
          quote_ts: znacznik,
        });

        for (const alert of wynik.triggered) {
          toasty.pokaz(
            `${alert.ticker} ${alert.direction === "above" ? "≥" : "≤"} ${Number(
              alert.threshold,
            ).toFixed(2)} — alert zadziałał przy ${notowanie.cena.toFixed(2)}.`,
          );
        }
        if (wynik.triggered.length > 0) await alerts.pobierz();
      } catch {
        // Symulacja nie może wywrócić aplikacji, gdy API akurat nie odpowiada.
        stop();
        toasty.pokaz("Symulacja zatrzymana — API nie odpowiada.", "blad");
        return;
      }
    }
  }

  function start(): void {
    if (dziala.value) return;
    dziala.value = true;
    uchwyt = setInterval(() => void tik(), TIK_MS);
  }

  function stop(): void {
    dziala.value = false;
    if (uchwyt) clearInterval(uchwyt);
    uchwyt = undefined;
  }

  function przelacz(): void {
    dziala.value ? stop() : start();
  }

  /**
   * Automatyczny start tylko w trybie demo — w trybie HTTP symulacja zalewałaby
   * czyjś backend zapytaniami bez pytania o zgodę.
   *
   * Klucz `pa-symulacja=off` wyłącza autostart. Korzystają z niego testy
   * w przeglądarce: symulacja odpalałaby alerty w trakcie asercji i zmieniała
   * stan pod rękami, przez co wynik testu byłby losowaniem.
   */
  function startJesliDemo(): void {
    try {
      if (localStorage.getItem("pa-symulacja") === "off") return;
    } catch {
      /* brak dostępu do localStorage nie może zablokować startu */
    }
    if (useSettingsStore().czyDemo) start();
  }

  return { notowania, dziala, zmiany, start, stop, przelacz, startJesliDemo };
});
