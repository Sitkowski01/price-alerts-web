// Typy odwzorowują schematy z backendu (price-alerts-api, FastAPI + Pydantic).
// Kwoty przychodzą jako `string`, nie `number` — backend trzyma je w `numeric`,
// żeby nie gubić groszy na zaokrągleniu binarnym. Tutaj też ich nie parsujemy
// do `number` bez potrzeby; formatujemy do wyświetlenia i tyle.

export type Direction = "above" | "below";
export type AlertStatus = "armed" | "triggered" | "disabled";

export interface Alert {
  id: string;
  ticker: string;
  direction: Direction;
  threshold: string;
  status: AlertStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trigger {
  id: string;
  alert_id: string;
  price: string;
  quote_ts: string;
  created_at: string;
}

export interface AlertPage {
  total: number;
  limit: number;
  offset: number;
  items: Alert[];
}

export interface QuoteResult {
  ticker: string;
  price: string;
  evaluated: number;
  triggered: Alert[];
}

export interface AlertCreate {
  ticker: string;
  direction: Direction;
  threshold: string;
  note?: string | null;
}

export interface AlertUpdate {
  threshold?: string;
  status?: AlertStatus;
  note?: string | null;
}

export interface AlertFilters {
  ticker?: string;
  status?: AlertStatus;
  direction?: Direction;
  limit?: number;
  offset?: number;
}

export interface QuoteIn {
  ticker: string;
  price: string;
  quote_ts: string;
}

/** Błąd z warstwy API — niesie kod HTTP, żeby widok mógł zareagować inaczej na 401 niż na 500. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Kontrakt, którego trzymają się obie implementacje: prawdziwe HTTP i tryb demo.
 * Dzięki temu store nie wie, skąd biorą się dane — a publiczny link do portfolio
 * działa bez postawionego backendu.
 */
export interface AlertsApi {
  list(filters: AlertFilters): Promise<AlertPage>;
  get(id: string): Promise<Alert>;
  create(data: AlertCreate): Promise<Alert>;
  update(id: string, data: AlertUpdate): Promise<Alert>;
  remove(id: string): Promise<void>;
  triggers(id: string): Promise<Trigger[]>;
  sendQuote(quote: QuoteIn): Promise<QuoteResult>;
}
