import { FC } from "react";

import { getLayout, setLayout } from "../lib/stores/layout.js";
import { focusMain, getFocusRegion } from "./focus.js";
import { useCommand } from "./registry.js";

const openLink = (url: string) => {
  window.open(url, "_blank", "noreferrer");
};

const REPO = "https://github.com/quantified-uncertainty/squiggle";

// Layout toggles, Focus Menu Bar, Help links and browser full screen. WP0
// stub (owned by WP1): the layout toggles and Help links.
export const ShellCommands: FC = () => {
  useCommand("workbench.action.toggleSidebarVisibility", () => {
    const visible = getLayout("sidebarVisible");
    // Hiding the Explorer while it has focus moves focus to the main area.
    if (visible && getFocusRegion() === "tree") void focusMain();
    setLayout("sidebarVisible", !visible);
  });
  useCommand("workbench.action.toggleStatusbarVisibility", () =>
    setLayout("statusBarVisible", !getLayout("statusBarVisible"))
  );
  useCommand("squiggle.help.docs", () =>
    openLink("https://squiggle-language.com/docs")
  );
  useCommand("squiggle.help.relativeValues", () =>
    openLink(`${REPO}/tree/main/packages/relative-values#readme`)
  );
  useCommand("squiggle.help.agents", () =>
    openLink(`${REPO}/tree/main/packages/studio#for-agents`)
  );
  useCommand("squiggle.help.hub", () => openLink("https://squigglehub.org"));
  useCommand("squiggle.help.reportIssue", () => openLink(`${REPO}/issues/new`));
  return null;
};
