import { FC, useCallback, useEffect, useRef, useState } from "react";

import { Button, useToast } from "@quri/ui";

import { FileBanner } from "./components/FileBanner.js";
import { FileTabs } from "./components/FileTabs.js";
import { FileWorkspace } from "./components/FileWorkspace.js";
import { SquiggleIcon } from "./components/icons.js";
import { Sidebar } from "./components/Sidebar.js";
import { loadViewIds, saveViewIds } from "./lib/storage.js";
import { isDirty, useWorkspace } from "./lib/useWorkspace.js";
import { getStudioViews } from "./views/index.js";

const params = new URLSearchParams(window.location.search);
const urlFile = params.get("file") ?? undefined;
const urlView = params.get("view") ?? undefined;
const embed = params.get("embed") === "1";
const urlVariable = params.get("variable") ?? undefined;
if (embed) document.documentElement.classList.add("studio-embed");

declare global {
  interface Window {
    // Used by the Electron shell to check for unsaved edits before switching
    // folders (see packages/studio-electron).
    squiggleStudio?: {
      hasUnsavedChanges: () => boolean;
      discardChanges: () => void;
    };
  }
}

const EmptyState: FC<{
  recentFiles: string[];
  onOpen: (path: string) => void;
}> = ({ recentFiles, onOpen }) => (
  <div className="grid h-full place-items-center bg-slate-50">
    <div className="w-full max-w-md px-6">
      <div className="text-center">
        <SquiggleIcon size={40} className="mx-auto text-orange-400" />
        <h2 className="mt-3 text-base font-semibold text-slate-700">
          Open a file to get started
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick a <code>.squiggle</code> file from the sidebar. Changes made on
          disk, for example by a coding agent, show up here automatically.
        </p>
      </div>
      {recentFiles.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Recent files
          </div>
          <ul>
            {recentFiles.slice(0, 6).map((p) => (
              <li key={p}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => onOpen(p)}
                >
                  <SquiggleIcon
                    size={14}
                    className="shrink-0 text-orange-500"
                  />
                  <span className="truncate">{p}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-400">
        Tip: turn on <span className="font-medium">Follow changes</span> in the
        sidebar to open files as your agent edits them.
      </p>
    </div>
  </div>
);

export const App: FC = () => {
  const toast = useToast();
  const onError = useCallback(
    (message: string) => toast(message, "error"),
    [toast]
  );
  const workspace = useWorkspace({ onError, initialFile: urlFile });
  const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null);
  const activeFile = workspace.activePath
    ? workspace.files[workspace.activePath]
    : undefined;

  // Chosen view per file; files without a choice get a default that depends
  // on their content (see FileWorkspace).
  const root = workspace.rootInfo?.root;
  const [viewIds, setViewIds] = useState<Record<string, string>>({});
  useEffect(() => {
    if (root) setViewIds(loadViewIds(root));
  }, [root]);
  const viewId =
    urlView ??
    (workspace.activePath ? viewIds[workspace.activePath] : undefined);

  const selectView = (id: string) => {
    if (!workspace.activePath || !root) return;
    const next = { ...viewIds, [workspace.activePath]: id };
    setViewIds(next);
    saveViewIds(root, next);
  };

  const { saveFile } = workspace;
  const save = useCallback(
    async (path: string) => {
      try {
        await saveFile(path);
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      }
    },
    [saveFile, toast]
  );

  // Cmd/Ctrl+S saves the active file. Capture phase, so it wins over editors.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();
        if (workspace.activePath) void save(workspace.activePath);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [save, workspace.activePath]);

  // Warn before closing the tab with unsaved edits.
  const hasDirty = Object.values(workspace.files).some(isDirty);
  const hasDirtyRef = useRef(hasDirty);
  hasDirtyRef.current = hasDirty;
  // Set when the user already agreed to discard edits (e.g. in Electron's
  // dialog), so that the page doesn't ask a second time.
  const discardingRef = useRef(false);
  useEffect(() => {
    if (!hasDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (!discardingRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasDirty]);

  useEffect(() => {
    window.squiggleStudio = {
      hasUnsavedChanges: () => hasDirtyRef.current,
      discardChanges: () => {
        discardingRef.current = true;
      },
    };
    return () => {
      delete window.squiggleStudio;
    };
  }, []);

  useEffect(() => {
    const name = workspace.rootInfo?.name;
    const file = workspace.activePath;
    document.title = [file, name, "Squiggle Studio"]
      .filter(Boolean)
      .join(" — ");
  }, [workspace.rootInfo, workspace.activePath]);

  const workspaceView = activeFile ? (
    <FileWorkspace
      file={activeFile}
      views={getStudioViews()}
      viewId={embed ? (urlView ?? "output") : viewId}
      onSelectView={selectView}
      setBuffer={workspace.setBuffer}
      openFile={workspace.openFile}
      recordDependency={workspace.recordDependency}
      embed={embed}
      variable={urlVariable}
      toolbarTarget={toolbarEl}
      toolbarRight={
        isDirty(activeFile) ? (
          <Button size="small" onClick={() => void save(activeFile.path)}>
            Save
          </Button>
        ) : (
          <span className="text-xs text-slate-400">Saved</span>
        )
      }
    />
  ) : null;

  if (embed) {
    return <div className="bg-white">{workspaceView}</div>;
  }

  return (
    <div className="flex h-full">
      <Sidebar workspace={workspace} />
      <main className="flex min-w-0 flex-1 flex-col">
        {workspace.rootChangedTo && (
          <div
            role="alert"
            className="flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
          >
            <span className="flex-1">
              Another window switched Studio to{" "}
              <strong className="font-semibold">
                {workspace.rootChangedTo}
              </strong>
              . Unsaved edits here can no longer be saved; copy anything you
              need first.
            </span>
            <Button
              size="small"
              onClick={() => void workspace.followRootChange()}
            >
              Discard edits and switch
            </Button>
          </div>
        )}
        <FileTabs workspace={workspace} toolbarRef={setToolbarEl} />
        {activeFile && (
          <FileBanner
            file={activeFile}
            onReload={() => workspace.reloadFromDisk(activeFile.path)}
            onKeepMine={() => workspace.keepMine(activeFile.path)}
            onSave={() => void save(activeFile.path)}
          />
        )}
        <div className="min-h-0 flex-1">
          {workspaceView ?? (
            <EmptyState
              recentFiles={workspace.recentFiles}
              onOpen={workspace.openFile}
            />
          )}
        </div>
      </main>
    </div>
  );
};
