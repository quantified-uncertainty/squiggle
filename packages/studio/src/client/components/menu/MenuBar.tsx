import {
  autoUpdate,
  flip,
  FloatingPortal,
  FloatingTree,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import {
  FC,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { MenuSpec } from "../../../shared/commands/index.js";
import { TID } from "../../../shared/testIds.js";
import { CommandMenu, runMenuItem } from "./CommandMenu.js";
import {
  type InitialFocus,
  restoreFocus,
  useFocusOrigin,
  useMenuRoot,
} from "./Menu.js";

// The browser's in-app menubar (§3.3): File, Edit, View, Go, Run and Help
// from STUDIO_MENUS.
//
// Keys on the bar: ← / → move between menus (wrapping), Home / End, ↓,
// Enter or Space open a menu at its first item, ↑ at its last, a letter
// jumps to the matching menu, Esc returns focus to where it was before the
// menubar was entered, Tab leaves (one tab stop: roving tabindex). Pointer:
// a click toggles a menu; while one is open, hovering another trigger
// switches to it. Entered with F10, an Alt tap (Windows/Linux) or "View:
// Focus Menu Bar" (squiggle.focusMenuBar, ShellCommands.tsx).

const ROOT_ID = "menubar";

// ── Focus Menu Bar ──────────────────────────────────────────────────────────

// What squiggle.focusMenuBar does: focus the menubar's first trigger, or,
// with the menubar hidden, open the ☰ menu. The last registered wins.
const focusers: Array<() => boolean> = [];

export function registerMenuBarFocuser(fn: () => boolean): () => void {
  focusers.push(fn);
  return () => {
    const i = focusers.lastIndexOf(fn);
    if (i !== -1) focusers.splice(i, 1);
  };
}

// False when there is no in-app menubar (Electron's native menu).
export function focusMenuBar(): boolean {
  const fn = focusers[focusers.length - 1];
  return fn ? fn() : false;
}

// ── The menubar ─────────────────────────────────────────────────────────────

const TRIGGER_CLASS =
  "h-6 rounded px-2 text-[13px] text-slate-700 outline-none hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-orange-300 aria-expanded:bg-slate-200 aria-expanded:text-slate-900";

type OpenState = { index: number; focus: InitialFocus; seq: number };

export const MenuBar: FC<{ menus: readonly MenuSpec[] }> = ({ menus }) => {
  const [roving, setRoving] = useState(0);
  const [open, setOpenState] = useState<OpenState | null>(null);
  const seq = useRef(0);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const origin = useFocusOrigin(ROOT_ID);
  const n = menus.length;

  const setOpen = useCallback(
    (index: number | null, focus: InitialFocus = "none") => {
      if (index === null) {
        setOpenState(null);
        return;
      }
      seq.current++;
      setRoving(index);
      setOpenState({ index, focus, seq: seq.current });
    },
    []
  );
  const closeAll = useCallback(() => setOpen(null), [setOpen]);
  useMenuRoot(open !== null, ROOT_ID, closeAll);

  const { refs, floatingStyles } = useFloating({
    open: open !== null,
    placement: "bottom-start",
    middleware: [offset(2), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const openIndex = open?.index;
  useLayoutEffect(() => {
    refs.setReference(
      openIndex === undefined ? null : (triggers.current[openIndex] ?? null)
    );
  }, [openIndex, refs]);

  const focusTrigger = useCallback((index: number) => {
    setRoving(index);
    triggers.current[index]?.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(
    () =>
      registerMenuBarFocuser(() => {
        const first = triggers.current[0];
        if (!first?.isConnected) return false;
        focusTrigger(0);
        return true;
      }),
    [focusTrigger]
  );

  const onTriggerKeyDown = (
    index: number,
    e: ReactKeyboardEvent<HTMLButtonElement>
  ) => {
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    switch (e.key) {
      case "ArrowRight":
        handled();
        return focusTrigger((index + 1) % n);
      case "ArrowLeft":
        handled();
        return focusTrigger((index - 1 + n) % n);
      case "Home":
        handled();
        return focusTrigger(0);
      case "End":
        handled();
        return focusTrigger(n - 1);
      case "ArrowDown":
      case "Enter":
      case " ":
        handled();
        return setOpen(index, "first");
      case "ArrowUp":
        handled();
        return setOpen(index, "last");
      case "Escape":
        handled();
        return restoreFocus(origin.current);
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const letter = e.key.toLowerCase();
      const match = menus.findIndex((m) => m.mnemonic.toLowerCase() === letter);
      if (match !== -1) {
        handled();
        focusTrigger(match);
      }
    }
  };

  const onTriggerClick = (index: number, e: ReactMouseEvent) => {
    // Enter and Space are handled on keydown; this is the pointer.
    if (e.detail === 0) return;
    if (open?.index === index) setOpen(null);
    else setOpen(index, "none");
  };

  const openMenu = open ? menus[open.index] : undefined;

  return (
    <FloatingTree>
      <nav
        role="menubar"
        aria-label="Application menu"
        data-testid={TID.menubar}
        data-studio-region="menubar"
        data-menu-root={ROOT_ID}
        className="flex min-w-0 items-center"
      >
        {menus.map((menu, i) => (
          <button
            key={menu.id}
            ref={(el) => {
              triggers.current[i] = el;
            }}
            type="button"
            id={`menubar-trigger-${menu.id}`}
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open?.index === i}
            tabIndex={roving === i ? 0 : -1}
            data-testid={TID.menubarTrigger}
            data-menu={menu.id}
            className={TRIGGER_CLASS}
            onFocus={() => setRoving(i)}
            onKeyDown={(e) => onTriggerKeyDown(i, e)}
            onClick={(e) => onTriggerClick(i, e)}
            onPointerEnter={(e) => {
              if (e.pointerType === "touch") return;
              if (open && open.index !== i) setOpen(i, "none");
            }}
          >
            {menu.title}
          </button>
        ))}
      </nav>
      {open && openMenu && (
        <FloatingPortal>
          <CommandMenu
            key={open.seq}
            nodes={openMenu.items}
            rootId={ROOT_ID}
            menuId={openMenu.id}
            labelledBy={`menubar-trigger-${openMenu.id}`}
            level={0}
            initialFocus={open.focus}
            floating={{ setFloating: refs.setFloating, style: floatingStyles }}
            onActivate={(item) => {
              setOpen(null);
              restoreFocus(origin.current);
              runMenuItem(item);
            }}
            onClose={(reason) => {
              const index = open.index;
              setOpen(null);
              if (reason === "tab") restoreFocus(origin.current);
              else focusTrigger(index);
            }}
            onNavigateOut={(dir) =>
              setOpen((open.index + dir + n) % n, "first")
            }
          />
        </FloatingPortal>
      )}
    </FloatingTree>
  );
};
