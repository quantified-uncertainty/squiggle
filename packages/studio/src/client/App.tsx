import { FC, useCallback, useEffect, useState } from "react";

import { Button, useToast } from "@quri/ui";

import { FileBanner } from "./components/FileBanner.js";
import { FileTabs } from "./components/FileTabs.js";
import { FileWorkspace } from "./components/FileWorkspace.js";
import { SquiggleIcon } from "./components/icons.js";
import { Sidebar } from "./components/Sidebar.js";
import { loadViewId, saveViewId } from "./lib/storage.js";
import { isDirty, useWorkspace } from "./lib/useWorkspace.js";
import { DEFAULT_VIEW_ID, getStudioViews } from "./views/index.js";

const params = new URLSearchParams(window.location.search);
const urlFile = params.get("file") ?? undefined;
const urlView = params.get("view") ?? undefined;
const embed = params.get("embed") === "1";
const urlVariable = params.get("variable") ?? undefined;
if (embed) document.documentElement.classList.add("studio-embed");

const EmptyState: FC = () => (
  <div className="grid h-full place-items-center">
    <div className="max-w-sm text-center">
      <SquiggleIcon size={40} className="mx-auto text-orange-400" />
      <h2 className="mt-3 text-base font-semibold text-slate-700">
        Open a file to get started
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Pick a <code>.squiggle</code> file from the sidebar. Changes made on
        disk (for example, by a coding agent) show up here automatically.
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
  const [viewId, setViewId] = useState(
    () => urlView ?? loadViewId() ?? DEFAULT_VIEW_ID
  );

  const activeFile = workspace.activePath
    ? workspace.files[workspace.activePath]
    : undefined;

  const selectView = (id: string) => {
    setViewId(id);
    saveViewId(id);
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
  useEffect(() => {
    if (!hasDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasDirty]);

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
        <FileTabs workspace={workspace} />
        {activeFile && (
          <FileBanner
            file={activeFile}
            onReload={() => workspace.reloadFromDisk(activeFile.path)}
            onKeepMine={() => workspace.keepMine(activeFile.path)}
            onSave={() => void save(activeFile.path)}
          />
        )}
        <div className="min-h-0 flex-1">{workspaceView ?? <EmptyState />}</div>
      </main>
    </div>
  );
};
