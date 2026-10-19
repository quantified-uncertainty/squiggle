import { clsx } from "clsx";
import { FC, useCallback, useEffect, useRef, useState } from "react";

import { Button, ChevronLeftIcon, StyledInput, useToast } from "@quri/ui";

import type { BrowseResponse, RecentFolder } from "../../shared/api.js";
import { TID } from "../../shared/testIds.js";
import { api } from "../lib/api.js";
import { folderName, folderParent } from "../lib/explorerUi.js";
import { ExplorerModalFrame } from "./ExplorerModalFrame.js";
import { FolderIcon } from "./icons.js";

const MAX_RECENT = 8;

type Props = {
  currentRoot?: string;
  recentFolders: RecentFolder[];
  onOpen: (path: string) => Promise<void>;
  close: () => void;
};

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

// Text that is cut off at the start ("…/Documents/models"), so the end of a
// long path stays visible.
const StartTruncated: FC<{ text: string; className?: string }> = ({
  text,
  className,
}) => (
  <span dir="rtl" className={clsx("min-w-0 truncate text-left", className)}>
    <bdi dir="ltr">{text}</bdi>
  </span>
);

// A folder as its name in bold and its parent folder muted (#52).
const FolderLabel: FC<{ path: string }> = ({ path }) => (
  <>
    <span className="min-w-0 max-w-[60%] shrink-0 truncate text-sm font-medium text-slate-800">
      {folderName(path)}
    </span>
    <StartTruncated
      text={folderParent(path)}
      className="text-xs text-slate-500"
    />
  </>
);

// Browse to a folder, or type or paste its path, and open it. The primary
// button opens the typed path when it differs from the listed folder (#18);
// errors toast and keep the modal open.
export const OpenFolderModal: FC<Props> = ({
  currentRoot,
  recentFolders,
  onOpen,
  close,
}) => {
  const toast = useToast();
  const [listing, setListing] = useState<BrowseResponse | undefined>();
  const [input, setInput] = useState(currentRoot ?? "");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const browse = useCallback(
    async (path?: string) => {
      try {
        const result = await api.browse(path);
        setListing(result);
        setInput(result.path);
      } catch (e) {
        toast(errorMessage(e), "error");
      }
    },
    [toast]
  );

  useEffect(() => {
    void browse(currentRoot);
  }, [browse, currentRoot]);

  // The modal animates in through a portal, so `autoFocus` isn't reliable.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Long paths show their end (the folder name) in the field.
  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement !== el) el.scrollLeft = el.scrollWidth;
  }, [listing]);

  const open = async (path: string) => {
    setBusy(true);
    try {
      await onOpen(path);
      close();
    } catch (e) {
      toast(errorMessage(e), "error");
      setBusy(false);
    }
  };

  const typed = input.trim();
  const target = typed && typed !== listing?.path ? typed : listing?.path;
  const recent = recentFolders
    .filter((f) => f.path !== currentRoot)
    .slice(0, MAX_RECENT);

  return (
    <ExplorerModalFrame
      testId={TID.modalOpenFolder}
      title="Open folder"
      close={close}
      footer={
        <div className="flex justify-end gap-2" data-testid={TID.modalActions}>
          <Button onClick={close}>Cancel</Button>
          <Button
            theme="primary"
            disabled={!target || busy}
            onClick={() => target && void open(target)}
          >
            Open this folder
          </Button>
        </div>
      }
    >
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void browse(typed || undefined);
        }}
      >
        <div className="min-w-0 flex-1">
          <StyledInput
            ref={inputRef}
            size="small"
            value={input}
            aria-label="Folder path"
            onChange={(e) => setInput(e.target.value)}
            placeholder="/path/to/folder"
          />
        </div>
        <Button type="submit" size="medium">
          Go
        </Button>
      </form>
      {listing && (
        <div
          className="mt-3 flex min-w-0 items-baseline gap-2"
          title={listing.path}
          data-listed-folder={listing.path}
        >
          <span className="shrink-0 text-xs text-slate-600">Showing</span>
          <FolderLabel path={listing.path} />
        </div>
      )}
      <div className="mt-1.5 h-56 overflow-auto rounded-md border border-slate-200">
        {listing?.parent && (
          <button
            type="button"
            className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"
            onClick={() => void browse(listing.parent ?? undefined)}
          >
            <ChevronLeftIcon size={12} /> Parent folder
          </button>
        )}
        {listing?.dirs.map((dir) => (
          <button
            key={dir}
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() =>
              void browse(`${listing.path.replace(/[\\/]$/, "")}/${dir}`)
            }
          >
            <FolderIcon size={14} className="shrink-0 text-slate-500" />
            <span className="truncate">{dir}</span>
          </button>
        ))}
        {listing && !listing.dirs.length && (
          <div className="px-3 py-2 text-sm text-slate-500">No subfolders</div>
        )}
      </div>
      {recent.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recent
          </div>
          {recent.map((f) => (
            <button
              key={f.path}
              type="button"
              title={f.path}
              data-testid={TID.openFolderRecent}
              data-recent-folder={f.path}
              disabled={busy}
              className="flex w-full min-w-0 items-baseline gap-2 rounded px-2 py-1 text-left hover:bg-slate-100"
              onClick={() => void open(f.path)}
            >
              <FolderLabel path={f.path} />
            </button>
          ))}
        </div>
      )}
    </ExplorerModalFrame>
  );
};
