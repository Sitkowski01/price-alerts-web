/**
 * Ikony wektorowe w jednym miejscu (rysunek w stylu Lucide: kreska 1.75,
 * zaokrąglone końce). Świadomie bez emoji — renderują się inaczej na każdym
 * systemie, nie da się ich stylować ani dopasować do tokenów kolorów.
 */
export type NazwaIkony =
  | "bell"
  | "trend-up"
  | "trend-down"
  | "check"
  | "pause"
  | "trash"
  | "search"
  | "settings"
  | "pulse"
  | "arrow-left"
  | "arrow-right"
  | "close"
  | "warning"
  | "inbox";

export const SCIEZKI_IKON: Record<NazwaIkony, string> = {
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a2 2 0 0 0 3.4 0",
  "trend-up": "M3 17l6-6 4 4 8-8M21 7v5M21 7h-5",
  "trend-down": "M3 7l6 6 4-4 8 8M21 17v-5M21 17h-5",
  check: "M20 6L9 17l-5-5",
  pause: "M10 15V9M14 15V9M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.6 3H9.4l-.4 2.6c-.7.3-1.4.7-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h5.2l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  pulse: "M22 12h-4l-3 9L9 3l-3 9H2",
  "arrow-left": "M19 12H5M12 19l-7-7 7-7",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
  close: "M18 6L6 18M6 6l12 12",
  warning:
    "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  inbox:
    "M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z",
};
