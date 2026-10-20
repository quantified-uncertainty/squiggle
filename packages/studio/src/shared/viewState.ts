// The view a Studio URL encodes (§6.5): `?file=…&view=…&tab=…&variable=…`.
// Outside embed mode, URL parameters are initial state only: they pick the
// initial file, view, spec and tab for the `?file=` file, and from then on the
// address bar mirrors the current ViewState (#17). In embed mode (`render`)
// the URL stays authoritative.

import { z } from "zod";

export const viewStateSchema = z.object({
  file: z.string().min(1).optional(), // root-relative path
  view: z.string().min(1).optional(), // "output", "relative-values", "split", …
  tab: z.enum(["list", "grid", "plot"]).optional(), // relative values tab
  variable: z.string().min(1).optional(), // a binding (Output) or RV spec name
  layout: z.enum(["cards", "list"]).optional(), // Output layout
  code: z.boolean().optional(), // code pane open
  line: z.number().int().positive().optional(), // cursor line in the code pane
});

export type ViewState = z.infer<typeof viewStateSchema>;

// Order of parameters in generated URLs.
const KEYS = [
  "file",
  "view",
  "tab",
  "variable",
  "layout",
  "code",
  "line",
] as const;

// URL flags that aren't part of the view and are kept when the address bar is
// rewritten.
export const URL_FLAGS = ["embed", "test", "menubar"] as const;
export type UrlFlag = (typeof URL_FLAGS)[number];

// Lenient: invalid or unknown values are dropped, never thrown.
export function viewStateFromSearch(search: string): ViewState {
  const params = new URLSearchParams(search);
  const state: ViewState = {};
  const set = <K extends keyof ViewState>(key: K, value: unknown) => {
    const parsed = viewStateSchema.shape[key].safeParse(value);
    if (parsed.success && parsed.data !== undefined) {
      (state as Record<string, unknown>)[key] = parsed.data;
    }
  };
  for (const key of KEYS) {
    const raw = params.get(key);
    if (raw === null || raw === "") continue;
    if (key === "code")
      set(key, raw === "1" ? true : raw === "0" ? false : undefined);
    else if (key === "line") set(key, Number(raw));
    else set(key, raw);
  }
  return state;
}

// "?file=lib%2Fcosts.squiggle&view=output", or "" for an empty state. Flags
// from `keep` (e.g. the current URL's `test=1`) come after the view.
export function viewStateToSearch(
  state: ViewState,
  keep?: Partial<Record<UrlFlag, string>>
): string {
  const params = new URLSearchParams();
  for (const key of KEYS) {
    const value = state[key];
    if (value === undefined) continue;
    params.set(
      key,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value)
    );
  }
  for (const flag of URL_FLAGS) {
    const value = keep?.[flag];
    if (value !== undefined) params.set(flag, value);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function urlFlagsFromSearch(
  search: string
): Partial<Record<UrlFlag, string>> {
  const params = new URLSearchParams(search);
  const flags: Partial<Record<UrlFlag, string>> = {};
  for (const flag of URL_FLAGS) {
    const value = params.get(flag);
    if (value !== null) flags[flag] = value;
  }
  return flags;
}

// The URL's initial state applies to the `?file=` file only: other files get
// their remembered or default view (#17). Returns undefined for other files.
export function initialStateFor(
  path: string,
  initial: ViewState | undefined
): ViewState | undefined {
  if (!initial || initial.file !== path) return undefined;
  return initial;
}
