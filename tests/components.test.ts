import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import AlertForm from "../src/components/AlertForm.vue";
import ErrorNote from "../src/components/ErrorNote.vue";
import Sparkline from "../src/components/Sparkline.vue";
import StatusBadge from "../src/components/StatusBadge.vue";

describe("StatusBadge", () => {
  it.each([
    ["armed", "uzbrojony"],
    ["triggered", "uruchomiony"],
    ["disabled", "wyłączony"],
  ] as const)("dla statusu %s pokazuje %s", (status, etykieta) => {
    const komponent = mount(StatusBadge, { props: { status } });

    expect(komponent.text()).toBe(etykieta);
    expect(komponent.classes()).toContain(`plakietka--${status}`);
  });
});

describe("ErrorNote", () => {
  it("nie renderuje się bez komunikatu", () => {
    const komponent = mount(ErrorNote, { props: { komunikat: null } });

    expect(komponent.find("[role=alert]").exists()).toBe(false);
  });

  it("zgłasza zamknięcie w górę", async () => {
    const komponent = mount(ErrorNote, { props: { komunikat: "Coś poszło nie tak" } });

    await komponent.find("button").trigger("click");

    expect(komponent.emitted("zamknij")).toHaveLength(1);
  });
});

describe("AlertForm", () => {
  async function wypelnij(komponent: ReturnType<typeof mount>, ticker: string, prog: string) {
    await komponent.find('input[placeholder="np. CDR"]').setValue(ticker);
    await komponent.find('input[placeholder="np. 180.00"]').setValue(prog);
  }

  it("pusty formularz nie emituje zapisu, tylko pokazuje błędy", async () => {
    const komponent = mount(AlertForm);

    await komponent.find("form").trigger("submit");

    expect(komponent.emitted("zapisz")).toBeUndefined();
    expect(komponent.text()).toContain("Podaj ticker instrumentu.");
    expect(komponent.text()).toContain("Podaj próg.");
  });

  it("odrzuca próg niedodatni", async () => {
    const komponent = mount(AlertForm);
    await wypelnij(komponent, "CDR", "0");

    await komponent.find("form").trigger("submit");

    expect(komponent.emitted("zapisz")).toBeUndefined();
    expect(komponent.text()).toContain("Próg musi być większy od zera.");
  });

  it("odrzuca próg, który nie jest liczbą", async () => {
    const komponent = mount(AlertForm);
    await wypelnij(komponent, "CDR", "sto");

    await komponent.find("form").trigger("submit");

    expect(komponent.text()).toContain("Próg musi być liczbą.");
  });

  it("nie pokazuje błędów, zanim ktokolwiek spróbuje wysłać", async () => {
    const komponent = mount(AlertForm);

    expect(komponent.text()).not.toContain("Podaj ticker");
  });

  it("podgląd tłumaczy regułę na zdanie", async () => {
    const komponent = mount(AlertForm);
    await wypelnij(komponent, "cdr", "180");

    expect(komponent.text()).toContain("Powiadom, gdy CDR wejdzie na 180.00.");
  });

  it("podgląd zmienia się razem z kierunkiem", async () => {
    const komponent = mount(AlertForm);
    await wypelnij(komponent, "cdr", "180");
    await komponent.find("select").setValue("below");

    expect(komponent.text()).toContain("spadnie do 180.00");
  });

  it("emituje dane i czyści formularz", async () => {
    const komponent = mount(AlertForm);
    await wypelnij(komponent, "  cdr  ", "180.5");

    await komponent.find("form").trigger("submit");

    const zdarzenia = komponent.emitted("zapisz");
    expect(zdarzenia).toHaveLength(1);
    expect(zdarzenia?.[0][0]).toMatchObject({
      ticker: "  cdr  ",
      direction: "above",
      threshold: "180.5",
      note: null,
    });

    // Po wysłaniu pola są puste — gotowe na kolejny alert.
    const pole = komponent.find('input[placeholder="np. CDR"]').element as HTMLInputElement;
    expect(pole.value).toBe("");
  });

  it("blokuje przycisk, gdy trwa zapis", () => {
    const komponent = mount(AlertForm, { props: { zajety: true } });

    const przycisk = komponent.find('button[type="submit"]');
    expect(przycisk.attributes("disabled")).toBeDefined();
    expect(przycisk.text()).toContain("Zapisuję");
  });
});

describe("Sparkline", () => {
  function zamontuj(wartosci: number[], prog: number | null = null) {
    return mount(Sparkline, { props: { wartosci, prog, szerokosc: 100, wysokosc: 30 } });
  }

  it("rysuje tyle punktów, ile jest wartości", () => {
    const komponent = zamontuj([1, 2, 3, 4]);

    const punkty = komponent.find("polyline").attributes("points")!.trim().split(/\s+/);
    expect(punkty).toHaveLength(4);
  });

  it("pierwszy punkt jest przy lewej krawędzi, ostatni przy prawej", () => {
    const komponent = zamontuj([1, 2, 3]);

    const punkty = komponent.find("polyline").attributes("points")!.trim().split(/\s+/);
    expect(punkty[0].split(",")[0]).toBe("0.0");
    expect(punkty[2].split(",")[0]).toBe("100.0");
  });

  it("seria rosnąca jest zielona, malejąca czerwona", () => {
    expect(zamontuj([1, 5]).find("polyline").attributes("stroke")).toBe("var(--bull)");
    expect(zamontuj([5, 1]).find("polyline").attributes("stroke")).toBe("var(--bear)");
  });

  it("płaska seria nie wywraca się na dzieleniu przez zero", () => {
    // Rozpiętość zero dałaby NaN we współrzędnych i pusty wykres.
    const komponent = zamontuj([10, 10, 10]);

    const punkty = komponent.find("polyline").attributes("points")!;
    expect(punkty).not.toContain("NaN");
  });

  it("pojedyncza wartość nie rysuje linii", () => {
    expect(zamontuj([42]).find("polyline").exists()).toBe(false);
  });

  it("próg rysuje się przerywaną kreską tylko wtedy, gdy jest podany", () => {
    expect(zamontuj([1, 2, 3]).find("line").exists()).toBe(false);

    const zProgiem = zamontuj([1, 2, 3], 2.5);
    const linia = zProgiem.find("line");
    expect(linia.exists()).toBe(true);
    expect(linia.attributes("stroke-dasharray")).toBe("3 3");
  });

  it("próg poza zakresem serii nadal mieści się na wykresie", () => {
    // Skala musi objąć serię ORAZ próg, inaczej linia wyjeżdża poza ramkę.
    const komponent = zamontuj([100, 101, 102], 150);

    const y = Number(komponent.find("line").attributes("y1"));
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(30);
  });
});
