// The command palette's rows (§3.10): "Category: Title" for every enabled
// command that belongs in the palette, with the current host's key, "on" /
// "off" for toggles, and parameterized commands as one row per argument
// ("View: Show Output"). The 5 most recently run come first. Pure: QuickPick
// renders the result, OverlayHost runs the chosen row.

import {
  bindingsFor,
  type CommandSpec,
  formatKey,
  type Host,
  keyForPlatform,
  type Platform,
} from "../../../shared/commands/index.js";
import { fuzzyMatch } from "../../lib/fuzzy.js";

export const RECENT_COMMANDS_SHOWN = 5;
export const RECENT_COMMANDS_STORED = 20;

export const RECENT_COMMANDS_GROUP = "Recently used";
export const OTHER_COMMANDS_GROUP = "Other commands";

// What listCommands() returns for each command.
export type CommandEntry = {
  spec: CommandSpec;
  enabled: boolean;
  checked?: boolean;
  keys: string[]; // formatted, first is primary
};

export type ViewEntry = { id: string; label: string; available: boolean };

export type CommandRow = {
  key: string; // identity, stored in the palette MRU: id, or `id {json args}`
  id: string;
  args?: unknown;
  label: string; // "View: Toggle Code Pane"
  positions: number[]; // highlighted indices into `label`
  keyLabel?: string; // "⌘\"
  toggle?: "on" | "off";
  group?: string;
};

export type CommandRowsInput = {
  query: string;
  commands: readonly CommandEntry[];
  views: readonly ViewEntry[]; // the `squiggle.views` context key
  recent: readonly string[]; // row keys, most recent first
  platform: Platform;
  host: Host;
};

export function rowKey(id: string, args?: unknown): string {
  return args === undefined ? id : `${id} ${JSON.stringify(args)}`;
}

// Whether a command can appear in the palette at all (§4.2: default true for
// renderer, codemirror and role owners).
export function isPaletteCommand(spec: CommandSpec): boolean {
  if (spec.palette !== undefined) return spec.palette;
  return (
    spec.owner === "renderer" ||
    spec.owner === "codemirror" ||
    spec.owner === "role"
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Variant = { args: unknown; title: string; bindingArgs?: unknown };

// Commands that take an argument get one row per value; their bare form
// isn't listed.
function variants(spec: CommandSpec, views: readonly ViewEntry[]): Variant[] {
  switch (spec.id) {
    case "squiggle.view.select":
      return views
        .filter((v) => v.available)
        .map((v) => ({
          args: { id: v.id },
          title: `Show ${v.label}`,
          // ⌘K N is bound to the Nth entry of `squiggle.views`.
          bindingArgs: { index: views.indexOf(v) + 1 },
        }));
    case "squiggle.output.setLayout":
      return (["cards", "list"] as const).map((layout) => ({
        args: { layout },
        title: `Show as ${capitalize(layout)}`,
      }));
    case "squiggle.rv.setTab":
      return (["list", "grid", "plot"] as const).map((tab) => ({
        args: { tab },
        title: `Relative Values ${capitalize(tab)}`,
      }));
    default:
      return [{ args: undefined, title: spec.title }];
  }
}

function keyLabelFor(
  entry: CommandEntry,
  bindingArgs: unknown,
  platform: Platform,
  host: Host
): string | undefined {
  if (bindingArgs === undefined) return entry.keys[0];
  const wanted = JSON.stringify(bindingArgs);
  const binding = bindingsFor(entry.spec, platform, host).find(
    (b) => JSON.stringify(b.args) === wanted
  );
  const key = binding && keyForPlatform(binding, platform);
  return key ? formatKey(key, platform) : undefined;
}

type Scored = CommandRow & { score: number };

function score(
  query: string,
  row: CommandRow,
  spec: CommandSpec
): { score: number; positions: number[] } | undefined {
  if (query.trim() === "") return { score: 0, positions: [] };
  const label = fuzzyMatch(query, row.label);
  if (label) return label;
  // id and aliases match without highlights, below any label match.
  const others = [spec.id, ...(spec.aliases ?? [])]
    .map((text) => fuzzyMatch(query, text))
    .filter((m) => m !== undefined);
  if (others.length === 0) return undefined;
  return {
    score: Math.max(...others.map((m) => m.score)) - 100,
    positions: [],
  };
}

export function paletteRows(input: CommandRowsInput): CommandRow[] {
  const { query, commands, views, recent, platform, host } = input;
  const all: CommandRow[] = [];
  for (const entry of commands) {
    const { spec } = entry;
    if (!entry.enabled || !isPaletteCommand(spec)) continue;
    for (const variant of variants(spec, views)) {
      all.push({
        key: rowKey(spec.id, variant.args),
        id: spec.id,
        args: variant.args,
        label: `${spec.category}: ${variant.title}`,
        positions: [],
        keyLabel: keyLabelFor(entry, variant.bindingArgs, platform, host),
        toggle:
          spec.toggled !== undefined && variant.args === undefined
            ? entry.checked
              ? "on"
              : "off"
            : undefined,
      });
    }
  }

  const specs = new Map(commands.map((c) => [c.spec.id, c.spec]));
  const scored: Scored[] = [];
  for (const row of all) {
    const spec = specs.get(row.id);
    if (!spec) continue;
    const match = score(query, row, spec);
    if (match)
      scored.push({ ...row, positions: match.positions, score: match.score });
  }

  const recency = new Map(
    recent.slice(0, RECENT_COMMANDS_SHOWN).map((k, i) => [k, i])
  );
  const recentRows = scored
    .filter((r) => recency.has(r.key))
    .sort((a, b) => (recency.get(a.key) ?? 0) - (recency.get(b.key) ?? 0));
  const others = scored
    .filter((r) => !recency.has(r.key))
    .sort((a, b) =>
      query.trim() === ""
        ? a.label.localeCompare(b.label)
        : b.score - a.score ||
          a.label.length - b.label.length ||
          a.label.localeCompare(b.label)
    );
  const grouped = recentRows.length > 0;
  return [
    ...recentRows.map((r) => ({ ...r, group: RECENT_COMMANDS_GROUP })),
    ...others.map((r) => ({
      ...r,
      group: grouped ? OTHER_COMMANDS_GROUP : undefined,
    })),
  ].map(({ score: _score, ...row }) => row);
}

// The palette MRU after running `key`: most recent first, at most 20.
export function pushRecentCommand(
  recent: readonly string[],
  key: string
): string[] {
  return [key, ...recent.filter((k) => k !== key)].slice(
    0,
    RECENT_COMMANDS_STORED
  );
}
