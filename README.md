# Price Alerts — klient w Vue 3

[![CI](https://github.com/Sitkowski01/price-alerts-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Sitkowski01/price-alerts-web/actions/workflows/ci.yml)

Interfejs do serwisu alertów cenowych: zakładanie reguł progowych, wysyłanie notowań
i podgląd historii uruchomień. Rozmawia z
[**price-alerts-api**](https://github.com/Sitkowski01/price-alerts-api) — moim backendem
w FastAPI z PostgreSQL, skonteneryzowanym i uruchomionym na Kubernetesie.

**Vue 3 · Composition API · Pinia · Vue Router · TypeScript · Vitest**

## Co potrafi

- **Lista alertów** z filtrami (ticker, status, kierunek) i stronicowaniem po stronie serwera
- **Zakładanie alertu** z walidacją i podglądem reguły zwykłym zdaniem
  („Powiadom, gdy CDR wejdzie na 180.00")
- **Wysłanie notowania** i natychmiastowy wynik: ile alertów sprawdzono, które zadziałały
- **Szczegóły alertu** z historią uruchomień, ponownym uzbrojeniem i usunięciem
- **Dwa źródła danych** — prawdziwe API albo tryb demo w pamięci przeglądarki
- Obsługa błędów rozróżniająca brak klucza (401) od niedostępnego backendu

## Tryb demo

Publiczna wersja domyślnie **nie potrzebuje backendu**. `DemoAlertsApi` trzyma dane
w pamięci przeglądarki i odwzorowuje te same reguły co API: znormalizowany ticker,
domknięty próg, alert działający raz do ponownego uzbrojenia oraz brak duplikatu
w historii przy powtórzonym notowaniu.

Dzięki temu demo **nie kłamie o zachowaniu systemu** — a przełącznik w Ustawieniach
pozwala wpiąć się w prawdziwe API bez przebudowy aplikacji.

Obie implementacje realizują jeden interfejs `AlertsApi` (`src/api/types.ts`), więc store
nie wie, z którą rozmawia. To jest cały powód, dla którego ten podział istnieje.

## Uruchomienie

```bash
npm ci
npm run dev        # http://localhost:5173, domyślnie tryb demo
```

Żeby rozmawiać z prawdziwym backendem: uruchom `docker compose up` w repozytorium
`price-alerts-api`, a potem w zakładce **Ustawienia** przełącz źródło na „Prawdziwe API",
podaj adres (domyślnie `http://localhost:8000`) i klucz z `API_KEY`.

Można też ustawić to zmiennymi przy budowaniu:

```bash
VITE_API_MODE=http VITE_API_URL=http://localhost:8000 npm run build
```

## Testy

```bash
npm test           # jednorazowo
npm run test:watch
npm run typecheck  # vue-tsc bez emitowania
```

**37 testów w trzech plikach:**

| Plik | Co sprawdza |
|---|---|
| `tests/demo-api.test.ts` | reguły domenowe w trybie demo: normalizacja tickera, domknięty próg, odrzucenie progu niedodatniego, alert działający raz, **idempotencja powtórzonego notowania**, kaskadowe usunięcie historii, filtry i przycięcie limitu |
| `tests/alerts-store.test.ts` | store Pinii przez prawdziwą ścieżkę store → klient → reguły: pobieranie, gettery, **powrót na pierwszą stronę przy zmianie filtra**, aktualizacja w miejscu bez przeładowania listy, błąd sieci zostawiający czytelny komunikat |
| `tests/components.test.ts` | komponenty przez `@vue/test-utils`: walidacja formularza, emitowane zdarzenia, podgląd reguły reagujący na kierunek, czyszczenie pól po zapisie, blokada przycisku w trakcie zapisu |

Do tego **7 testów w prawdziwej przeglądarce** (Playwright, `npm run test:e2e`):

```bash
npx playwright install chromium
npm run test:e2e
```

Widoki są ładowane leniwie, więc testy jednostkowe nigdy ich nie renderują —
błąd w szablonie albo w imporcie przeszedłby niezauważony. Testy w przeglądarce
przechodzą całą aplikację: lista, zakładanie alertu z podglądem reguły, wysyłka
notowania kończąca się uruchomieniem, szczegóły z historią, filtrowanie, ustawienia
odsłaniające pola dopiero po wyborze prawdziwego API oraz strona 404.
**Każdy błąd w konsoli przeglądarki oblewa test.**

Testy store'a celowo idą przez `DemoAlertsApi`, a nie przez atrapę każdej metody —
sprawdzają realną ścieżkę danych, a nie to, czy mock został wywołany.

## Struktura

```
src/
  api/
    types.ts      typy z backendu + interfejs AlertsApi + ApiError
    http.ts       implementacja HTTP — nagłówek X-API-Key, tłumaczenie błędów FastAPI
    demo.ts       implementacja w pamięci, odwzorowuje reguły API
    index.ts      wybór implementacji wg ustawień
  stores/
    alerts.ts     lista, filtry, stronicowanie, akcje CRUD
    quotes.ts     wysyłka notowania i jego wynik
    settings.ts   tryb, adres API, klucz — zapisywane w localStorage
  components/     AlertForm, FilterBar, StatusBadge, ErrorNote
  views/          Alerts, AlertDetail, Quote, Settings, NotFound
  router/         trasy z leniwym ładowaniem widoków
```

## Decyzje, o których warto wiedzieć

- **Kwoty jako `string`, nie `number`.** Backend trzyma je w `numeric`, żeby nie gubić
  groszy na zaokrągleniu binarnym. Front ich nie parsuje bez potrzeby — formatuje do
  wyświetlenia i tyle.
- **Walidacja w formularzu nie zastępuje serwera.** Chodzi tylko o to, żeby użytkownik
  nie czekał na odpowiedź, by dowiedzieć się o literówce. Backend sprawdza wszystko ponownie.
- **Debounce tylko na polu tekstowym.** Listy rozwijane zgłaszają zmianę od razu —
  nie ma czego opóźniać (`src/components/FilterBar.vue`).
- **Zmiana filtra wraca na pierwszą stronę.** Bez tego lista bywa pusta bez powodu,
  bo offset zostaje z poprzedniego zapytania.
- **`storeToRefs` przy odczycie stanu, akcje wprost ze store'a.** Zwykła destrukturyzacja
  zerwałaby reaktywność — powód jest opisany w komentarzu w `AlertsView.vue`.
- **Widoki ładowane leniwie**, każdy trafia do osobnej paczki.

## Vue dla kogoś, kto pisze w Reakcie

Piszę na co dzień w React i React Native, a w pracy magisterskiej w Angularze.
Przy tym projekcie zebrałem różnice, które w praktyce sprawiają najwięcej kłopotu —
`ref` kontra `reactive`, `computed` bez tablicy zależności, `watch` kontra `watchEffect`,
`v-model` pod spodem, Pinia obok zustanda:

👉 [**VUE-DLA-REACTOWCA.md**](VUE-DLA-REACTOWCA.md)

## CI

`.github/workflows/ci.yml` przy każdym pushu i pull requeście na `main`:
`npm ci`, kontrola typów (`vue-tsc`), testy i build produkcyjny.
