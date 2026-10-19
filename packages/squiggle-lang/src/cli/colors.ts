// Colors are only emitted for interactive terminals, so piped output (e.g. read by
// coding agents or redirected to files) stays plain. Respects NO_COLOR and FORCE_COLOR.
function shouldUseColor(): boolean {
  if (process.env["FORCE_COLOR"] && process.env["FORCE_COLOR"] !== "0") {
    return true;
  }
  if (process.env["NO_COLOR"] !== undefined) {
    return false;
  }
  return Boolean(process.stdout.isTTY && process.stderr.isTTY);
}

const useColor = shouldUseColor();

const wrap = (code: string) => (str: string) =>
  useColor ? `\x1b[${code}m${str}\x1b[0m` : str;

export const red = wrap("31");
export const green = wrap("32");
export const yellow = wrap("33");
export const blue = wrap("34");
export const bold = wrap("1");
