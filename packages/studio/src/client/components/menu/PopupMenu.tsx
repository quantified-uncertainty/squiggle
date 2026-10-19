import { clsx } from "clsx";
import { FC, ReactNode, useEffect, useRef, useState } from "react";

import {
  getCommand,
  isAvailableOnHost,
  type MenuNode,
} from "../../../shared/commands/index.js";
import { TID } from "../../../shared/testIds.js";
import { captureFocus } from "../../commands/focus.js";
import { runCommand, useCommandState } from "../../commands/registry.js";
import { host } from "../../lib/host.js";
import { Kbd } from "../Kbd.js";

export type PopupMenuProps = {
  label: string; // accessible name of the trigger button
  trigger: ReactNode; // contents of the trigger button
  items: readonly MenuNode[]; // manifest nodes, rendered through the registry
  title?: string; // the trigger's tooltip
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  triggerClassName?: string;
  testId?: string; // of the trigger
  menuId?: string; // data-menu on the trigger and the popup
};

// WP0 stub (owned by WP1): a plain list anchored to its trigger button, with
// command items only. WP1 rebuilds it on floating-ui with keyboard
// navigation, submenus and dynamic nodes; the props stay.
export const PopupMenu: FC<PopupMenuProps> = ({
  label,
  trigger,
  items,
  title,
  placement = "bottom-start",
  triggerClassName,
  testId,
  menuId,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        restoreRef.current?.();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const activate = (command: string, args: unknown) => {
    setOpen(false);
    restoreRef.current?.();
    runCommand(command, args, "menu");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
        data-testid={testId}
        data-menu={menuId}
        className={triggerClassName}
        onClick={() => {
          if (!open) restoreRef.current = captureFocus();
          setOpen(!open);
        }}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          data-testid={TID.menu}
          data-menu={menuId}
          className={clsx(
            "absolute z-50 max-h-[calc(100vh-3rem)] min-w-[16rem] max-w-[24rem] overflow-y-auto rounded-md border border-slate-300 bg-white py-1 shadow-xl",
            placement.startsWith("bottom")
              ? "top-full mt-0.5"
              : "bottom-full mb-0.5",
            placement.endsWith("start") ? "left-0" : "right-0"
          )}
        >
          <MenuNodes nodes={items} onActivate={activate} />
        </div>
      )}
    </div>
  );
};

const MenuNodes: FC<{
  nodes: readonly MenuNode[];
  onActivate: (command: string, args: unknown) => void;
}> = ({ nodes, onActivate }) => (
  <>
    {nodes.map((node, i) => {
      if ("separator" in node) {
        return (
          <div key={i} role="separator" className="my-1 h-px bg-slate-200" />
        );
      }
      if ("header" in node) {
        return (
          <div
            key={i}
            className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            {node.header}
          </div>
        );
      }
      if ("submenu" in node) {
        return (
          <div key={i} role="group" aria-label={node.title}>
            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {node.title}
            </div>
            <MenuNodes nodes={node.items} onActivate={onActivate} />
          </div>
        );
      }
      if ("dynamic" in node) return null; // WP1
      return (
        <CommandItem
          key={i}
          command={node.command}
          args={node.args}
          title={node.title}
          onActivate={onActivate}
        />
      );
    })}
  </>
);

const CommandItem: FC<{
  command: string;
  args?: unknown;
  title?: string;
  onActivate: (command: string, args: unknown) => void;
}> = ({ command, args, title, onActivate }) => {
  const state = useCommandState(command, args);
  const spec = getCommand(command);
  const checkable = Boolean(spec?.toggled || spec?.radio);
  if (!spec || !isAvailableOnHost(spec, host.kind)) return null;
  return (
    <button
      type="button"
      role={
        spec?.radio
          ? "menuitemradio"
          : spec?.toggled
            ? "menuitemcheckbox"
            : "menuitem"
      }
      aria-checked={checkable ? Boolean(state.checked) : undefined}
      aria-disabled={!state.enabled || undefined}
      data-testid={TID.menuitem}
      data-command={command}
      className="mx-1 flex h-7 w-[calc(100%-0.5rem)] items-center gap-2 rounded px-2 text-left text-[13px] text-slate-700 hover:bg-blue-100 aria-disabled:text-slate-400 aria-disabled:hover:bg-transparent"
      onClick={() => {
        if (state.enabled) onActivate(command, args);
      }}
    >
      <span className="w-3 shrink-0 text-center text-slate-600">
        {checkable && state.checked ? (spec?.radio ? "•" : "✓") : ""}
      </span>
      <span className="min-w-0 flex-1 truncate">
        {title ?? spec?.menuTitle ?? spec?.title ?? command}
      </span>
      <Kbd command={command} className="ml-8" />
    </button>
  );
};
