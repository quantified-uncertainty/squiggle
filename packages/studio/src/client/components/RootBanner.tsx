import { FC } from "react";

import { Button } from "@quri/ui";

import { basename } from "../../shared/paths.js";
import { TID } from "../../shared/testIds.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";

// The full-width banner under the header when another window switched the
// folder, or the folder was moved or deleted (§2.7). WP0 stub (owned by WP4):
// the banner moved out of App.tsx.
export const RootBanner: FC = () => {
  const workspace = useWorkspaceContext();
  const { rootChangedTo, rootMissing, rootInfo } = workspace;
  if (rootMissing) {
    return (
      <div
        role="alert"
        data-testid={TID.rootBanner}
        data-kind="missing"
        className="flex shrink-0 items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900"
      >
        <span className="line-clamp-2 flex-1" title={rootInfo?.root}>
          The folder <strong className="font-semibold">{rootInfo?.name}</strong>{" "}
          was moved or deleted. Unsaved edits are kept in this window.
        </span>
      </div>
    );
  }
  if (!rootChangedTo) return null;
  return (
    <div
      role="alert"
      data-testid={TID.rootBanner}
      data-kind="changed"
      className="flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
    >
      <span className="line-clamp-2 flex-1" title={rootChangedTo}>
        Another window switched Studio to{" "}
        <strong className="font-semibold">{basename(rootChangedTo)}</strong>.
        Unsaved edits here can no longer be saved; copy anything you need first.
      </span>
      <Button size="small" onClick={() => void workspace.followRootChange()}>
        Discard edits and switch
      </Button>
    </div>
  );
};
