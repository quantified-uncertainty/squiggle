import { FC, useState } from "react";

import { basename } from "../../shared/paths.js";
import { TID } from "../../shared/testIds.js";
import { runCommand } from "../commands/registry.js";
import { api } from "../lib/api.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { BannerButton } from "./FileBanner.js";

// The full-width banner under the application header (§2.7, #13, #35, #56):
// another window switched the server to a different folder while this one
// has unsaved edits, or the open folder was moved or deleted. Autosave is
// suspended and saves are disabled meanwhile; the Explorer dims itself.
// Folder names are basenames (the full path is the tooltip), at most two
// lines.
export const RootBanner: FC = () => {
  const workspace = useWorkspaceContext();
  const { rootChangedTo, rootMissing, rootInfo } = workspace;
  const [busy, setBusy] = useState(false);

  const run = (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    void fn().finally(() => setBusy(false));
  };

  if (rootMissing) {
    return (
      <div
        role="alert"
        data-testid={TID.rootBanner}
        data-kind="missing"
        className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-1.5 text-[13px] text-red-900"
      >
        <span className="line-clamp-2 min-w-0 flex-1" title={rootInfo?.root}>
          The folder <strong className="font-semibold">{rootInfo?.name}</strong>{" "}
          was moved or deleted. Unsaved edits are kept in this window.
        </span>
        {rootInfo?.allowOpenFolder !== false && (
          <BannerButton
            tone="error"
            primary
            onClick={() =>
              runCommand(
                "workbench.action.files.openFolder",
                undefined,
                "button"
              )
            }
          >
            Open Folder…
          </BannerButton>
        )}
        <BannerButton tone="error" onClick={() => run(workspace.resync)}>
          Retry
        </BannerButton>
      </div>
    );
  }
  if (!rootChangedTo) return null;
  return (
    <div
      role="alert"
      data-testid={TID.rootBanner}
      data-kind="changed"
      className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] text-amber-900"
    >
      <span className="line-clamp-2 min-w-0 flex-1" title={rootChangedTo}>
        Another window switched Studio to{" "}
        <strong className="font-semibold">{basename(rootChangedTo)}</strong>.
        Edits in this window can&apos;t be saved until it switches back.
      </span>
      {rootInfo && rootInfo.allowOpenFolder !== false && (
        <BannerButton
          tone="warning"
          primary
          onClick={() =>
            run(async () => {
              // Points the server back at this window's folder (the other
              // window then gets the banner if it has unsaved edits); the
              // resync clears this banner and catches up.
              await api.openFolder(rootInfo.root);
              await workspace.resync();
            })
          }
        >
          Switch back to {rootInfo.name}
        </BannerButton>
      )}
      <BannerButton
        tone="warning"
        onClick={() => run(workspace.followRootChange)}
      >
        Discard edits and open {basename(rootChangedTo)}
      </BannerButton>
    </div>
  );
};
