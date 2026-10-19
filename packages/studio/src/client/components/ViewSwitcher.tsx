import { FC } from "react";

import {
  formatKey,
  getCommand,
  keyForPlatform,
} from "../../shared/commands/index.js";
import { TID } from "../../shared/testIds.js";
import { runCommand } from "../commands/registry.js";
import { host } from "../lib/host.js";
import { SegmentedControl } from "./SegmentedControl.js";

export type ViewEntry = { id: string; label: string; available: boolean };

// ⌘K N for the Nth view (1-based, in switcher order), as shown in tooltips.
export function viewKeyLabel(index: number): string | undefined {
  const spec = getCommand("squiggle.view.select");
  const binding = spec?.keys?.find((b) => {
    const args = b.args;
    return (
      typeof args === "object" &&
      args !== null &&
      "index" in args &&
      args.index === index
    );
  });
  const key = binding && keyForPlatform(binding, host.platform);
  return key ? formatKey(key, host.platform) : undefined;
}

// The view switcher in the editor header (§3.6): Output, Relative values,
// Playground and custom views, as a tablist. `views` is every view in
// switcher order (the `squiggle.views` context key); unavailable ones aren't
// shown, but keep their number, so ⌘K 3 is the Playground in every file.
export const ViewSwitcher: FC<{
  views: readonly ViewEntry[];
  activeId: string | undefined;
  panelId: string; // the view's container (aria-controls)
}> = ({ views, activeId, panelId }) => {
  const options = views.flatMap((view, i) => {
    if (!view.available) return [];
    const key = viewKeyLabel(i + 1);
    return [
      {
        value: view.id,
        label: view.label,
        tooltip: key ? `${view.label} (${key})` : view.label,
        testId: TID.viewTab,
        attrs: { "data-view": view.id },
      },
    ];
  });
  if (options.length === 0) return null;
  return (
    <SegmentedControl
      role="tablist"
      label="Views"
      testId={TID.viewSwitcher}
      controls={panelId}
      options={options}
      value={activeId}
      onChange={(id) => runCommand("squiggle.view.select", { id }, "button")}
    />
  );
};
