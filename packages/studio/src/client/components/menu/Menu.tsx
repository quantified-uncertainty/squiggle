import {
  CSSProperties,
  FC,
  KeyboardEvent as ReactKeyboardEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TID } from "../../../shared/testIds.js";
import {
  createContextPublisher,
  patchContextKeys,
} from "../../commands/context.js";
import { focusMain, focusRegion } from "../../commands/focus.js";
import {
  MenuHeader,
  MenuItem,
  MenuPlaceholder,
  MenuSeparator,
} from "./MenuItem.js";
import {
  firstIndex,
  flatItems,
  isNavigable,
  lastIndex,
  nextIndex,
  type ResolvedCommandItem,
  type ResolvedItem,
  type ResolvedNode,
  typeaheadIndex,
} from "./resolveMenu.js";
import { SubMenu } from "./SubMenu.js";

// A menu panel (`role="menu"`) and the helpers every menu root (MenuBar,
// PopupMenu) shares (§3.3).
//
// Keyboard inside a panel: ↑ / ↓ (wrap, skip disabled items and
// separators), Home / End, letter typeahead, Enter / Space activate, → opens
// a submenu or moves to the next top-level menu, ← closes a submenu or moves
// to the previous menu, Esc closes one level, Tab closes everything. The
// active item has DOM focus (roving tabindex), so `document.activeElement`
// and screen readers agree with what is highlighted.
//
// Positioning is floating-ui's (the owner passes `floating`); submenus open
// on hover after 100 ms and stay open while the pointer moves towards them
// (useHover with safePolygon, SubMenu.tsx).

export type InitialFocus = "first" | "last" | "none";
export type CloseReason = "escape" | "left" | "tab";

export const PANEL_CLASS =
  "z-50 max-h-[calc(100vh-3rem)] min-w-[16rem] max-w-[24rem] overflow-y-auto rounded-md border border-slate-300 bg-white py-1 shadow-xl outline-none";

const TYPEAHEAD_MS = 500;

export type MenuFloating = {
  setFloating: (el: HTMLElement | null) => void;
  style: CSSProperties;
  props?: Record<string, unknown>; // floating-ui interaction props (useHover)
};

export type MenuPanelProps = {
  items: readonly ResolvedNode[];
  rootId: string; // `data-menu-root`: shared by the root's triggers and every panel
  menuId?: string; // `data-menu`
  labelledBy?: string;
  level: number; // 0 for a top-level menu
  initialFocus: InitialFocus;
  floating: MenuFloating;
  onActivate: (item: ResolvedCommandItem) => void;
  onClose: (reason: CloseReason) => void;
  // ← / → that leave this menu sideways (the menubar's neighbours).
  onNavigateOut?: (dir: 1 | -1) => void;
};

function initialActive(
  items: readonly ResolvedItem[],
  focus: InitialFocus
): number | null {
  if (focus === "first") return firstIndex(items) ?? null;
  if (focus === "last") return lastIndex(items) ?? null;
  return null;
}

export const MenuPanel: FC<MenuPanelProps> = ({
  items,
  rootId,
  menuId,
  labelledBy,
  level,
  initialFocus,
  floating,
  onActivate,
  onClose,
  onNavigateOut,
}) => {
  const flat = useMemo(() => flatItems(items), [items]);
  const indexOf = useMemo(
    () => new Map(flat.map((item, i) => [item.key, i])),
    [flat]
  );
  const [active, setActive] = useState<number | null>(() =>
    initialActive(flat, initialFocus)
  );
  const [openSub, setOpenSub] = useState<{
    index: number;
    focus: InitialFocus;
    via: "keyboard" | "pointer";
    seq: number;
  } | null>(null);
  const seq = useRef(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const typeahead = useRef({ text: "", at: 0 });

  // The active item has focus; with none, the panel itself (so its keys
  // still work).
  useLayoutEffect(() => {
    if (active === null) {
      panelRef.current?.focus({ preventScroll: true });
      return;
    }
    const el = itemRefs.current[active];
    el?.focus({ preventScroll: true });
    el?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  const openSubmenu = (
    index: number,
    focus: InitialFocus,
    via: "keyboard" | "pointer"
  ) => {
    seq.current++;
    setActive(index);
    setOpenSub({ index, focus, via, seq: seq.current });
  };

  const closeSubmenu = useCallback((index: number, refocus: boolean) => {
    setOpenSub((current) => (current?.index === index ? null : current));
    if (refocus) {
      setActive(index);
      itemRefs.current[index]?.focus({ preventScroll: true });
      return;
    }
    // A submenu closed by the pointer may have had focus: keep it in the menu.
    requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (focused && focused !== document.body) return;
      (itemRefs.current[index] ?? panelRef.current)?.focus({
        preventScroll: true,
      });
    });
  }, []);

  const activate = (index: number | null) => {
    if (index === null) return;
    const item = flat[index];
    if (item.kind === "submenu") openSubmenu(index, "first", "keyboard");
    else if (item.kind === "command" && item.enabled) onActivate(item);
  };

  const onHover = (index: number, e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const item = flat[index];
    if (openSub && openSub.index !== index && openSub.via === "keyboard") {
      closeSubmenu(openSub.index, false);
    }
    if (!isNavigable(item)) {
      if (active !== null) setActive(null);
      return;
    }
    if (active !== index) setActive(index);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Keys from a nested (portaled) submenu bubble here through React.
    if (!(e.target instanceof Node) || !panelRef.current?.contains(e.target)) {
      return;
    }
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    const move = (index: number | undefined) => {
      if (index !== undefined) setActive(index);
    };
    switch (e.key) {
      case "ArrowDown":
        handled();
        return move(nextIndex(flat, active, 1));
      case "ArrowUp":
        handled();
        return move(nextIndex(flat, active, -1));
      case "Home":
        handled();
        return move(firstIndex(flat));
      case "End":
        handled();
        return move(lastIndex(flat));
      case "Enter":
      case " ":
        handled();
        if (!e.repeat) activate(active);
        return;
      case "ArrowRight":
        handled();
        if (active !== null && flat[active].kind === "submenu") {
          openSubmenu(active, "first", "keyboard");
        } else {
          onNavigateOut?.(1);
        }
        return;
      case "ArrowLeft":
        handled();
        if (level > 0) onClose("left");
        else onNavigateOut?.(-1);
        return;
      case "Escape":
        handled();
        onClose("escape");
        return;
      case "Tab":
        handled();
        onClose("tab");
        return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      handled();
      const now = Date.now();
      const t = typeahead.current;
      t.text = now - t.at > TYPEAHEAD_MS ? e.key : t.text + e.key;
      t.at = now;
      move(typeaheadIndex(flat, active, t.text));
    }
  };

  const renderItem = (item: ResolvedItem) => {
    const index = indexOf.get(item.key) ?? -1;
    const setRef = (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    };
    if (item.kind === "placeholder") {
      return <MenuPlaceholder key={item.key} item={item} />;
    }
    if (item.kind === "submenu") {
      const open = openSub?.index === index;
      return (
        <SubMenu
          key={item.key}
          item={item}
          index={index}
          active={active === index}
          open={open}
          initialFocus={open ? openSub.focus : "none"}
          focusSeq={open ? openSub.seq : 0}
          rootId={rootId}
          level={level}
          setRef={setRef}
          onHover={onHover}
          onOpenChange={(next, via) => {
            if (next) {
              if (!open)
                openSubmenu(index, via === "keyboard" ? "first" : "none", via);
            } else {
              closeSubmenu(index, false);
            }
          }}
          onClose={(reason) => {
            if (reason === "tab") onClose("tab");
            else closeSubmenu(index, true);
          }}
          onActivate={onActivate}
          onNavigateOut={onNavigateOut}
        />
      );
    }
    return (
      <MenuItem
        key={item.key}
        ref={setRef}
        item={item}
        index={index}
        active={active === index}
        onHover={onHover}
        onActivate={onActivate}
      />
    );
  };

  return (
    <div
      {...floating.props}
      ref={(el) => {
        panelRef.current = el;
        floating.setFloating(el);
      }}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      data-testid={TID.menu}
      data-menu={menuId}
      data-menu-root={rootId}
      data-menu-level={level}
      data-studio-region="menubar"
      className={PANEL_CLASS}
      style={floating.style}
      onKeyDown={onKeyDown}
    >
      {items.map((node) => {
        if (node.kind === "separator") return <MenuSeparator key={node.key} />;
        if (node.kind === "group") {
          return (
            <div key={node.key} role="group" aria-label={node.label}>
              {node.label && <MenuHeader label={node.label} />}
              {node.items.map(renderItem)}
            </div>
          );
        }
        return renderItem(node);
      })}
    </div>
  );
};

// ── Shared by menu roots ────────────────────────────────────────────────────

// `menuOpen` (§4.4): true while any menu panel is open. The dispatcher then
// only prevents Studio keys, and Follow holds back.
let openMenus = 0;
let menuOpenPublisher: number | undefined;
function publishMenuOpen() {
  menuOpenPublisher ??= createContextPublisher();
  patchContextKeys(menuOpenPublisher, { menuOpen: openMenus > 0 });
}

// Outside pointerdown, window blur and resize close the whole tree; the
// context key `menuOpen` is true meanwhile.
export function useMenuRoot(
  open: boolean,
  rootId: string,
  closeAll: () => void
): void {
  useLayoutEffect(() => {
    if (!open) return;
    openMenus++;
    publishMenuOpen();
    return () => {
      openMenus--;
      publishMenuOpen();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (isInMenuRoot(e.target, rootId)) return;
      closeAll();
    };
    // Only a real size change: some resize events keep the size (a
    // screenshot's device-metrics override, mobile toolbars).
    const size = { width: window.innerWidth, height: window.innerHeight };
    const onResize = () => {
      if (
        window.innerWidth !== size.width ||
        window.innerHeight !== size.height
      ) {
        closeAll();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("blur", closeAll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("blur", closeAll);
      window.removeEventListener("resize", onResize);
    };
  }, [open, rootId, closeAll]);
}

export function isInMenuRoot(
  target: EventTarget | null,
  rootId: string
): boolean {
  return (
    target instanceof Element &&
    target.closest(`[data-menu-root="${CSS.escape(rootId)}"]`) !== null
  );
}

// The element that had focus before focus entered this menu root (its
// triggers or panels), so Esc and activation can return there.
export function useFocusOrigin(
  rootId: string
): MutableRefObject<HTMLElement | null> {
  const origin = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (!isInMenuRoot(e.target, rootId)) return;
      if (isInMenuRoot(e.relatedTarget, rootId)) return;
      origin.current =
        e.relatedTarget instanceof HTMLElement ? e.relatedTarget : null;
    };
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, [rootId]);
  return origin;
}

// Returns focus to `el`; if it is gone (or was <body>), to the main area,
// else the Explorer, so focus never stays on <body> (§4.5).
export function restoreFocus(el: HTMLElement | null): void {
  if (
    el &&
    el.isConnected &&
    el !== document.body &&
    !el.closest("[data-menu-root]")
  ) {
    el.focus({ preventScroll: true });
    return;
  }
  void focusMain({ retryMs: 0 }).then((ok) => {
    if (!ok) void focusRegion("tree", { retryMs: 0 });
  });
}
