import { expect, test } from "@playwright/test";
import type { ConsoleMessage, Page } from "@playwright/test";

/**
 * Widoki są ładowane leniwie, więc testy jednostkowe nigdy ich nie renderują.
 * Ten plik przechodzi je w prawdziwej przeglądarce — łapie błędy szablonu
 * i importu, których `vue-tsc` nie widzi.
 */

/**
 * Odnośnik do alertu SZUKANY W TABELI i po dokładnej nazwie.
 * `getByRole` dopasowuje nazwę fragmentem, więc samo "ALE" trafia też
 * w "Alerty" w nawigacji i w "price-alerts-api" w stopce.
 */
function wierszAlertu(page: Page, ticker: string) {
  return page.locator("table").getByRole("link", { name: ticker, exact: true });
}

/**
 * Symulacja rynku odpalałaby alerty w trakcie asercji i zmieniała stan pod
 * rękami — wynik testu byłby wtedy losowaniem. Wyłączamy ją przed załadowaniem
 * strony; osobny test sprawdza, że włączona faktycznie działa.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("pa-symulacja", "off");
  });
});

/** Każdy błąd w konsoli traktujemy jak porażkę testu. */
function pilnujKonsoli(page: Page): string[] {
  const bledy: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") bledy.push(m.text());
  });
  page.on("pageerror", (e) => bledy.push(String(e)));
  return bledy;
}

test.describe("Przejście po aplikacji w trybie demo", () => {
  test("lista alertów renderuje dane demonstracyjne", async ({ page }) => {
    const bledy = pilnujKonsoli(page);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Price Alerts" })).toBeVisible();
    await expect(page.getByText("Tryb demo")).toBeVisible();
    await expect(wierszAlertu(page, "CDR")).toBeVisible();
    expect(bledy).toEqual([]);
  });

  test("gość zakłada alert i widzi go na liście", async ({ page }) => {
    const bledy = pilnujKonsoli(page);
    await page.goto("/");

    await page.getByPlaceholder("np. CDR").fill("opl");
    await page.getByPlaceholder("np. 180.00").fill("12.50");

    // Podgląd reguły ma tłumaczyć wpisane wartości na zdanie.
    await expect(page.getByText("Powiadom, gdy OPL wejdzie na 12.50.")).toBeVisible();

    await page.getByRole("button", { name: "Załóż alert" }).click();

    await expect(wierszAlertu(page, "OPL")).toBeVisible();
    expect(bledy).toEqual([]);
  });

  test("notowanie powyżej progu uruchamia alert", async ({ page }) => {
    const bledy = pilnujKonsoli(page);

    await page.goto("/notowanie");
    await page.getByRole("heading", { name: "Wyślij notowanie" }).waitFor();

    await page.getByLabel("Ticker").fill("CDR");
    await page.getByLabel("Cena").fill("999");
    await page.getByRole("button", { name: "Wyślij notowanie" }).click();

    await expect(page.getByRole("heading", { name: "Wynik" })).toBeVisible();
    await expect(page.getByText("uruchomiony")).toBeVisible();
    expect(bledy).toEqual([]);
  });

  test("szczegóły alertu pokazują regułę i historię", async ({ page }) => {
    const bledy = pilnujKonsoli(page);
    await page.goto("/");

    await wierszAlertu(page, "KGH").click();

    await expect(page.getByRole("heading", { name: "KGH" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historia uruchomień" })).toBeVisible();
    expect(bledy).toEqual([]);
  });

  test("filtr po statusie zawęża listę", async ({ page }) => {
    const bledy = pilnujKonsoli(page);
    await page.goto("/");
    await wierszAlertu(page, "CDR").waitFor();

    await page.getByLabel("Status").selectOption("disabled");

    await expect(wierszAlertu(page, "ALE")).toBeVisible();
    await expect(wierszAlertu(page, "CDR")).toHaveCount(0);
    expect(bledy).toEqual([]);
  });

  test("ustawienia odsłaniają pola dopiero po wyborze prawdziwego API", async ({ page }) => {
    const bledy = pilnujKonsoli(page);

    await page.goto("/ustawienia");

    await expect(page.getByLabel("Adres API")).toHaveCount(0);
    await page.getByRole("radio").nth(1).check();
    await expect(page.getByLabel("Adres API")).toBeVisible();
    expect(bledy).toEqual([]);
  });

  test("nieznany adres pokazuje 404", async ({ page }) => {
    await page.goto("/nie-ma-takiej-strony");

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});

test.describe("Zmiana statusu alertu", () => {
  test("wyłączenie i ponowne uzbrojenie widać od razu na liście", async ({ page }) => {
    const bledy = pilnujKonsoli(page);
    await page.goto("/");

    const wiersz = page.locator("table tbody tr").filter({ hasText: "CDR" });
    // Wersaliki na plakietce robi CSS; w DOM tekst jest małymi literami.
    await expect(wiersz).toContainText("uzbrojony");

    await wiersz.getByRole("button", { name: "Wyłącz" }).click();
    await expect(wiersz).toContainText("wyłączony");

    // Przycisk zamienia się na przeciwny — inaczej nie dałoby się cofnąć.
    await wiersz.getByRole("button", { name: "Uzbrój" }).click();
    await expect(wiersz).toContainText("uzbrojony");

    // Zmiana jednej plakietki jest łatwa do przeoczenia — stąd potwierdzenie.
    await expect(page.getByRole("status", { name: "Powiadomienia" })).toContainText("uzbrojony");

    expect(bledy).toEqual([]);
  });

  test("usunięcie wymaga potwierdzenia i pokazuje powiadomienie", async ({ page }) => {
    const bledy = pilnujKonsoli(page);
    await page.goto("/");

    const wiersz = page.locator("table tbody tr").filter({ hasText: "PKN" });
    await expect(wiersz).toBeVisible();

    await wiersz.getByRole("button", { name: "Usuń" }).click();

    // Akcja nieodwracalna nie może wykonać się od razu po kliknięciu.
    const okno = page.getByRole("alertdialog");
    await expect(okno).toBeVisible();
    await expect(wiersz).toHaveCount(1);

    await okno.getByRole("button", { name: "Usuń" }).click();

    await expect(wiersz).toHaveCount(0);
    await expect(page.getByRole("status", { name: "Powiadomienia" })).toContainText("usunięty");
    expect(bledy).toEqual([]);
  });

  test("anulowanie w oknie potwierdzenia zostawia alert", async ({ page }) => {
    const bledy = pilnujKonsoli(page);
    await page.goto("/");

    const wiersz = page.locator("table tbody tr").filter({ hasText: "PKN" });
    await wiersz.getByRole("button", { name: "Usuń" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Anuluj" }).click();

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(wiersz).toHaveCount(1);
    expect(bledy).toEqual([]);
  });

  test("klawisz Escape zamyka okno potwierdzenia", async ({ page }) => {
    await page.goto("/");

    const wiersz = page.locator("table tbody tr").filter({ hasText: "PKN" });
    await wiersz.getByRole("button", { name: "Usuń" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(wiersz).toHaveCount(1);
  });
});

test.describe("Symulacja rynku", () => {
  // Reszta pliku wyłącza symulację; tutaj włączamy ją z powrotem.
  // Skrypty startowe wykonują się w kolejności rejestracji, więc ten wygrywa.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("pa-symulacja"));
  });

  test("rusza sama i zmienia notowania na taśmie", async ({ page }) => {
    await page.goto("/");

    const cena = page.locator(".notowanie").first().locator(".notowanie__cena");
    const przed = await cena.innerText();

    await expect(cena).not.toHaveText(przed, { timeout: 12_000 });
  });

  test("można ją zatrzymać i uruchomić ponownie", async ({ page }) => {
    await page.goto("/");

    const przelacznik = page.getByRole("button", { name: /Symulacja/ });
    await expect(przelacznik).toHaveText(/gra/);
    await expect(przelacznik).toHaveAttribute("aria-pressed", "true");

    await przelacznik.click();
    await expect(przelacznik).toHaveText(/stoi/);
    await expect(przelacznik).toHaveAttribute("aria-pressed", "false");

    await przelacznik.click();
    await expect(przelacznik).toHaveText(/gra/);
  });

  test("alert zakładany na cenę tuż obok rynku odpala się sam", async ({ page }) => {
    await page.goto("/");

    // Bierzemy bieżącą cenę CDR z taśmy i stawiamy próg poniżej niej —
    // najbliższe notowanie musi go przebić.
    const cenaCdr = await page
      .locator(".notowanie")
      .filter({ hasText: "CDR" })
      .first()
      .locator(".notowanie__cena")
      .innerText();
    const prog = (Number(cenaCdr) * 0.9).toFixed(2);

    await page.getByPlaceholder("np. CDR").fill("CDR");
    await page.getByPlaceholder("np. 180.00").fill(prog);
    await page.getByRole("button", { name: "Załóż alert" }).click();

    await expect(page.getByRole("status", { name: "Powiadomienia" })).toContainText(
      "alert zadziałał",
      { timeout: 15_000 },
    );
  });
});
