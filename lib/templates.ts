import type { Template } from "./types";

/**
 * The classic budgeting rules — offered as *starting points*, not constraints.
 * Names use everyday words (the label is what shows up in the summary).
 */
export const TEMPLATES: Template[] = [
  {
    id: "50-30-20",
    name: "50 / 30 / 20",
    tagline: "The classic starting split",
    slices: [
      { name: "Needs", percent: 50 },
      { name: "Wants", percent: 30 },
      { name: "Savings", percent: 20 },
    ],
  },
  {
    id: "60-20-20",
    name: "60 / 20 / 20",
    tagline: "When the essentials run higher",
    slices: [
      { name: "Needs", percent: 60 },
      { name: "Wants", percent: 20 },
      { name: "Savings", percent: 20 },
    ],
  },
  {
    id: "50-40-10",
    name: "50 / 40 / 10",
    tagline: "More room to enjoy life",
    slices: [
      { name: "Essentials", percent: 50 },
      { name: "Lifestyle", percent: 40 },
      { name: "Savings", percent: 10 },
    ],
  },
  {
    id: "70-20-10",
    name: "70 / 20 / 10",
    tagline: "Pay down debt, keep saving",
    slices: [
      { name: "Living", percent: 70 },
      { name: "Savings", percent: 20 },
      { name: "Debt", percent: 10 },
    ],
  },
  {
    id: "balanced-life",
    name: "Balanced life",
    tagline: "Five buckets for a fuller picture",
    slices: [
      { name: "Needs", percent: 45 },
      { name: "Wants", percent: 20 },
      { name: "Savings", percent: 15 },
      { name: "Investing", percent: 12 },
      { name: "Giving", percent: 8 },
    ],
  },
  {
    id: "blank",
    name: "Start blank",
    tagline: "Build it all yourself",
    slices: [{ name: "First bucket", percent: 10 }],
  },
];
