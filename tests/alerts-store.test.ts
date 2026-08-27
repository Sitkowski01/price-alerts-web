import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { zresetujDemo } from "../src/api";
import { useAlertsStore } from "../src/stores/alerts";
import { useSettingsStore } from "../src/stores/settings";

// Store rozmawia z API przez `useApi()`. W testach zostaje tryb demo,
// więc sprawdzamy prawdziwą ścieżkę: store → klient → reguły → z powrotem.
beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  zresetujDemo();
  useSettingsStore().ustawTryb("demo");
});

describe("Store alertów", () => {
  it("pobiera listę i liczy pozycje", async () => {
    const store = useAlertsStore();

    await store.pobierz();

    expect(store.pozycje.length).toBeGreaterThan(0);
    expect(store.total).toBe(store.pozycje.length);
    expect(store.ladowanie).toBe(false);
    expect(store.blad).toBeNull();
  });

  it("gettery liczą alerty po statusie", async () => {
    const store = useAlertsStore();
    await store.pobierz();

    const uzbrojoneRecznie = store.pozycje.filter((a) => a.status === "armed").length;

    expect(store.uzbrojone).toBe(uzbrojoneRecznie);
  });

  it("zmiana filtra wraca na pierwszą stronę", async () => {
    const store = useAlertsStore();
    await store.pobierz();
    await store.przejdz(1);
    expect(store.filtry.offset).toBeGreaterThan(0);

    await store.ustawFiltry({ status: "armed" });

    // Bez tego lista bywa pusta bez powodu — offset zostawał z poprzedniego filtra.
    expect(store.filtry.offset).toBe(0);
    expect(store.pozycje.every((a) => a.status === "armed")).toBe(true);
  });

  it("nie schodzi z offsetem poniżej zera", async () => {
    const store = useAlertsStore();
    await store.pobierz();

    await store.przejdz(-1);

    expect(store.filtry.offset).toBe(0);
  });

  it("utworzenie alertu odświeża listę", async () => {
    const store = useAlertsStore();
    await store.pobierz();
    const przed = store.total;

    const alert = await store.utworz({ ticker: "opl", direction: "above", threshold: "12.5" });

    expect(alert?.ticker).toBe("OPL");
    expect(store.total).toBe(przed + 1);
  });

  it("odrzucony próg trafia do pola błędu, a nie wywraca aplikacji", async () => {
    const store = useAlertsStore();

    const wynik = await store.utworz({ ticker: "CDR", direction: "above", threshold: "0" });

    expect(wynik).toBeNull();
    expect(store.blad).toContain("większa od zera");
  });

  it("usunięcie zdejmuje alert z listy", async () => {
    const store = useAlertsStore();
    await store.pobierz();
    const cel = store.pozycje[0];
    const przed = store.total;

    await store.usun(cel.id);

    expect(store.total).toBe(przed - 1);
    expect(store.pozycje.find((a) => a.id === cel.id)).toBeUndefined();
  });

  it("ponowne uzbrojenie zmienia status w miejscu, bez pełnego przeładowania", async () => {
    const store = useAlertsStore();
    await store.ustawFiltry({ status: "triggered" });
    const cel = store.pozycje[0];
    const szpieg = vi.spyOn(store, "pobierz");

    await store.uzbrojPonownie(cel.id);

    expect(store.pozycje.find((a) => a.id === cel.id)?.status).toBe("armed");
    expect(szpieg).not.toHaveBeenCalled();
  });

  it("błąd sieci zostawia pustą listę i komunikat", async () => {
    const ustawienia = useSettingsStore();
    // Tryb HTTP na adres, pod którym nic nie stoi.
    ustawienia.ustawTryb("http");
    ustawienia.baseUrl = "http://127.0.0.1:9";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const store = useAlertsStore();
    await store.pobierz();

    expect(store.pozycje).toHaveLength(0);
    expect(store.blad).toContain("Nie udało się połączyć");
  });
});
