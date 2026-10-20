import { InvalidArgumentError } from "@commander-js/extra-typings";

// Option parsers and output helpers shared by the CLI commands.

export function parsePort(value: string): number {
  const port = Number(value);
  if (!/^\d+$/.test(value) || port > 65535) {
    throw new InvalidArgumentError("Port must be an integer from 0 to 65535.");
  }
  return port;
}

export const MIN_WIDTH = 200;
export const MAX_WIDTH = 8000;

// `render --width`: 200–8000 px (#47; it used to reuse parsePort).
export function parseWidth(value: string): number {
  const width = Number(value);
  if (!/^\d+$/.test(value) || width < MIN_WIDTH || width > MAX_WIDTH) {
    throw new InvalidArgumentError(
      `Width must be a whole number of pixels from ${MIN_WIDTH} to ${MAX_WIDTH}.`
    );
  }
  return width;
}

export function parsePositiveInt(value: string): number {
  const n = Number(value);
  if (!/^\d+$/.test(value) || n <= 0) {
    throw new InvalidArgumentError("Must be a positive integer.");
  }
  return n;
}

// "30s", "2m", "500ms" or a number of seconds; "0" means no limit. In ms.
export function parseDuration(value: string): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m)?$/.exec(value.trim());
  if (!match) {
    throw new InvalidArgumentError(
      'Use a duration such as "30s", "2m" or "500ms".'
    );
  }
  const n = Number(match[1]);
  const unit = match[2] ?? "s";
  return Math.round(unit === "ms" ? n : unit === "s" ? n * 1000 : n * 60_000);
}

// "a,b.c" → ["a", "b.c"].
export function parseNameList(value: string): string[] {
  const names = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!names.length) {
    throw new InvalidArgumentError("Give at least one name, e.g. total,costs.");
  }
  return names;
}

// Writes to stdout and waits until it is flushed, so that a process.exit()
// right after doesn't truncate output piped to another program.
export function writeStdout(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stdout.write(text, (e) => (e ? reject(e) : resolve()));
  });
}

export function writeStderr(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stderr.write(text, (e) => (e ? reject(e) : resolve()));
  });
}

// Exit codes of `run` and `render` (spec §6.3).
export const EXIT = {
  ok: 0,
  modelError: 1,
  usage: 2,
  timeout: 124,
} as const;
