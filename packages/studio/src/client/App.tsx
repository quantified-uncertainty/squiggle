import { FC, useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@quri/ui";

import {
  initialStateFor,
  urlFlagsFromSearch,
  viewStateFromSearch,
} from "../shared/viewState.js";
import { AgentCommands } from "./commands/AgentCommands.js";
import { ChordIndicator } from "./commands/ChordIndicator.js";
import { CoreCommands } from "./commands/CoreCommands.js";
import { EditorCommands } from "./commands/EditorCommands.js";
import { ExplorerCommands } from "./commands/ExplorerCommands.js";
import { OverlayHost } from "./commands/OverlayHost.js";
import { ShellCommands } from "./commands/ShellCommands.js";
import { WorkspaceCommands } from "./commands/WorkspaceCommands.js";
import { AppHeader } from "./components/AppHeader.js";
import { Explorer } from "./components/Explorer.js";
import { FileBanner } from "./components/FileBanner.js";
import { FileWorkspace } from "./components/FileWorkspace.js";
import { RootBanner } from "./components/RootBanner.js";
import { StartPage } from "./components/StartPage.js";
import { StatusBar } from "./components/StatusBar.js";
import { installAgentHooks } from "./lib/agentHooks.js";
import { installIdleTracking } from "./lib/idle.js";
import { useLayout } from "./lib/stores/layout.js";
import { useWorkspace } from "./lib/useWorkspace.js";
import {
  isDirty,
  type Workspace,
  WorkspaceContext,
} from "./lib/workspaceTypes.js";
import { getStudioViews } from "./views/index.js";

// URL parameters are initial state only (#17): they pick the initial file and
// its view, spec and tab; from then on the address bar mirrors the current
// view (navigation.ts). In embed mode (`render`) they stay authoritative.
const initialView = viewStateFromSearch(window.location.search);
const flags = urlFlagsFromSearch(window.location.search);
const embed = flags.embed === "1";
if (embed) document.documentElement.classList.add("studio-embed");
// Deterministic screenshots: no transitions or animations; the command log.
if (flags.test === "1") document.documentElement.classList.add("studio-test");
installIdleTracking();

// Unsaved edits block closing the tab, and window.squiggleStudio reports them
// (the Electron shell asks before switching folders).
function useUnloadGuardAndAgentHooks(workspace: Workspace) {
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  // Set when the user already agreed to discard edits (e.g. in Electron's
  // dialog), so that the page doesn't ask a second time.
  const discardingRef = useRef(false);
  const hasDirty = Object.values(workspace.files).some(isDirty);

  useEffect(() => {
    if (!hasDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (!discardingRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasDirty]);

  useEffect(
    () =>
      installAgentHooks(
        {
          root: () => workspaceRef.current.rootInfo?.root,
          dirtyFiles: () =>
            Object.values(workspaceRef.current.files)
              .filter(isDirty)
              .map((f) => f.path),
          conflicts: () =>
            Object.values(workspaceRef.current.files)
              .filter((f) => f.conflict !== undefined)
              .map((f) => f.path),
          connected: () => workspaceRef.current.connection === "live",
          flush: () => workspaceRef.current.flushAll(),
        },
        () => {
          discardingRef.current = true;
        }
      ),
    []
  );
}

// Outside embed mode the URL's view becomes the ?file= file's chosen view
// once, and the rest of its initial state (tab, spec, layout, …) is passed to
// that file's workspace until the user moves to another file. Returns true
// from then on.
function useInitialViewOnce(workspace: Workspace): boolean {
  const [done, setDone] = useState(embed || initialView.file === undefined);
  const shownRef = useRef(false);
  const { activePath, selectView } = workspace;
  useEffect(() => {
    if (done) return;
    if (activePath === initialView.file) {
      if (!shownRef.current && initialView.file && initialView.view) {
        selectView(initialView.file, initialView.view);
      }
      shownRef.current = true;
    } else if (activePath !== null && shownRef.current) {
      setDone(true);
    }
  }, [activePath, done, selectView]);
  return done && !embed;
}

export const App: FC = () => {
  const toast = useToast();
  const onError = useCallback(
    (message: string) => toast(message, "error"),
    [toast]
  );
  const workspace = useWorkspace({ onError, initialFile: initialView.file });
  const [sidebarVisible] = useLayout("sidebarVisible");
  const [statusBarVisible] = useLayout("statusBarVisible");
  useUnloadGuardAndAgentHooks(workspace);
  const initialDone = useInitialViewOnce(workspace);

  const activeFile = workspace.activePath
    ? workspace.files[workspace.activePath]
    : undefined;

  useEffect(() => {
    const name = workspace.rootInfo?.name;
    const file = workspace.activePath;
    document.title = [file, name, "Squiggle Studio"]
      .filter(Boolean)
      .join(" — ");
  }, [workspace.rootInfo, workspace.activePath]);

  const save = async (path: string) => {
    try {
      await workspace.saveFile(path);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    }
  };

  const fileWorkspace = activeFile ? (
    <FileWorkspace
      // A new file is a new workspace (its own run, view state and editor).
      key={activeFile.path}
      file={activeFile}
      workspace={workspace}
      views={getStudioViews()}
      embed={embed}
      initial={
        initialDone ? undefined : initialStateFor(activeFile.path, initialView)
      }
      banner={
        embed ? undefined : (
          <FileBanner
            file={activeFile}
            onReload={() => void workspace.reloadFromDisk(activeFile.path)}
            onKeepMine={() => void workspace.overwriteWithMine(activeFile.path)}
            onSave={() => void save(activeFile.path)}
          />
        )
      }
    />
  ) : null;

  if (embed) {
    return (
      <WorkspaceContext.Provider value={workspace}>
        <div className="studio-app bg-white">{fileWorkspace}</div>
      </WorkspaceContext.Provider>
    );
  }

  return (
    <WorkspaceContext.Provider value={workspace}>
      <div className="studio-app flex h-full flex-col">
        <AppHeader />
        <RootBanner />
        <div className="flex min-h-0 flex-1">
          {sidebarVisible && <Explorer />}
          <main className="flex min-w-0 flex-1 flex-col">
            {fileWorkspace ?? <StartPage />}
          </main>
        </div>
        {statusBarVisible && <StatusBar />}
        <WorkspaceCommands />
        <ExplorerCommands />
        <EditorCommands />
        <ShellCommands />
        <AgentCommands />
        <OverlayHost />
        <CoreCommands />
        <ChordIndicator />
      </div>
    </WorkspaceContext.Provider>
  );
};
