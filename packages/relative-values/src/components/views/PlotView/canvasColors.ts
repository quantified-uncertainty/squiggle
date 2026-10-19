// Canvas drawings can't use CSS variables directly; read them when drawing.
export function cssVariable(
  element: Element,
  name: string,
  fallback: string
): string {
  if (typeof getComputedStyle === "undefined") {
    return fallback;
  }
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}
