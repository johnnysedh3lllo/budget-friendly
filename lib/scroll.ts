/**
 * Scroll a scrollable container so its active child is visible — adjusting only
 * the container's own scroll, never the window. Used to open dropdown menus
 * with the current selection already in view.
 */
export function scrollActiveIntoView(
  container: HTMLElement | null,
  active: HTMLElement | null,
) {
  if (!container || !active) return;
  const c = container.getBoundingClientRect();
  const a = active.getBoundingClientRect();
  if (a.top < c.top) container.scrollTop += a.top - c.top - 6;
  else if (a.bottom > c.bottom) container.scrollTop += a.bottom - c.bottom + 6;
}
