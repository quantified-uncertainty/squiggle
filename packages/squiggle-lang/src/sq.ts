// can be used for syntax highlighting in JS/TS files if you have Squiggle VS Code extension installed.
export function sq(strings: TemplateStringsArray, ...rest: unknown[]) {
  if (rest.length) {
    throw new Error("Extrapolation in sq`` template literals is forbidden");
  }
  return strings.join("");
}
