/** Instrumenty do symulacji — spółki z GPW, ceny orientacyjne. */
export interface Instrument {
  ticker: string;
  nazwa: string;
  bazowa: number;
  /** Zmienność na tik, ułamek ceny. Spółki growth ruszają się mocniej niż użyteczności. */
  zmiennosc: number;
}

export const INSTRUMENTY: Instrument[] = [
  { ticker: "CDR", nazwa: "CD Projekt", bazowa: 178.4, zmiennosc: 0.006 },
  { ticker: "PKN", nazwa: "Orlen", bazowa: 62.1, zmiennosc: 0.004 },
  { ticker: "KGH", nazwa: "KGHM", bazowa: 148.7, zmiennosc: 0.007 },
  { ticker: "ALE", nazwa: "Allegro", bazowa: 26.9, zmiennosc: 0.008 },
  { ticker: "DNP", nazwa: "Dino Polska", bazowa: 396.5, zmiennosc: 0.005 },
  { ticker: "PKO", nazwa: "PKO BP", bazowa: 58.3, zmiennosc: 0.004 },
  { ticker: "PZU", nazwa: "PZU", bazowa: 51.2, zmiennosc: 0.003 },
  { ticker: "LPP", nazwa: "LPP", bazowa: 15840, zmiennosc: 0.006 },
  { ticker: "OPL", nazwa: "Orange Polska", bazowa: 8.42, zmiennosc: 0.003 },
  { ticker: "CPS", nazwa: "Cyfrowy Polsat", bazowa: 12.15, zmiennosc: 0.005 },
];

/** Ile ostatnich cen trzymamy na potrzeby wykresu iskrowego. */
export const DLUGOSC_HISTORII = 40;
