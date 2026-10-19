import { clsx } from "clsx";
import {
  FC,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import { type MenuNode, STUDIO_MENUS } from "../../shared/commands/index.js";
import { TID } from "../../shared/testIds.js";
import { urlFlagsFromSearch } from "../../shared/viewState.js";
import { host } from "../lib/host.js";
import { useLayout } from "../lib/stores/layout.js";
import { CommandButton } from "./CommandButton.js";
import { CommandCenter } from "./CommandCenter.js";
import { SidebarIcon, SquiggleIcon } from "./icons.js";
import type { InitialFocus } from "./menu/Menu.js";
import { MenuBar, registerMenuBarFocuser } from "./menu/MenuBar.js";
import { PopupMenu } from "./menu/PopupMenu.js";

// `?menubar=1` forces the in-app menubar in Electron (QA screenshots).
const forceMenubar = urlFlagsFromSearch(window.location.search).menubar === "1";

// Below this window width the command center is a search-icon button.
const COMPACT_QUERY = "(max-width: 899.98px)";

function useMediaQuery(query: string): boolean {
  const media = useMemo(() => window.matchMedia(query), [query]);
  return useSyncExternalStore(
    (cb) => {
      media.addEventListener("change", cb);
      return () => media.removeEventListener("change", cb);
    },
    () => media.matches,
    () => false
  );
}

// The six menus as submenus of one ☰ menu (View ▸ Menu Bar off).
const APP_MENU: readonly MenuNode[] = STUDIO_MENUS.map((menu) => ({
  submenu: menu.id,
  title: menu.title,
  items: menu.items,
}));

const HamburgerIcon: FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
  >
    <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
  </svg>
);

// The ☰ button that replaces the logo while the menubar is hidden; F10 opens
// it.
const AppMenuButton: FC = () => {
  const openRef = useRef<((focus: InitialFocus) => void) | null>(null);
  useLayoutEffect(
    () =>
      registerMenuBarFocuser(() => {
        if (!openRef.current) return false;
        openRef.current("first");
        return true;
      }),
    []
  );
  return (
    <PopupMenu
      label="Application menu"
      title="Application menu (F10)"
      trigger={<HamburgerIcon />}
      items={APP_MENU}
      menuId="app"
      testId={TID.menubarTrigger}
      openRef={openRef}
      restore="origin"
      triggerClassName="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-600 outline-none hover:bg-slate-200 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-300 aria-expanded:bg-slate-200"
    />
  );
};

// The 36 px application header (§3.2): logo and menubar on the left, the
// command center in the middle, the Explorer toggle on the right. In
// Electron the native menu replaces the menubar (unless `?menubar=1`).
export const AppHeader: FC = () => {
  const [sidebarVisible] = useLayout("sidebarVisible");
  const [menuBarVisible] = useLayout("menuBarVisible");
  const compact = useMediaQuery(COMPACT_QUERY);
  const inAppMenus = host.kind === "web" || forceMenubar;
  const showMenubar = inAppMenus && (menuBarVisible || forceMenubar);

  return (
    <header
      data-testid={TID.appHeader}
      className={clsx(
        "grid h-9 shrink-0 select-none items-center gap-2 border-b border-slate-200 bg-slate-50 px-2",
        // The side columns are equal, so the command center stays centered.
        compact
          ? "grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)]"
          : "grid-cols-[minmax(max-content,1fr)_minmax(12rem,28rem)_minmax(max-content,1fr)]"
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        {inAppMenus && !showMenubar ? (
          <AppMenuButton />
        ) : (
          <span
            title="Squiggle Studio"
            className="grid h-6 w-6 shrink-0 place-items-center"
          >
            <SquiggleIcon size={16} className="text-orange-500" />
          </span>
        )}
        {showMenubar && <MenuBar menus={STUDIO_MENUS} />}
      </div>
      <CommandCenter compact={compact} />
      <div className="flex items-center justify-end">
        <CommandButton
          command="workbench.action.toggleSidebarVisibility"
          testId={TID.explorerToggle}
          icon={<SidebarIcon size={16} />}
          pressed={sidebarVisible}
        />
      </div>
    </header>
  );
};
