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
 * - selectors that already start with `.squiggle-rv` or `:where(.squiggle-rv)`
 *   are kept;
 * - keyframes are renamed to `squiggle-rv-<name>`, so that they don't clash
 *   with the host page's keyframes.
 *
 * Used at build time only.
 */
const plugin = ({ scope }) => {
  const prefix = `.${scope}`;

  const isScoped = (selector) =>
    selector.startsWith(`:where(${prefix})`) ||
    (selector.startsWith(prefix) &&
      /^($|[\s.:#>+~[])/.test(selector.slice(prefix.length)));

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
