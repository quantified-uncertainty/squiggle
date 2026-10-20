import {
  autoUpdate,
  flip,
  FloatingPortal,
  FloatingTree,
  offset,
  shift,
  useFloating,
  useMergeRefs,
} from "@floating-ui/react";
import {
  FC,
  MutableRefObject,
  ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { MenuNode } from "../../../shared/commands/index.js";
import { CommandMenu, runMenuItem } from "./CommandMenu.js";
import {
  type InitialFocus,
  restoreFocus,
  useFocusOrigin,
  useMenuRoot,
} from "./Menu.js";

export type PopupMenuProps = {
  label: string; // accessible name of the trigger button
  trigger: ReactNode; // contents of the trigger button
  items: readonly MenuNode[]; // manifest nodes, rendered through the registry
  title?: string; // the trigger's tooltip
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  triggerClassName?: string;
  testId?: string; // of the trigger
  menuId?: string; // data-menu on the trigger and the popup
  // Set to a function that opens the menu from code (F10 with the menubar
  // hidden opens the ☰ menu).
  openRef?: MutableRefObject<((focus: InitialFocus) => void) | null>;
  // Where focus goes when an item is chosen, before its command runs: back
  // to the trigger (default, like any menu button), or to where it was
  // before the menu was entered (the ☰ menu, which stands in for the
  // menubar).
  restore?: "trigger" | "origin";
};

// A menu anchored to a button (§3.3): the Explorer header's folder menu, the
// status bar, the ☰ menu when the menubar is hidden, and P1 context menus.
// The trigger opens it with a click, ↓ / Enter / Space (first item) or ↑
// (last item); the panel behaves like a menubar menu.
export const PopupMenu: FC<PopupMenuProps> = ({
  label,
  trigger,
  items,
  title,
  placement = "bottom-start",
  triggerClassName,
  testId,
  menuId,
  openRef,
  restore = "trigger",
}) => {
  const rootId = useId();
  const triggerId = useId();
  const [open, setOpenState] = useState<{
    focus: InitialFocus;
    seq: number;
  } | null>(null);
  const seq = useRef(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const origin = useFocusOrigin(rootId);

  const setOpen = useCallback((focus: InitialFocus | null) => {
    if (focus === null) {
      setOpenState(null);
      return;
    }
    seq.current++;
    setOpenState({ focus, seq: seq.current });
  }, []);
  const closeAll = useCallback(() => setOpen(null), [setOpen]);
  useMenuRoot(open !== null, rootId, closeAll);

  const { refs, floatingStyles } = useFloating({
    open: open !== null,
    placement,
    middleware: [offset(2), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const ref = useMergeRefs([triggerRef, refs.setReference]);

  useLayoutEffect(() => {
    if (!openRef) return;
    openRef.current = (focus) => {
      triggerRef.current?.focus({ preventScroll: true });
      setOpen(focus);
    };
    return () => {
      openRef.current = null;
    };
  }, [openRef, setOpen]);

  return (
    <FloatingTree>
      <button
        ref={ref}
        type="button"
        id={triggerId}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open !== null}
        title={title}
        data-testid={testId}
        data-menu={menuId}
        data-menu-root={rootId}
        className={triggerClassName}
        onClick={(e) => {
          if (e.detail === 0) return; // keys are handled on keydown
          setOpen(open ? null : "none");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen("first");
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            setOpen("last");
          }
        }}
      >
        {trigger}
      </button>
      {open && (
        <FloatingPortal>
          <CommandMenu
            key={open.seq}
            nodes={items}
            rootId={rootId}
            menuId={menuId}
            labelledBy={triggerId}
            level={0}
            initialFocus={open.focus}
            floating={{ setFloating: refs.setFloating, style: floatingStyles }}
            onActivate={(item) => {
              setOpen(null);
              if (restore === "origin") restoreFocus(origin.current);
              else triggerRef.current?.focus({ preventScroll: true });
              runMenuItem(item);
            }}
            onClose={() => {
              setOpen(null);
              triggerRef.current?.focus({ preventScroll: true });
            }}
          />
        </FloatingPortal>
      )}
    </FloatingTree>
  );
};
