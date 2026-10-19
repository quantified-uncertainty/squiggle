import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

import { TID } from "../../shared/testIds.js";
import { type OpenFile, useWorkspaceContext } from "../lib/workspaceTypes.js";

type Tone = "warning" | "error";

export const BannerButton: FC<
  PropsWithChildren<{ tone: Tone; onClick: () => void; primary?: boolean }>
> = ({ tone, onClick, primary, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "h-6 shrink-0 rounded border px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
      tone === "warning"
        ? primary
          ? "border-amber-700 bg-amber-700 text-white hover:bg-amber-800"
          : "border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
        : primary
          ? "border-red-700 bg-red-700 text-white hover:bg-red-800"
          : "border-red-300 bg-white text-red-900 hover:bg-red-100"
    )}
  >
    {children}
  </button>
);

const Banner: FC<
  PropsWithChildren<{ tone: Tone; kind: "conflict" | "deleted" }>
> = ({ tone, kind, children }) => (
  <div
    role="alert"
    data-testid={TID.fileBanner}
    data-kind={kind}
    className={clsx(
      "flex shrink-0 items-center gap-2 border-b px-3 py-1.5 text-[13px]",
      tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-900"
    )}
  >
    {children}
  </div>
);

// The conflict and deleted banners under the editor header (§2.6). Unsaved
// edits are never overwritten silently: "Reload from disk" re-reads the file
// (#9), "Overwrite with my edits" saves over the version the banner names.
export const FileBanner: FC<{
  file: OpenFile;
  onReload: () => void;
  onKeepMine: () => void;
  onSave: () => void;
}> = ({ file, onReload, onKeepMine, onSave }) => {
  const workspace = useWorkspaceContext();
  if (file.conflict) {
    return (
      <Banner tone="warning" kind="conflict">
        <span className="min-w-0 flex-1 truncate" title={file.path}>
          <strong className="font-semibold">{file.path}</strong> changed on disk
          while you had unsaved edits.
        </span>
        <BannerButton tone="warning" primary onClick={onReload}>
          Reload from disk
        </BannerButton>
        <BannerButton tone="warning" onClick={onKeepMine}>
          Overwrite with my edits
        </BannerButton>
      </Banner>
    );
  }
  if (file.deletedOnDisk) {
    return (
      <Banner tone="error" kind="deleted">
        <span className="min-w-0 flex-1 truncate">
          This file was deleted on disk.
        </span>
        <BannerButton tone="error" primary onClick={onSave}>
          Save to recreate
        </BannerButton>
        <BannerButton
          tone="error"
          onClick={() => void workspace.closeFile(file.path)}
        >
          Close
        </BannerButton>
      </Banner>
    );
  }
  return null;
};
