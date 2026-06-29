/** Map a split's colorIndex to the active theme's palette token. */
export function splitColor(colorIndex: number): string {
  const i = (((colorIndex % 8) + 8) % 8) + 1;
  return `var(--p${i})`;
}

export const PALETTE_SIZE = 8;
