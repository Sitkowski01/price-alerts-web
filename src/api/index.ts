import { useSettingsStore } from "../stores/settings";
import { DemoAlertsApi } from "./demo";
import { HttpAlertsApi } from "./http";
import type { AlertsApi } from "./types";

// Instancja demo musi przeżyć między wywołaniami — inaczej każdy widok
// dostawałby świeżo zasiane dane i nic by się nie zapisywało.
let demo: DemoAlertsApi | null = null;

/**
 * Wybór implementacji na podstawie ustawień. Store nie wie, którą dostaje —
 * to jest cała korzyść z interfejsu `AlertsApi`.
 */
export function useApi(): AlertsApi {
  const ustawienia = useSettingsStore();

  if (ustawienia.tryb === "demo") {
    demo ??= new DemoAlertsApi();
    return demo;
  }

  return new HttpAlertsApi(ustawienia.baseUrl, () => ustawienia.apiKey);
}

/** Tylko dla testów — pozwala zacząć od czystego stanu. */
export function zresetujDemo(): void {
  demo = null;
}
