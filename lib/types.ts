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
  | "mocha";

export const THEMES: { id: ThemeName; label: string; blurb: string }[] = [
  { id: "candy", label: "Candy", blurb: "Bright & bouncy" },
  { id: "pastel", label: "Pastel", blurb: "Soft & calm" },
  { id: "sunset", label: "Sunset", blurb: "Warm & golden" },
  { id: "fintech", label: "Fintech", blurb: "Clean & trusted" },
  { id: "forest", label: "Forest", blurb: "Green & organic" },
  { id: "retro", label: "Retro", blurb: "70s & groovy" },
  { id: "mono", label: "Mono", blurb: "Black & white" },
  { id: "brutalist", label: "Brutalist", blurb: "Raw & concrete" },
  { id: "midnight", label: "Midnight", blurb: "Dark & cobalt" },
  { id: "noir", label: "Noir", blurb: "Dark & electric" },
  { id: "terminal", label: "Terminal", blurb: "Dark CRT green" },
  { id: "aurora", label: "Aurora", blurb: "Dark & dreamy" },
  { id: "mocha", label: "Mocha", blurb: "Warm dark roast" },
];

/** A single slice of the 100%. */
export type Partition = {
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
  slices: { name: string; percent: number }[];
};
