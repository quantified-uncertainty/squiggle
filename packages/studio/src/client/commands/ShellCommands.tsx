import { FC } from "react";

import { focusMenuBar } from "../components/menu/MenuBar.js";
import { host } from "../lib/host.js";
import { getLayout, setLayout } from "../lib/stores/layout.js";
import { useMenuStatePush } from "../lib/useMenuStatePush.js";
import { focusMain, getFocusRegion } from "./focus.js";
import { useCommand } from "./registry.js";

const openLink = (url: string) => {
  window.open(url, "_blank", "noreferrer");
};

const REPO = "https://github.com/quantified-uncertainty/squiggle";

export const HELP_LINKS = {
  "squiggle.help.docs": "https://squiggle-language.com/docs",
  "squiggle.help.relativeValues": `${REPO}/tree/main/packages/relative-values#readme`,
  "squiggle.help.agents": `${REPO}/tree/main/packages/studio#for-agents`,
  "squiggle.help.hub": "https://squigglehub.org",
  "squiggle.help.reportIssue": `${REPO}/issues/new`,
} as const;

// Browser full screen; in Electron the native menu item does it (main).
async function toggleFullScreen(): Promise<void> {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
}

// Electron: the native menu's enabled, checked and dynamic state.
const MenuStatePush: FC = () => {
  useMenuStatePush();
  return null;
};

// Layout toggles (Explorer, status bar, menubar), Focus Menu Bar, browser
// full screen and the Help links (§3.4, §10.5).
export const ShellCommands: FC = () => {
  useCommand("workbench.action.toggleSidebarVisibility", () => {
    const visible = getLayout("sidebarVisible");
    // Hiding the Explorer while it has focus moves focus to the main area.
    if (visible && getFocusRegion() === "tree") void focusMain();
    setLayout("sidebarVisible", !visible);
  });
  useCommand("workbench.action.toggleStatusbarVisibility", () => {
    const visible = getLayout("statusBarVisible");
    if (visible && getFocusRegion() === "statusbar") void focusMain();
    setLayout("statusBarVisible", !visible);
  });
  useCommand("workbench.action.toggleMenuBar", () =>
    setLayout("menuBarVisible", !getLayout("menuBarVisible"))
  );
  // F10, an Alt tap, or the palette. False (keys pass through) when there is
  // no in-app menubar.
  useCommand("squiggle.focusMenuBar", () => focusMenuBar());
  useCommand("workbench.action.toggleFullScreen", toggleFullScreen);
  useCommand("squiggle.help.docs", () =>
    openLink(HELP_LINKS["squiggle.help.docs"])
  );
  useCommand("squiggle.help.relativeValues", () =>
    openLink(HELP_LINKS["squiggle.help.relativeValues"])
  );
  useCommand("squiggle.help.agents", () =>
    openLink(HELP_LINKS["squiggle.help.agents"])
  );
  useCommand("squiggle.help.hub", () =>
    openLink(HELP_LINKS["squiggle.help.hub"])
  );
  useCommand("squiggle.help.reportIssue", () =>
    openLink(HELP_LINKS["squiggle.help.reportIssue"])
  );
  return host.kind === "electron" ? <MenuStatePush /> : null;
};
