import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import AlertForm from "../src/components/AlertForm.vue";
import ErrorNote from "../src/components/ErrorNote.vue";
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
