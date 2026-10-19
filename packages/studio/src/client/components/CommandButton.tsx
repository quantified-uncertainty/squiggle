import { clsx } from "clsx";
import { FC, ReactNode } from "react";

import { TextTooltip } from "@quri/ui";

import { getCommand } from "../../shared/commands/index.js";
import { runCommand, useCommandState } from "../commands/registry.js";
import { primaryAriaKeyshortcuts, primaryKeyLabel } from "./Kbd.js";

type Props = {
  command: string;
  args?: unknown;
  icon?: ReactNode;
  children?: ReactNode; // a text label next to (or instead of) the icon
  // Overrides the tooltip and accessible name ("Hide code" while the pane is
  // open); defaults to the command's menu title.
  label?: string;
  pressed?: boolean; // toggle buttons: aria-pressed
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
  testId?: string;
};

// Every icon button in the header, Explorer, editor header, status bar and
// start page (§4.8): accessible name from the command, `data-command`,
// `aria-keyshortcuts`, a tooltip with the current host's key ("Hide code
// (⌘\)"), disabled while the command is.
export const CommandButton: FC<Props> = ({
  command,
  args,
  icon,
  children,
  label,
  pressed,
  placement = "bottom",
  className,
  testId,
}) => {
  const state = useCommandState(command, args);
  const spec = getCommand(command);
  const name = label ?? spec?.menuTitle ?? spec?.title ?? command;
  const key = primaryKeyLabel(command);
  const tooltip = key ? `${name} (${key})` : name;

  return (
    <TextTooltip text={tooltip} placement={placement}>
      <button
        type="button"
        data-command={command}
        data-testid={testId}
        aria-label={children ? undefined : name}
        aria-pressed={pressed}
        aria-keyshortcuts={primaryAriaKeyshortcuts(command)}
        disabled={!state.enabled}
        className={clsx(
          "inline-flex items-center gap-1 rounded p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent",
          pressed && "bg-slate-200 text-slate-900",
          className
        )}
        onClick={() => runCommand(command, args, "button")}
      >
        {icon}
        {children}
      </button>
    </TextTooltip>
  );
};
