import { FC, useCallback, useEffect, useState } from "react";

import {
  Button,
  ChevronLeftIcon,
  Modal,
  StyledInput,
  useToast,
} from "@quri/ui";

import type { BrowseResponse, RecentFolder } from "../../shared/api.js";
import { api } from "../lib/api.js";
import { FolderIcon } from "./icons.js";

type Props = {
  currentRoot: string;
  recentFolders: RecentFolder[];
  onOpen: (path: string) => Promise<void>;
  close: () => void;
};

export const OpenFolderModal: FC<Props> = ({
  currentRoot,
  recentFolders,
  onOpen,
  close,
}) => {
  const toast = useToast();
  const [listing, setListing] = useState<BrowseResponse | undefined>();
  const [input, setInput] = useState(currentRoot);

  const browse = useCallback(
    async (path?: string) => {
      try {
        const result = await api.browse(path);
        setListing(result);
        setInput(result.path);
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      }
    },
    [toast]
  );

  useEffect(() => {
    void browse(currentRoot);
  }, [browse, currentRoot]);

  const open = async (path: string) => {
    try {
      await onOpen(path);
      close();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    }
  };

  return (
    <Modal close={close}>
      <Modal.Header>Open folder</Modal.Header>
      <Modal.Body>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void browse(input);
          }}
        >
          <div className="flex-1">
            <StyledInput
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="/path/to/folder"
            />
          </div>
          <Button type="submit" size="medium">
            Go
          </Button>
        </form>
        <div className="mt-3 h-64 overflow-auto rounded-md border border-slate-200">
          {listing?.parent && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-50"
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
              <FolderIcon size={14} className="text-slate-400" />
              {dir}
            </button>
          ))}
          {listing && !listing.dirs.length && (
            <div className="px-3 py-2 text-sm text-slate-400">
              No subfolders
            </div>
          )}
        </div>
        {recentFolders.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent
            </div>
            {recentFolders.slice(0, 6).map((f) => (
              <button
                key={f.path}
                type="button"
                className="block w-full truncate rounded px-2 py-1 text-left text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => void open(f.path)}
              >
                {f.path}
              </button>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-end gap-2">
          <Button onClick={close}>Cancel</Button>
          <Button
            theme="primary"
            disabled={!listing}
            onClick={() => listing && void open(listing.path)}
          >
            Open this folder
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
