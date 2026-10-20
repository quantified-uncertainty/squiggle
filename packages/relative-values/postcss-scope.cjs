/*
 * PostCSS plugin that scopes a stylesheet to `.squiggle-rv` (see
 * `src/styles/styles.css`):
 *
 * - selectors with a class (utilities, library styles) are prefixed:
 *   `.foo` becomes `.squiggle-rv .foo`;
 * - selectors without classes (Tailwind's preflight: `button`, `h1`, `*`, ...)
 *   are wrapped in `:where()`, so that they have the specificity of a single
 *   class: `button` becomes `.squiggle-rv :where(button)`. That's enough to
 *   override the page's element rules, while class rules of the page (e.g.
 *   in custom tabs) loaded after this stylesheet still win;
 * - `html`, `:root` and `:host` become `.squiggle-rv` (so Tailwind's preflight
 *   styles the wrapper instead of the page), and `body` rules are dropped;
 * - selectors that already start with `.squiggle-rv` or `:where(.squiggle-rv`
 *   are kept;
 * - keyframes are renamed to `squiggle-rv-<name>`, so that they don't clash
 *   with the host page's keyframes;
 * - rem values of `font-size` and `line-height` become multiples of
 *   `--squiggle-rv-font-size` (default 1rem, so nothing changes without
 *   it): `0.875rem` becomes `calc(0.875 * var(--squiggle-rv-font-size, 1rem))`.
 *   rem is relative to the page's root, not to the dashboard, and em would
 *   compound in nested text.
 *
 * Used at build time only.
 */
const plugin = ({ scope }) => {
  const prefix = `.${scope}`;

  // `.squiggle-rv...` or `:where(.squiggle-rv...)` (e.g. a modifier class:
  // `:where(.squiggle-rv.squiggle-rv-compact)`).
  const isScoped = (selector) =>
    [prefix, `:where(${prefix}`].some(
      (start) =>
        selector.startsWith(start) &&
        /^($|[\s.:#>+~[)])/.test(selector.slice(start.length))
    );

  const scopeSelector = (selector) => {
    if (isScoped(selector)) {
      return [selector];
    }
    if (/^(html|:root|:host)$/.test(selector)) {
      return [prefix];
    }
    if (selector === "body") {
      return [];
    }
    const rootPrefix = selector.match(
      /^(?:html|:root|:host|body)\s*(>)?\s+(.*)$/
    );
    if (rootPrefix) {
      return [scopeRest(rootPrefix[2])];
    }
    return [scopeRest(selector)];
  };

  // `input::placeholder` -> `.squiggle-rv :where(input)::placeholder`
  const scopeRest = (selector) => {
    if (selector.includes(".")) {
      return `${prefix} ${selector}`;
    }
    const pseudoElement = selector.indexOf("::");
    const subject =
      pseudoElement === -1 ? selector : selector.slice(0, pseudoElement);
    const rest = pseudoElement === -1 ? "" : selector.slice(pseudoElement);
    return subject.trim()
      ? `${prefix} :where(${subject.trim()})${rest}`
      : `${prefix} ${rest}`;
  };

  return {
    postcssPlugin: "squiggle-rv-scope",
    OnceExit(root) {
      const keyframes = new Map();
      root.walkAtRules(/keyframes$/i, (atRule) => {
        const name = atRule.params.trim();
        if (!name.startsWith(`${scope}-`)) {
          keyframes.set(name, `${scope}-${name}`);
          atRule.params = `${scope}-${name}`;
        }
      });

      root.walkRules((rule) => {
        if (
          rule.parent?.type === "atrule" &&
          /keyframes$/i.test(rule.parent.name)
        ) {
          return;
        }
        const selectors = rule.selectors.flatMap((s) =>
          scopeSelector(s.trim())
        );
        if (selectors.length === 0) {
          rule.remove();
        } else {
          rule.selectors = selectors;
        }
      });

      root.walkDecls(/^(font-size|line-height)$/i, (decl) => {
        if (!decl.value.includes("var(")) {
          decl.value = decl.value.replace(
            /(^|[\s(,])(-?(?:\d+\.?\d*|\.\d+))rem\b/g,
            (_match, before, number) =>
              `${before}calc(${number} * var(--${scope}-font-size, 1rem))`
          );
        }
      });

      if (keyframes.size) {
        root.walkDecls(/^(-webkit-)?animation(-name)?$/i, (decl) => {
          decl.value = decl.value
            .split(",")
            .map((part) =>
              part
                .trim()
                .split(/\s+/)
                .map((token) => keyframes.get(token) ?? token)
                .join(" ")
            )
            .join(", ");
        });
      }
    },
  };
};
plugin.postcss = true;

module.exports = plugin;
