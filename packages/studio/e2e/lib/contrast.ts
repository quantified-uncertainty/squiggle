import type { Page } from "puppeteer-core";

// WCAG contrast check of the visible text on a page (QA #59: secondary text in
// slate-400 is about 2.5:1). Text must reach `minRatio` (default 4.5:1) against
// its effective background.
//
// Checked: every text node with non-blank text that is painted inside the
// viewport and not covered by something else (elementFromPoint), using the
// element's computed color, its ancestors' opacity and the stack of ancestor
// background colors (composited over white). Skipped: disabled controls
// (`:disabled`, `aria-disabled="true"`, `inert`), text that is invisible on
// purpose (alpha under 0.1, visibility hidden), screen-reader-only text (rects
// of 1 px or less), and text over a background image or gradient (can't be
// computed; reported in `skipped`).

// Text nodes with the same element path, colors and size are reported once,
// with a count (e.g. every line number of a code editor gutter).
export type ContrastViolation = {
  text: string; // first 60 characters of the first such text
  ratio: number; // rounded to 2 decimals
  color: string; // effective text color, rgb()
  background: string; // effective background color, rgb()
  fontSize: string;
  selector: string; // short CSS path, for finding the element
  count: number; // text nodes with this selector, colors and size
};

export type ContrastReport = {
  checked: number; // text nodes checked
  skipped: number; // text nodes over images/gradients or with unknown colors
  violations: ContrastViolation[];
};

// Runs in the page. Keep it self-contained: puppeteer serializes it.
function scanContrast(minRatio: number): ContrastReport {
  type Rgba = { r: number; g: number; b: number; a: number };

  const parse = (value: string): Rgba | undefined => {
    const m = /^rgba?\(([^)]+)\)$/.exec(value.trim());
    if (!m || !m[1]) return undefined;
    const parts = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
      return undefined;
    }
    return {
      r: parts[0] ?? 0,
      g: parts[1] ?? 0,
      b: parts[2] ?? 0,
      a: parts[3] ?? 1,
    };
  };
  const over = (top: Rgba, bottom: Rgba): Rgba => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const luminance = (c: Rgba): number => {
    const channel = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return (
      0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
    );
  };
  const ratioOf = (a: Rgba, b: Rgba): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
  };
  const css = (c: Rgba) =>
    `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;

  // Background behind `el`: ancestor background colors composited over white,
  // or undefined if a background image or gradient is involved.
  const backgroundOf = (el: Element): Rgba | undefined => {
    const layers: Rgba[] = [];
    for (let node: Element | null = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== "none") return undefined;
      const color = parse(style.backgroundColor);
      if (color && color.a > 0) {
        layers.push(color);
        if (color.a >= 1) break;
      }
    }
    let result: Rgba = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) result = over(layer, result);
    return result;
  };
  const opacityOf = (el: Element): number => {
    let opacity = 1;
    for (let node: Element | null = el; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  };
  const selectorOf = (el: Element): string => {
    const parts: string[] = [];
    for (
      let node: Element | null = el;
      node && parts.length < 4 && node !== document.body;
      node = node.parentElement
    ) {
      const testId = node.getAttribute("data-testid");
      const classes = [...node.classList].slice(0, 3).join(".");
      parts.unshift(
        testId
          ? `${node.tagName.toLowerCase()}[data-testid="${testId}"]`
          : `${node.tagName.toLowerCase()}${classes ? `.${classes}` : ""}`
      );
      if (testId || node.id) break;
    }
    return parts.join(" > ");
  };

  type Box = { left: number; top: number; right: number; bottom: number };
  const intersect = (a: Box, b: Box): Box | undefined => {
    const box = {
      left: Math.max(a.left, b.left),
      top: Math.max(a.top, b.top),
      right: Math.min(a.right, b.right),
      bottom: Math.min(a.bottom, b.bottom),
    };
    return box.right > box.left && box.bottom > box.top ? box : undefined;
  };
  // The part of `rect` (a text box of `el`) that is inside the viewport and
  // every clipping ancestor (overflow, clip, clip-path): screen-reader-only
  // text and text scrolled out of a container have none.
  const visiblePart = (el: Element, rect: DOMRect): Box | undefined => {
    let box = intersect(rect, {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    });
    for (
      let node: Element | null = el;
      node && box;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node);
      const clips =
        style.overflowX !== "visible" ||
        style.overflowY !== "visible" ||
        style.clipPath !== "none" ||
        (style.clip !== "auto" && style.clip !== "");
      if (clips) box = intersect(box, node.getBoundingClientRect());
    }
    return box;
  };

  const report: ContrastReport = { checked: 0, skipped: 0, violations: [] };
  const seen = new Map<string, ContrastViolation>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    if (!/\S/.test(text)) continue;
    const el = node.parentElement;
    if (!el) continue;
    if (
      el.closest(
        "script, style, noscript, template, option, textarea, svg, canvas, :disabled, [aria-disabled='true'], [inert]"
      )
    ) {
      continue;
    }
    const style = getComputedStyle(el);
    if (style.visibility !== "visible") continue;

    const range = document.createRange();
    range.selectNodeContents(node);
    let rect: Box | undefined;
    for (const r of range.getClientRects()) {
      const box = visiblePart(el, r);
      if (box && box.right - box.left > 1 && box.bottom - box.top > 1) {
        rect = box;
        break;
      }
    }
    if (!rect) continue;
    const x = (rect.left + rect.right) / 2;
    const y = (rect.top + rect.bottom) / 2;
    const hit = document.elementFromPoint(x, y);
    if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) {
      continue; // covered by something else, or clipped away
    }

    const color = parse(style.color);
    const background = backgroundOf(el);
    if (!color || !background) {
      report.skipped++;
      continue;
    }
    const alpha = color.a * opacityOf(el);
    if (alpha < 0.1) continue; // invisible on purpose
    report.checked++;
    const effective = over({ ...color, a: alpha }, background);
    const ratio = ratioOf(effective, background);
    if (ratio + 1e-6 >= minRatio) continue;
    const violation: ContrastViolation = {
      text: text.trim().replace(/\s+/g, " ").slice(0, 60),
      ratio: Math.round(ratio * 100) / 100,
      color: css(effective),
      background: css(background),
      fontSize: style.fontSize,
      selector: selectorOf(el),
      count: 1,
    };
    const key = `${violation.selector}|${violation.color}|${violation.background}|${violation.fontSize}`;
    const earlier = seen.get(key);
    if (earlier) {
      earlier.count++;
      continue;
    }
    seen.set(key, violation);
    report.violations.push(violation);
  }
  return report;
}

export async function checkContrast(
  page: Page,
  minRatio = 4.5
): Promise<ContrastReport> {
  return page.evaluate(scanContrast, minRatio);
}

export function formatContrastViolation(v: ContrastViolation): string {
  const more = v.count > 1 ? ` and ${v.count - 1} more like it` : "";
  return `${v.ratio}:1 "${v.text}"${more} (${v.color} on ${v.background}, ${v.fontSize}) at ${v.selector}`;
}
