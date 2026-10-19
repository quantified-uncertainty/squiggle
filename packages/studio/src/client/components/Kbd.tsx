import { clsx } from "clsx";
import { FC } from "react";

import {
  bindingsFor,
  formatKey,
  getCommand,
  keyForPlatform,
  type KeyString,
} from "../../shared/commands/index.js";
import { host } from "../lib/host.js";

// The key to show for a command on this platform and host: its first binding
// (Electron shows ⌘W, a browser ⌃W).
export function primaryKeyLabel(commandId: string): string | undefined {
  const spec = getCommand(commandId);
  if (!spec) return undefined;
  const [binding] = bindingsFor(spec, host.platform, host.kind);
  const key = binding && keyForPlatform(binding, host.platform);
  return key ? formatKey(key, host.platform) : undefined;
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
