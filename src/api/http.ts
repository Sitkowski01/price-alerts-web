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

/** Skąd bierzemy klucz API — wstrzykiwane, żeby klient nie zależał od store'a Pinii. */
type ZrodloKlucza = () => string;

export class HttpAlertsApi implements AlertsApi {
  private readonly baseUrl: string;
  private readonly apiKey: ZrodloKlucza;

  constructor(baseUrl: string, apiKey: ZrodloKlucza) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async zapytaj<T>(sciezka: string, init: RequestInit = {}): Promise<T> {
    const naglowki: Record<string, string> = { ...(init.headers as Record<string, string>) };

    // Backend wymaga klucza tylko przy zapisach, ale wysyłanie go zawsze
    // nic nie psuje i upraszcza ten kod.
    if (init.method && init.method !== "GET") {
      naglowki["Content-Type"] = "application/json";
      naglowki["X-API-Key"] = this.apiKey();
    }

    let odpowiedz: Response;
    try {
      odpowiedz = await fetch(`${this.baseUrl}${sciezka}`, { ...init, headers: naglowki });
    } catch (blad) {
      // fetch odrzuca obietnicę tylko przy problemie sieciowym — kod HTTP to nie wyjątek.
      throw new ApiError(
        `Nie udało się połączyć z API (${this.baseUrl}). Czy backend działa? ${String(blad)}`,
        0,
      );
    }

    if (odpowiedz.status === 204) {
      return undefined as T;
    }

    if (!odpowiedz.ok) {
      throw new ApiError(await this.opisBledu(odpowiedz), odpowiedz.status);
    }

    return (await odpowiedz.json()) as T;
  }

  /** FastAPI zwraca `detail` — czasem tekstem, czasem listą błędów walidacji. */
  private async opisBledu(odpowiedz: Response): Promise<string> {
    if (odpowiedz.status === 401) {
      return "Brak lub nieprawidłowy klucz API. Ustaw go w zakładce Ustawienia.";
    }

    try {
      const cialo = await odpowiedz.json();
      const detail = cialo?.detail;

      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((d: { loc?: unknown[]; msg?: string }) => {
            const pole = Array.isArray(d.loc) ? d.loc.slice(1).join(".") : "";
            return pole ? `${pole}: ${d.msg}` : String(d.msg);
          })
          .join("; ");
      }
    } catch {
      /* ciało nie było JSON-em — zostaje komunikat ogólny */
    }

    return `Błąd ${odpowiedz.status}`;
  }

  list(filters: AlertFilters): Promise<AlertPage> {
    const params = new URLSearchParams();
    if (filters.ticker) params.set("ticker", filters.ticker);
    if (filters.status) params.set("status", filters.status);
    if (filters.direction) params.set("direction", filters.direction);
    params.set("limit", String(filters.limit ?? 20));
    params.set("offset", String(filters.offset ?? 0));

    return this.zapytaj<AlertPage>(`/v1/alerts?${params}`);
  }

  get(id: string): Promise<Alert> {
    return this.zapytaj<Alert>(`/v1/alerts/${id}`);
  }

  create(data: AlertCreate): Promise<Alert> {
    return this.zapytaj<Alert>("/v1/alerts", { method: "POST", body: JSON.stringify(data) });
  }

  update(id: string, data: AlertUpdate): Promise<Alert> {
    return this.zapytaj<Alert>(`/v1/alerts/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  }

  remove(id: string): Promise<void> {
    return this.zapytaj<void>(`/v1/alerts/${id}`, { method: "DELETE" });
  }

  triggers(id: string): Promise<Trigger[]> {
    return this.zapytaj<Trigger[]>(`/v1/alerts/${id}/triggers`);
  }

  sendQuote(quote: QuoteIn): Promise<QuoteResult> {
    return this.zapytaj<QuoteResult>("/v1/quotes", {
      method: "POST",
      body: JSON.stringify(quote),
    });
  }
}
