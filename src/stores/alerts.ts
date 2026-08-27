import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { useApi } from "../api";
import { ApiError } from "../api/types";
import type { Alert, AlertCreate, AlertFilters, AlertStatus, AlertUpdate } from "../api/types";

export const useAlertsStore = defineStore("alerts", () => {
  // ── stan ──
  const pozycje = ref<Alert[]>([]);
  const total = ref(0);
  const filtry = ref<AlertFilters>({ limit: 20, offset: 0 });
  const ladowanie = ref(false);
  const blad = ref<string | null>(null);

  // ── gettery ──
  // `computed` przelicza się tylko wtedy, gdy zmieni się coś, z czego korzysta.
  // Bez `useMemo` i bez tablicy zależności — Vue śledzi je sam.
  const uzbrojone = computed(() => pozycje.value.filter((a) => a.status === "armed").length);
  const uruchomione = computed(() => pozycje.value.filter((a) => a.status === "triggered").length);
  const pusto = computed(() => !ladowanie.value && pozycje.value.length === 0);
  const stronaOd = computed(() => (filtry.value.offset ?? 0) + 1);
  const stronaDo = computed(() =>
    Math.min((filtry.value.offset ?? 0) + pozycje.value.length, total.value),
  );
  const jestNastepna = computed(
    () => (filtry.value.offset ?? 0) + (filtry.value.limit ?? 20) < total.value,
  );

  function opisz(e: unknown): string {
    return e instanceof ApiError ? e.message : `Nieoczekiwany błąd: ${String(e)}`;
  }

  // ── akcje ──
  async function pobierz(): Promise<void> {
    ladowanie.value = true;
    blad.value = null;
    try {
      const strona = await useApi().list(filtry.value);
      pozycje.value = strona.items;
      total.value = strona.total;
    } catch (e) {
      blad.value = opisz(e);
      pozycje.value = [];
      total.value = 0;
    } finally {
      ladowanie.value = false;
    }
  }

  /** Zmiana filtra zawsze wraca na pierwszą stronę — inaczej lista bywa pusta bez powodu. */
  async function ustawFiltry(nowe: Partial<AlertFilters>): Promise<void> {
    filtry.value = { ...filtry.value, ...nowe, offset: 0 };
    await pobierz();
  }

  async function przejdz(kierunek: 1 | -1): Promise<void> {
    const limit = filtry.value.limit ?? 20;
    const nowyOffset = Math.max(0, (filtry.value.offset ?? 0) + kierunek * limit);
    filtry.value = { ...filtry.value, offset: nowyOffset };
    await pobierz();
  }

  async function utworz(dane: AlertCreate): Promise<Alert | null> {
    blad.value = null;
    try {
      const alert = await useApi().create(dane);
      await pobierz();
      return alert;
    } catch (e) {
      blad.value = opisz(e);
      return null;
    }
  }

  async function zmien(id: string, dane: AlertUpdate): Promise<boolean> {
    blad.value = null;
    try {
      const zmieniony = await useApi().update(id, dane);
      // Podmieniamy w miejscu, żeby lista nie mrugała pełnym przeładowaniem.
      const i = pozycje.value.findIndex((a) => a.id === id);
      if (i !== -1) pozycje.value[i] = zmieniony;
      return true;
    } catch (e) {
      blad.value = opisz(e);
      return false;
    }
  }

  function uzbrojPonownie(id: string): Promise<boolean> {
    return zmien(id, { status: "armed" });
  }

  function ustawStatus(id: string, status: AlertStatus): Promise<boolean> {
    return zmien(id, { status });
  }

  async function usun(id: string): Promise<boolean> {
    blad.value = null;
    try {
      await useApi().remove(id);
      await pobierz();
      return true;
    } catch (e) {
      blad.value = opisz(e);
      return false;
    }
  }

  return {
    pozycje,
    total,
    filtry,
    ladowanie,
    blad,
    uzbrojone,
    uruchomione,
    pusto,
    stronaOd,
    stronaDo,
    jestNastepna,
    pobierz,
    ustawFiltry,
    przejdz,
    utworz,
    zmien,
    uzbrojPonownie,
    ustawStatus,
    usun,
  };
});
