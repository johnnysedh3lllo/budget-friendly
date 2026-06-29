export type ThemeName =
  | "candy"
  | "pastel"
  | "sunset"
  | "fintech"
  | "forest"
  | "retro"
  | "mono"
  | "brutalist"
  | "midnight"
  | "noir"
  | "terminal"
  | "aurora"
  | "mocha"
  | "mono-inverse";

export const THEMES: { id: ThemeName; label: string; blurb: string }[] = [
  { id: "candy", label: "Candy", blurb: "Bright & bouncy" },
  { id: "pastel", label: "Pastel", blurb: "Soft & calm" },
  { id: "sunset", label: "Sunset", blurb: "Warm & golden" },
  { id: "fintech", label: "Fintech", blurb: "Clean & trusted" },
  { id: "forest", label: "Forest", blurb: "Green & organic" },
  { id: "retro", label: "Retro", blurb: "70s & groovy" },
  { id: "mono", label: "Mono", blurb: "Black & white" },
  { id: "mono-inverse", label: "Mono Inverse", blurb: "White on black" },
  { id: "brutalist", label: "Neo Brutalism", blurb: "Raw & concrete" },
  { id: "midnight", label: "Midnight", blurb: "Dark & cobalt" },
  { id: "noir", label: "Noir", blurb: "Dark & electric" },
  { id: "terminal", label: "Terminal", blurb: "Dark CRT green" },
  { id: "aurora", label: "Aurora", blurb: "Dark & dreamy" },
  { id: "mocha", label: "Mocha", blurb: "Warm dark roast" },
];

/** A single split of the 100% (one named portion, e.g. "Rent 10"). */
export type Split = {
  id: string;
  name: string;
  /** Integer percent, 0–100. */
  percent: number;
  /** 0–7, maps to the active theme's --p1…--p8. */
  colorIndex: number;
};

export type Template = {
  id: string;
  name: string;
  tagline: string;
  splits: { name: string; percent: number }[];
};

/** A bucket the user saved to reuse — a collection of splits, with colours. */
export type SavedBucket = {
  id: string;
  name: string;
  splits: { name: string; percent: number; colorIndex: number }[];
};
