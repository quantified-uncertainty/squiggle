// This module is also used outside the CLI (e.g. `utility/sExpr.ts`, which ships
// in browser bundles), so it must not touch `process` at import time. Colors are
// on by default; the CLI entry point turns them off for non-interactive output.
let colorEnabled = true;

export function setColorEnabled(enabled: boolean) {
  colorEnabled = enabled;
}

// Colors only for interactive terminals, so piped output (coding agents, files)
// stays plain. Respects NO_COLOR and FORCE_COLOR.
export function shouldUseColorInTerminal(): boolean {
  if (process.env["FORCE_COLOR"] && process.env["FORCE_COLOR"] !== "0") {
    return true;
  }
  if (process.env["NO_COLOR"] !== undefined) {
    return false;
  }
  return Boolean(process.stdout.isTTY && process.stderr.isTTY);
}

const wrap = (code: string) => (str: string) =>
  colorEnabled ? `\x1b[${code}m${str}\x1b[0m` : str;

export const red = wrap("31");
export const green = wrap("32");
export const yellow = wrap("33");
export const blue = wrap("34");
export const bold = wrap("1");
