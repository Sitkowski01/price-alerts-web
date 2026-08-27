import { describe, expect, it } from "vitest";

import { DemoAlertsApi } from "../src/api/demo";
import { ApiError } from "../src/api/types";

const TS = "2026-08-27T10:00:00.000Z";

function pusteApi(): DemoAlertsApi {
  // Bez zasiewu — testy nie mogą zależeć od danych demonstracyjnych.
  return new DemoAlertsApi(false);
}

async function zalozAlert(api: DemoAlertsApi, nadpisania: Record<string, unknown> = {}) {
  return api.create({ ticker: "CDR", direction: "above", threshold: "100", ...nadpisania } as never);
}

describe("Tryb demo odwzorowuje reguły backendu", () => {
  it("normalizuje ticker do wersalików", async () => {
    const api = pusteApi();
    const alert = await zalozAlert(api, { ticker: "  cdr  " });

    expect(alert.ticker).toBe("CDR");
  });

  it("odrzuca próg niedodatni", async () => {
    const api = pusteApi();

    await expect(zalozAlert(api, { threshold: "0" })).rejects.toBeInstanceOf(ApiError);
    await expect(zalozAlert(api, { threshold: "-5" })).rejects.toBeInstanceOf(ApiError);
  });

  it("nowy alert jest uzbrojony", async () => {
    const api = pusteApi();
    const alert = await zalozAlert(api);

    expect(alert.status).toBe("armed");
  });

  it("cena równa progowi uruchamia alert — próg jest domknięty", async () => {
    const api = pusteApi();
    await zalozAlert(api, { threshold: "100" });

    const wynik = await api.sendQuote({ ticker: "CDR", price: "100", quote_ts: TS });

    expect(wynik.triggered).toHaveLength(1);
    expect(wynik.triggered[0].status).toBe("triggered");
  });

  it("cena poniżej progu nie uruchamia alertu w górę", async () => {
    const api = pusteApi();
    await zalozAlert(api, { threshold: "100" });

    const wynik = await api.sendQuote({ ticker: "CDR", price: "99.99", quote_ts: TS });

    expect(wynik.evaluated).toBe(1);
    expect(wynik.triggered).toHaveLength(0);
  });

  it("alert w dół uruchamia się poniżej progu", async () => {
    const api = pusteApi();
    await zalozAlert(api, { direction: "below", threshold: "100" });

    const wynik = await api.sendQuote({ ticker: "CDR", price: "80", quote_ts: TS });

    expect(wynik.triggered).toHaveLength(1);
  });

  it("notowanie innego instrumentu nie rusza alertu", async () => {
    const api = pusteApi();
    await zalozAlert(api, { ticker: "CDR" });

    const wynik = await api.sendQuote({ ticker: "PKN", price: "9999", quote_ts: TS });

    expect(wynik.evaluated).toBe(0);
  });

  it("alert działa raz — do ponownego uzbrojenia milczy", async () => {
    const api = pusteApi();
    const alert = await zalozAlert(api);
    await api.sendQuote({ ticker: "CDR", price: "150", quote_ts: TS });

    const drugie = await api.sendQuote({
      ticker: "CDR",
      price: "160",
      quote_ts: "2026-08-27T11:00:00.000Z",
    });

    expect(drugie.evaluated).toBe(0);
    expect((await api.get(alert.id)).status).toBe("triggered");
  });

  it("powtórzone notowanie nie dubluje historii", async () => {
    const api = pusteApi();
    const alert = await zalozAlert(api);
    await api.sendQuote({ ticker: "CDR", price: "150", quote_ts: TS });

    // Uzbrajamy ponownie i odtwarzamy dokładnie to samo notowanie.
    await api.update(alert.id, { status: "armed" });
    const powtorka = await api.sendQuote({ ticker: "CDR", price: "150", quote_ts: TS });

    expect(powtorka.triggered).toHaveLength(0);
    expect(await api.triggers(alert.id)).toHaveLength(1);
  });

  it("nowy znacznik czasu po ponownym uzbrojeniu zapisuje się", async () => {
    const api = pusteApi();
    const alert = await zalozAlert(api);
    await api.sendQuote({ ticker: "CDR", price: "150", quote_ts: TS });
    await api.update(alert.id, { status: "armed" });

    await api.sendQuote({ ticker: "CDR", price: "155", quote_ts: "2026-08-28T10:00:00.000Z" });

    expect(await api.triggers(alert.id)).toHaveLength(2);
  });

  it("alert wyłączony nie jest oceniany", async () => {
    const api = pusteApi();
    const alert = await zalozAlert(api);
    await api.update(alert.id, { status: "disabled" });

    const wynik = await api.sendQuote({ ticker: "CDR", price: "9999", quote_ts: TS });

    expect(wynik.evaluated).toBe(0);
  });

  it("usunięcie alertu kasuje jego historię", async () => {
    const api = pusteApi();
    const alert = await zalozAlert(api);
    await api.sendQuote({ ticker: "CDR", price: "150", quote_ts: TS });

    await api.remove(alert.id);

    await expect(api.triggers(alert.id)).rejects.toBeInstanceOf(ApiError);
  });

  it("nieistniejący alert kończy się błędem 404", async () => {
    const api = pusteApi();

    await expect(api.get("nie-ma")).rejects.toMatchObject({ status: 404 });
  });

  it("filtruje po tickerze niezależnie od wielkości liter", async () => {
    const api = pusteApi();
    await zalozAlert(api, { ticker: "CDR" });
    await zalozAlert(api, { ticker: "PKN" });

    const strona = await api.list({ ticker: "cdr" });

    expect(strona.total).toBe(1);
    expect(strona.items[0].ticker).toBe("CDR");
  });

  it("przycina limit do maksimum", async () => {
    const api = pusteApi();

    const strona = await api.list({ limit: 100000 });

    expect(strona.limit).toBe(200);
  });
});
