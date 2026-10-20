const warned = new Set<string>();

function isDevelopment(): boolean {
  try {
    // Written so that bundlers replace `process.env.NODE_ENV` in the output.
    return (process.env as { NODE_ENV?: string }).NODE_ENV !== "production";
  } catch {
    // No `process` (a browser build without a NODE_ENV replacement).
    return true;
  }
}

/** `console.warn` once per message, in development builds. */
export function warnOnce(message: string) {
  if (warned.has(message) || !isDevelopment()) {
    return;
  }
  warned.add(message);
  console.warn(`[squiggle-relative-values] ${message}`);
}
