import { clsx } from "clsx";
import { FC, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useToast, XIcon } from "@quri/ui";

import {
  bindingsFor,
  type CommandSpec,
  EDITOR_BUILTINS,
  formatKey,
  type Host,
  isAvailableOnHost,
  type KeyBinding,
  keyForPlatform,
  type Platform,
  SHEET_GROUPS,
  type SheetGroup,
  STUDIO_COMMANDS,
} from "../../shared/commands/index.js";
import { TID } from "../../shared/testIds.js";
import { host } from "../lib/host.js";
import { useSettingsFileInfo } from "../lib/studioState.js";
import { OverlayFrame } from "./OverlayFrame.js";

// ── The sheet's data, generated from the manifest ──────────────────────────

export type SheetKey = { label: string; scope?: string };

export type SheetRow = {
  title: string;
  keys: SheetKey[];
  command?: string; // manifest rows
  note?: string; // extra words for the filter ("type >")
  terms: string; // lowercased filter text
};

export type SheetSection = { group: SheetGroup; rows: SheetRow[] };

// Where a binding applies, from its `when` (§5).
function scopeOf(when: string | undefined): string | undefined {
  switch (when) {
    case "filesExplorerFocus":
      return "in Explorer";
    case "!editorTextFocus && !textInputFocus":
      return "outside text fields";
    default:
      return undefined;
  }
}

type StaticRow = {
  group: SheetGroup;
  title: string;
  keys: Array<Pick<KeyBinding, "mac" | "win"> & { scope?: string }>;
  hosts?: Host[];
  platforms?: Platform[];
  note?: string;
};

const both = (key: string, scope?: string) => ({ mac: key, win: key, scope });

// Keys that belong to a surface rather than a command (§5.4–§5.6).
const staticRows = (platform: Platform): StaticRow[] => {
  const ctrl = platform === "mac" ? "⌃" : "Ctrl";
  return [
    {
      group: "Menus",
      title: "Focus Menu Bar",
      keys: [{ win: "alt", scope: "tap Alt alone" }],
      hosts: ["web"],
      platforms: ["win", "linux"],
    },
    {
      group: "Menus",
      title: "Previous / Next Menu",
      keys: [both("left", "in menus"), both("right", "in menus")],
      hosts: ["web"],
    },
    {
      group: "Menus",
      title: "Open Menu",
      keys: [both("down", "in menus"), both("enter"), both("space")],
      hosts: ["web"],
    },
    {
      group: "Menus",
      title: "Close Menu",
      keys: [both("escape", "in menus")],
      hosts: ["web"],
    },
    {
      group: "Output",
      title: "Previous / Next Value",
      keys: [both("up", "on a value"), both("down")],
    },
    {
      group: "Output",
      title: "Parent / First Child",
      keys: [both("left", "on a value"), both("right")],
    },
    {
      group: "Output",
      title: "Zoom In / Out",
      keys: [both("enter", "on a value")],
    },
    {
      group: "Output",
      title: "Collapse / Expand",
      keys: [both("space", "on a value")],
    },
    {
      group: "Output",
      title: "Jump to the Definition in Code",
      keys: [both("e", "on a value")],
    },
    {
      group: "Quick pick and switcher",
      title: "Move",
      keys: [
        both("up"),
        both("down"),
        { mac: "ctrl+n" },
        { mac: "ctrl+p" },
        both("pageup"),
        both("pagedown"),
      ],
    },
    {
      group: "Quick pick and switcher",
      title: "Accept",
      keys: [both("enter")],
    },
    {
      group: "Quick pick and switcher",
      title: "Close and Restore Focus",
      keys: [both("escape")],
    },
    {
      group: "Quick pick and switcher",
      title: "Next Item / Switch to Files",
      keys: [{ mac: "cmd+p", win: "ctrl+p" }],
    },
    {
      group: "Quick pick and switcher",
      title: "Switch to Commands",
      keys: [{ mac: "shift+cmd+p", win: "ctrl+shift+p" }],
      note: "or type >; Backspace on the bare > goes back to files",
    },
    {
      group: "Quick pick and switcher",
      title: "Switcher: Next / Previous",
      keys: [both("`", `while holding ${ctrl}`), both("shift+`")],
    },
    {
      group: "Quick pick and switcher",
      title: "Switcher: Open",
      keys: [],
      note: `release ${ctrl}`,
    },
  ];
};

const VIEW_SELECT = "squiggle.view.select";

function commandKeys(
  spec: CommandSpec,
  platform: Platform,
  hostKind: Host
): SheetKey[] {
  const bindings = bindingsFor(spec, platform, hostKind);
  if (spec.id === VIEW_SELECT) {
    // ⌘K 1 … ⌘K 9 (and ⌘K ⌘1 …): one entry instead of eighteen.
    const first = bindings[0] && keyForPlatform(bindings[0], platform);
    const ninth = bindings.find(
      (b) => (b.args as { index?: number } | undefined)?.index === 9
    );
    const last = ninth && keyForPlatform(ninth, platform);
    if (first && last) {
      return [
        {
          label: `${formatKey(first, platform)} … ${formatKey(last, platform)}`,
        },
      ];
    }
  }
  return bindings.flatMap((b) => {
    const key = keyForPlatform(b, platform);
    return key
      ? [{ label: formatKey(key, platform), scope: scopeOf(b.when) }]
      : [];
  });
}

const termsOf = (
  title: string,
  group: string,
  keys: SheetKey[],
  extra: string[]
) =>
  [title, group, ...keys.map((k) => `${k.label} ${k.scope ?? ""}`), ...extra]
    .join(" ")
    .toLowerCase();

export function buildShortcutSheet(
  platform: Platform,
  hostKind: Host
): SheetSection[] {
  const sections = new Map<SheetGroup, SheetRow[]>(
    SHEET_GROUPS.map((g) => [g, []])
  );
  for (const spec of STUDIO_COMMANDS) {
    if (!spec.sheetGroup || !isAvailableOnHost(spec, hostKind)) continue;
    const keys = commandKeys(spec, platform, hostKind);
    if (keys.length === 0) continue;
    sections.get(spec.sheetGroup)?.push({
      title: spec.title,
      keys,
      command: spec.id,
      terms: termsOf(spec.title, spec.sheetGroup, keys, [
        spec.id,
        spec.category,
        ...(spec.aliases ?? []),
      ]),
    });
  }
  for (const builtin of EDITOR_BUILTINS) {
    const keys = builtin.keys.flatMap((b) => {
      const key = keyForPlatform(b, platform);
      return key ? [{ label: formatKey(key, platform) }] : [];
    });
    if (keys.length === 0) continue;
    sections.get("Editor (built-in)")?.push({
      title: builtin.title,
      keys,
      terms: termsOf(builtin.title, "Editor (built-in)", keys, []),
    });
  }
  for (const row of staticRows(platform)) {
    if (row.hosts && !row.hosts.includes(hostKind)) continue;
    if (row.platforms && !row.platforms.includes(platform)) continue;
    const keys = row.keys.flatMap((b) => {
      const key = keyForPlatform(b, platform);
      if (!key) return [];
      // A tap of Alt alone isn't a parseable stroke.
      const label = key === "alt" ? "Alt" : formatKey(key, platform);
      return [{ label, scope: b.scope }];
    });
    if (keys.length === 0 && !row.note) continue;
    sections.get(row.group)?.push({
      title: row.title,
      keys,
      note: row.note,
      terms: termsOf(row.title, row.group, keys, [row.note ?? ""]),
    });
  }
  return SHEET_GROUPS.map((group) => ({
    group,
    rows: sections.get(group) ?? [],
  })).filter((s) => s.rows.length > 0);
}

// "In the desktop app also: …": the keys a command has only in Electron,
// because a browser keeps them for itself (⌘W, ⌘N, ⌃Tab).
export function desktopOnlyKeys(platform: Platform): string[] {
  const out: string[] = [];
  for (const spec of STUDIO_COMMANDS) {
    if (!isAvailableOnHost(spec, "web")) continue;
    for (const binding of spec.keys ?? []) {
      const electronOnly =
        binding.hosts?.length === 1 && binding.hosts[0] === "electron";
      const key = keyForPlatform(binding, platform);
      if (!electronOnly || binding.display || !key) continue;
      const title = (spec.menuTitle ?? spec.title).replace(/…$/, "");
      out.push(`${formatKey(key, platform)} ${title.toLowerCase()}`);
    }
  }
  return out;
}

// Until the server has said where it is (and without a server).
export const SETTINGS_PATH = "~/.squiggle-studio/settings.json";

// §5.8, for the sheet's footer and the README.
export function vsCodeDeviations(platform: Platform): string[] {
  const key = (mac: string, win: string) =>
    formatKey(platform === "mac" ? mac : win, platform);
  return [
    "Enter in the Explorer opens the file; F2 renames it.",
    `There are no editor tabs: ${key("ctrl+`", "ctrl+`")} switches between recent files (VS Code uses it for the terminal).`,
    `${key("cmd+k p", "ctrl+k p")} copies the relative path (VS Code copies the absolute path; here that is ${key("cmd+k shift+p", "ctrl+k shift+p")}).`,
    `In a browser tab, Close File is ${key("ctrl+w", "alt+w")}.`,
  ];
}

const platformName = (p: Platform) =>
  p === "mac" ? "macOS" : p === "win" ? "Windows" : "Linux";

export function sheetToMarkdown(
  sections: readonly SheetSection[],
  platform: Platform,
  hostKind: Host,
  settingsPath: string = SETTINGS_PATH
): string {
  const cell = (s: string) => s.replace(/\|/g, "\\|");
  const lines = [
    `# Squiggle Studio keyboard shortcuts (${platformName(platform)}, ${hostKind === "web" ? "browser" : "desktop app"})`,
    "",
  ];
  for (const section of sections) {
    lines.push(
      `## ${section.group}`,
      "",
      "| Command | Keys | Where |",
      "|---|---|---|"
    );
    for (const row of section.rows) {
      const keys = [
        ...row.keys.map((k) => `\`${k.label}\``),
        ...(row.note ? [row.note] : []),
      ].join(", ");
      const where = [
        ...new Set(row.keys.flatMap((k) => (k.scope ? [k.scope] : []))),
      ].join(", ");
      lines.push(`| ${cell(row.title)} | ${cell(keys)} | ${cell(where)} |`);
    }
    lines.push("");
  }
  lines.push(`Settings: \`${settingsPath}\``, "");
  return lines.join("\n");
}

function matchesFilter(row: SheetRow, filter: string): boolean {
  const tokens = filter.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((t) => row.terms.includes(t));
}

// ── The modal ──────────────────────────────────────────────────────────────

const KeyChip: FC<{ label: string }> = ({ label }) => (
  <kbd className="whitespace-nowrap rounded border border-slate-300 bg-slate-50 px-1 font-sans text-[11px] leading-4 text-slate-700">
    {label}
  </kbd>
);

// The shortcut sheet (§3.10): ⌘K ⌘S, `?` outside text fields, or Help ▸
// Keyboard Shortcuts. Generated from the manifest for this platform and host.
export const ShortcutSheet: FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const toast = useToast();
  const settingsPath = useSettingsFileInfo().path ?? SETTINGS_PATH;
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const sections = useMemo(
    () => buildShortcutSheet(host.platform, host.kind),
    []
  );
  const desktopOnly = useMemo(
    () => (host.kind === "web" ? desktopOnlyKeys(host.platform) : []),
    []
  );
  const shown = sections
    .map((s) => ({
      ...s,
      rows: s.rows.filter((r) => matchesFilter(r, filter)),
    }))
    .filter((s) => s.rows.length > 0);

  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        sheetToMarkdown(sections, host.platform, host.kind, settingsPath)
      );
      toast("Copied the shortcuts as Markdown", "confirmation");
    } catch (e) {
      toast(
        `Couldn't copy: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    }
  };

  return (
    <OverlayFrame
      testId={TID.shortcutSheet}
      label="Keyboard shortcuts"
      placement="center"
      dim
      className="h-[min(48rem,100%)] w-[min(60rem,100%)]"
      onDismiss={onDismiss}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-800">
          Keyboard Shortcuts
        </h2>
        <span className="text-xs text-slate-600">
          {platformName(host.platform)} ·{" "}
          {host.kind === "web" ? "browser" : "desktop app"}
        </span>
        <input
          ref={inputRef}
          type="text"
          aria-label="Filter shortcuts"
          placeholder="Type to filter"
          value={filter}
          className="ml-auto h-7 w-56 rounded border border-slate-300 bg-white px-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          type="button"
          className="h-7 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={() => void copy()}
        >
          Copy as Markdown
        </button>
        <button
          type="button"
          aria-label="Close"
          title="Close (Esc)"
          className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={onDismiss}
        >
          <XIcon size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {shown.length === 0 ? (
          <p className="text-sm text-slate-600">No shortcuts match.</p>
        ) : (
          <div className="gap-6 md:columns-2">
            {shown.map((section) => (
              <section
                key={section.group}
                data-group={section.group}
                className="mb-4 break-inside-avoid"
              >
                <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  {section.group}
                </h3>
                <ul>
                  {section.rows.map((row, i) => (
                    <li
                      key={`${row.command ?? row.title}:${i}`}
                      data-command={row.command}
                      className="flex items-baseline gap-3 border-b border-slate-100 py-1 text-[13px] text-slate-700"
                    >
                      <span className="min-w-0 flex-1">{row.title}</span>
                      <span className="flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-right">
                        {row.keys.map((k, j) => (
                          <span key={j} className="whitespace-nowrap">
                            <KeyChip label={k.label} />
                            {k.scope && (
                              <span className="ml-1 text-[11px] text-slate-600">
                                {k.scope}
                              </span>
                            )}
                          </span>
                        ))}
                        {row.note && (
                          <span className="text-[11px] text-slate-600">
                            {row.note}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
      <div
        className={clsx(
          "shrink-0 space-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600"
        )}
      >
        {desktopOnly.length > 0 && (
          <p>In the desktop app also: {desktopOnly.join(", ")}.</p>
        )}
        <p>
          Settings: <code className="text-slate-700">{settingsPath}</code>.
          Differences from VS Code: {vsCodeDeviations(host.platform).join(" ")}
        </p>
      </div>
    </OverlayFrame>
  );
};
