import type {
  Alert,
  AlertCreate,
  AlertFilters,
  AlertPage,
  AlertUpdate,
  AlertsApi,
  QuoteIn,
  QuoteResult,
  Trigger,
} from "./types";
import { ApiError } from "./types";

/**
 * Implementacja w pamięci przeglądarki — po to, żeby publiczny link do portfolio
 * działał bez postawionego backendu.
 *
 * Odwzorowuje te same reguły co API: znormalizowany ticker, domknięty próg,
 * alert działający raz do ponownego uzbrojenia i brak duplikatu przy powtórzonym
 * notowaniu. Dzięki temu demo nie kłamie o zachowaniu systemu.
 */
export class DemoAlertsApi implements AlertsApi {
  private alerty: Alert[] = [];
  private uruchomienia: Trigger[] = [];
  private licznik = 0;

  constructor(zasiej = true) {
    if (zasiej) this.zasiej();
  }

  // Wszystkie metody są `async` celowo: dzięki temu błąd walidacji wraca jako
  // odrzucona obietnica, a nie synchroniczny wyjątek. Klient API musi zachowywać
  // się tak samo niezależnie od implementacji.

  /**
   * Zwracamy KOPIE, nigdy własnych obiektów.
   *
   * Klient HTTP zawsze oddaje świeży obiekt sparsowany z JSON-a. Gdy tryb demo
   * oddawał referencje do swojego stanu, mutacja po stronie "serwera"
   * (`alert.status = ...`) dotykała surowego obiektu z pominięciem proxy Vue,
   * więc widok się nie odświeżał — przycisk działał, ale plakietka nie drgnęła.
   * Kopia sprawia, że obie implementacje zachowują się tak samo.
   */
  private kopia<T>(wartosc: T): T {
    return structuredClone(wartosc);
  }

  /** Sztuczne opóźnienie — bez niego stany ładowania nigdy nie byłyby widoczne. */
  private async zwloka<T>(wynik: T): Promise<T> {
    await new Promise((r) => setTimeout(r, 180));
    return wynik;
  }

  private id(): string {
    this.licznik += 1;
    return `demo-${String(this.licznik).padStart(4, "0")}`;
  }

  private teraz(): string {
    return new Date().toISOString();
  }

  private zasiej(): void {
    const dane: Array<[string, Alert["direction"], string, Alert["status"], string | null]> = [
      ["CDR", "above", "180.000000", "armed", "wyjście z konsolidacji"],
      ["PKN", "below", "60.000000", "armed", null],
      ["KGH", "above", "150.000000", "triggered", "zrealizowany"],
      ["ALE", "below", "25.000000", "disabled", "wstrzymane"],
      ["DNP", "above", "400.000000", "armed", null],
    ];

    for (const [ticker, direction, threshold, status, note] of dane) {
      const znacznik = this.teraz();
      this.alerty.push({
        id: this.id(),
        ticker,
        direction,
        threshold,
        status,
        note,
        created_at: znacznik,
        updated_at: znacznik,
      });
    }

    const zrealizowany = this.alerty.find((a) => a.status === "triggered");
    if (zrealizowany) {
      this.uruchomienia.push({
        id: this.id(),
        alert_id: zrealizowany.id,
        price: "152.400000",
        quote_ts: this.teraz(),
        created_at: this.teraz(),
      });
    }
  }

  private normalizuj(ticker: string): string {
    return ticker.trim().toUpperCase();
  }

  private naDecimal(wartosc: string): string {
    const liczba = Number(wartosc);
    if (!Number.isFinite(liczba) || liczba <= 0) {
      throw new ApiError("threshold: wartość musi być większa od zera", 422);
    }
    return liczba.toFixed(6);
  }

  private znajdz(id: string): Alert {
    const alert = this.alerty.find((a) => a.id === id);
    if (!alert) throw new ApiError("Alert nie istnieje", 404);
    return alert;
  }

  async list(filters: AlertFilters): Promise<AlertPage> {
    const limit = Math.min(filters.limit ?? 20, 200);
    const offset = filters.offset ?? 0;

    let wynik = [...this.alerty].reverse();
    if (filters.ticker) {
      const szukany = this.normalizuj(filters.ticker);
      wynik = wynik.filter((a) => a.ticker === szukany);
    }
    if (filters.status) wynik = wynik.filter((a) => a.status === filters.status);
    if (filters.direction) wynik = wynik.filter((a) => a.direction === filters.direction);

    return this.zwloka({
      total: wynik.length,
      limit,
      offset,
      items: this.kopia(wynik.slice(offset, offset + limit)),
    });
  }

  async get(id: string): Promise<Alert> {
    return this.zwloka(this.kopia(this.znajdz(id)));
  }

  async create(data: AlertCreate): Promise<Alert> {
    const ticker = this.normalizuj(data.ticker);
    if (!ticker) throw new ApiError("ticker: nie może być pusty", 422);

    const znacznik = this.teraz();
    const alert: Alert = {
      id: this.id(),
      ticker,
      direction: data.direction,
      threshold: this.naDecimal(data.threshold),
      status: "armed",
      note: data.note?.trim() || null,
      created_at: znacznik,
      updated_at: znacznik,
    };
    this.alerty.push(alert);
    return this.zwloka(this.kopia(alert));
  }

  async update(id: string, data: AlertUpdate): Promise<Alert> {
    const alert = this.znajdz(id);
    if (data.threshold !== undefined) alert.threshold = this.naDecimal(data.threshold);
    if (data.status !== undefined) alert.status = data.status;
    if (data.note !== undefined) alert.note = data.note?.trim() || null;
    alert.updated_at = this.teraz();
    return this.zwloka(this.kopia(alert));
  }

  async remove(id: string): Promise<void> {
    const alert = this.znajdz(id);
    this.alerty = this.alerty.filter((a) => a.id !== alert.id);
    // Kaskada jak ON DELETE CASCADE po stronie bazy.
    this.uruchomienia = this.uruchomienia.filter((t) => t.alert_id !== alert.id);
    return this.zwloka(undefined);
  }

  async triggers(id: string): Promise<Trigger[]> {
    this.znajdz(id);
    return this.zwloka(
      this.kopia(
        this.uruchomienia
          .filter((t) => t.alert_id === id)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
      ),
    );
  }

  async sendQuote(quote: QuoteIn): Promise<QuoteResult> {
    const ticker = this.normalizuj(quote.ticker);
    const cena = Number(quote.price);
    if (!Number.isFinite(cena) || cena <= 0) {
      throw new ApiError("price: wartość musi być większa od zera", 422);
    }

    const kandydaci = this.alerty.filter((a) => a.ticker === ticker && a.status === "armed");
    const uruchomione: Alert[] = [];

    for (const alert of kandydaci) {
      const prog = Number(alert.threshold);
      // Próg domknięty z obu stron — cena równa progowi uruchamia alert.
      const trafia = alert.direction === "above" ? cena >= prog : cena <= prog;
      if (!trafia) continue;

      // Odpowiednik unikalnego indeksu (alert_id, quote_ts) i ON CONFLICT DO NOTHING.
      const juzBylo = this.uruchomienia.some(
        (t) => t.alert_id === alert.id && t.quote_ts === quote.quote_ts,
      );
      if (juzBylo) continue;

      this.uruchomienia.push({
        id: this.id(),
        alert_id: alert.id,
        price: cena.toFixed(6),
        quote_ts: quote.quote_ts,
        created_at: this.teraz(),
      });
      alert.status = "triggered";
      alert.updated_at = this.teraz();
      uruchomione.push(alert);
    }

    return this.zwloka({
      ticker,
      price: cena.toFixed(6),
      evaluated: kandydaci.length,
      triggered: this.kopia(uruchomione),
    });
  }
}
