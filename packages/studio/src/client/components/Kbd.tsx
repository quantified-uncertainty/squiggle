import { clsx } from "clsx";
import { FC } from "react";

import {
  bindingsFor,
  formatKey,
  getCommand,
  keyForPlatform,
  type KeyString,
  toAriaKeyshortcuts,
} from "../../shared/commands/index.js";
import { host } from "../lib/host.js";

// A command's first binding on this platform and host (Electron has ⌘W, a
// browser ⌃W).
function primaryKey(commandId: string): KeyString | undefined {
  const spec = getCommand(commandId);
  if (!spec) return undefined;
  const [binding] = bindingsFor(spec, host.platform, host.kind);
  return binding && keyForPlatform(binding, host.platform);
}

// The key to show for a command ("⇧⌘P").
export function primaryKeyLabel(commandId: string): string | undefined {
  const key = primaryKey(commandId);
  return key ? formatKey(key, host.platform) : undefined;
}

// The same key for `aria-keyshortcuts` ("Shift+Meta+P").
export function primaryAriaKeyshortcuts(commandId: string): string | undefined {
  const key = primaryKey(commandId);
  return key ? toAriaKeyshortcuts(key, host.platform) || undefined : undefined;
}

// A formatted key ("⇧⌘P" / "Ctrl+Shift+P"), from a command's first binding
// or an explicit key string.
export const Kbd: FC<{
  command?: string;
  keys?: KeyString;
  className?: string;
}> = ({ command, keys, className }) => {
  const label =
    keys !== undefined
      ? formatKey(keys, host.platform)
      : command
        ? primaryKeyLabel(command)
        : undefined;
  if (!label) return null;
  return (
    <kbd
      className={clsx(
        "font-sans text-xs tracking-wide text-slate-500",
        className
      )}
    >
      {label}
    </kbd>
  );
};
