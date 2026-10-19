import { FC, PropsWithChildren } from "react";

import { Button } from "@quri/ui";

import type { OpenFile } from "../lib/useWorkspace.js";

const Banner: FC<PropsWithChildren<{ tone: "warning" | "error" }>> = ({
  tone,
  children,
}) => (
  <div
    role="alert"
    className={
      tone === "warning"
        ? "flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
        : "flex shrink-0 items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900"
    }
  >
    {children}
  </div>
);

export const FileBanner: FC<{
  file: OpenFile;
  onReload: () => void;
  onKeepMine: () => void;
  onSave: () => void;
}> = ({ file, onReload, onKeepMine, onSave }) => {
  if (file.conflict) {
    return (
      <Banner tone="warning">
        <span className="flex-1">
          <strong className="font-semibold">{file.path}</strong> changed on
          disk, but you have unsaved edits.
        </span>
        <Button size="small" onClick={onReload}>
          Reload from disk
        </Button>
        <Button size="small" onClick={onKeepMine}>
          Keep my edits
        </Button>
      </Banner>
    );
  }
  if (file.deletedOnDisk) {
    return (
      <Banner tone="error">
        <span className="flex-1">This file was deleted on disk.</span>
        <Button size="small" onClick={onSave}>
          Save to recreate
        </Button>
      </Banner>
    );
  }
  return null;
};
