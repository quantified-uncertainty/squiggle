import { FC } from "react";

import { SearchIcon } from "@quri/ui";

import { STUDIO_MENUS } from "../../shared/commands/index.js";
import { TID } from "../../shared/testIds.js";
import { urlFlagsFromSearch } from "../../shared/viewState.js";
import { runCommand } from "../commands/registry.js";
import { host } from "../lib/host.js";
import { useLayout } from "../lib/stores/layout.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { CommandButton } from "./CommandButton.js";
import { SidebarIcon, SquiggleIcon } from "./icons.js";
import { Kbd } from "./Kbd.js";
import { PopupMenu } from "./menu/PopupMenu.js";

// `?menubar=1` forces the in-app menubar in Electron (QA screenshots).
const forceMenubar = urlFlagsFromSearch(window.location.search).menubar === "1";

// The 36 px application header (§3.2): logo and menubar, the command
// center, the Explorer toggle. WP0 stub (owned by WP1): the menus are plain
// PopupMenu lists; WP1 builds the accessible MenuBar.
export const AppHeader: FC = () => {
  const workspace = useWorkspaceContext();
  const [sidebarVisible] = useLayout("sidebarVisible");
  const [menuBarVisible] = useLayout("menuBarVisible");
  const showMenubar = (host.kind === "web" && menuBarVisible) || forceMenubar;
  const folder = workspace.rootInfo?.name ?? "…";

  return (
    <header
      data-testid={TID.appHeader}
      className="grid h-9 shrink-0 select-none grid-cols-[minmax(max-content,1fr)_minmax(12rem,28rem)_minmax(max-content,1fr)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-2"
    >
      <div className="flex min-w-0 items-center gap-1">
        <span
          title="Squiggle Studio"
          className="grid h-6 w-6 shrink-0 place-items-center"
        >
          <SquiggleIcon size={16} className="text-orange-500" />
        </span>
        {showMenubar && (
          <nav
            role="menubar"
            aria-label="Application menu"
            data-testid={TID.menubar}
            data-studio-region="menubar"
            className="flex min-w-0 items-center"
          >
            {STUDIO_MENUS.map((menu) => (
              <PopupMenu
                key={menu.id}
                label={menu.title}
                menuId={menu.id}
                testId={TID.menubarTrigger}
                trigger={menu.title}
                items={menu.items}
                triggerClassName="h-6 rounded px-2 text-[13px] text-slate-700 hover:bg-slate-200 aria-expanded:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              />
            ))}
          </nav>
        )}
      </div>
      <button
        type="button"
        data-testid={TID.commandCenter}
        data-command="workbench.action.quickOpen"
        title={workspace.rootInfo?.root}
        className="flex h-6 w-full min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-500 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        onClick={() =>
          runCommand("workbench.action.quickOpen", undefined, "button")
        }
      >
        <SearchIcon size={12} className="shrink-0 text-slate-500" />
        <span className="shrink-0 font-medium text-slate-700">{folder}</span>
        <span className="min-w-0 truncate">— Go to file or run a command</span>
        <Kbd
          command="workbench.action.quickOpen"
          className="ml-auto shrink-0"
        />
      </button>
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
