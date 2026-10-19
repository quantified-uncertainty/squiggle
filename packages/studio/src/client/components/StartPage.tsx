import { clsx } from "clsx";
import { FC, ReactNode, useMemo } from "react";

import { DocumentTextIcon, GlobeIcon, PlusIcon, SearchIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { runCommand, useCommandState } from "../commands/registry.js";
import { host } from "../lib/host.js";
import {
  isDirty,
  treeFilePaths,
  useWorkspaceContext,
} from "../lib/workspaceTypes.js";
import { FileIcon, FolderIcon, SquiggleIcon } from "./icons.js";
import { Kbd, primaryAriaKeyshortcuts, primaryKeyLabel } from "./Kbd.js";
import { ChangedDot, DirtyDot } from "./QuickPick.js";

const AGENTS_GUIDE =
  "https://github.com/quantified-uncertainty/squiggle/tree/main/packages/studio#for-agents";

// A text button that runs a command: like CommandButton (data-command,
// aria-keyshortcuts, the key in its tooltip, disabled while the command is)
// with the start page's own look.
const ActionButton: FC<{
  command: string;
  icon: ReactNode;
  primary?: boolean;
  children: ReactNode;
}> = ({ command, icon, primary = false, children }) => {
  const state = useCommandState(command);
  const label = primaryKeyLabel(command);
  return (
    <button
      type="button"
      data-command={command}
      data-primary={primary ? "1" : undefined}
      aria-keyshortcuts={primaryAriaKeyshortcuts(command)}
      title={label ? `${state.title} (${label})` : state.title}
      disabled={!state.enabled}
      className={clsx(
        "flex h-9 items-center gap-2 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-default",
        primary
          ? "bg-slate-800 font-medium text-white hover:bg-slate-700 disabled:bg-slate-300 disabled:text-slate-500"
          : "w-full border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:text-slate-400 disabled:hover:bg-white"
      )}
      onClick={() => runCommand(command, undefined, "button")}
    >
      <span className="shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 truncate">{children}</span>
      {!primary && label && (
        <Kbd command={command} className="ml-auto shrink-0" />
      )}
    </button>
  );
};

const Hint: FC<{ command: string; children: ReactNode }> = ({
  command,
  children,
}) =>
  primaryKeyLabel(command) ? (
    <span className="whitespace-nowrap">
      <Kbd command={command} className="text-slate-600" /> {children}
    </span>
  ) : null;

// Shown when no file is shown (§3.6): the folder, actions to create, open,
// import or find a file, recent files, and the keys that matter most. An
// empty folder says so and makes New File the primary action (#60).
export const StartPage: FC = () => {
  const workspace = useWorkspaceContext();
  const { rootInfo, mru, tree, treeLoaded, treeError, files, externalChanges } =
    workspace;
  const fileCount = useMemo(() => treeFilePaths(tree).length, [tree]);
  // A folder that failed to load isn't empty (the Explorer names the error).
  const empty = treeLoaded && treeError === undefined && fileCount === 0;
  const recent = mru.slice(0, 8);
  const allowOpenFolder = rootInfo?.allowOpenFolder ?? false;

  return (
    <div
      data-testid={TID.startPage}
      data-empty={empty ? "1" : undefined}
      className="h-full overflow-auto bg-slate-50"
    >
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <div className="flex items-center gap-3">
          <SquiggleIcon size={36} className="shrink-0 text-orange-500" />
          <div className="min-w-0">
            <h1
              className="truncate text-lg font-semibold text-slate-800"
              title={rootInfo?.root}
            >
              {rootInfo?.name ?? "Squiggle Studio"}
            </h1>
            <p className="text-sm text-slate-600">
              Studio shows this folder on disk. Edits save automatically, and
              files a coding agent changes show up as it works.
            </p>
          </div>
        </div>

        {empty && (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
            <p className="text-sm font-medium text-slate-800">
              This folder has no models yet.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Create a <code>.squiggle</code> file, or import a model from
              Squiggle Hub.
            </p>
            <div className="mt-4 flex justify-center">
              <ActionButton
                command="explorer.newFile"
                icon={<PlusIcon size={14} />}
                primary
              >
                New File
              </ActionButton>
            </div>
          </div>
        )}

        <h2 className="mb-2 mt-8 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          Start
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {!empty && (
            <ActionButton
              command="explorer.newFile"
              icon={<PlusIcon size={14} />}
            >
              New File…
            </ActionButton>
          )}
          {allowOpenFolder && (
            <ActionButton
              command="workbench.action.files.openFolder"
              icon={<FolderIcon size={14} />}
            >
              Open Folder…
            </ActionButton>
          )}
          <ActionButton
            command="squiggle.hub.import"
            icon={<GlobeIcon size={14} />}
          >
            Import from Squiggle Hub…
          </ActionButton>
          {!empty && (
            <ActionButton
              command="workbench.action.quickOpen"
              icon={<SearchIcon size={14} />}
            >
              Go to File…
            </ActionButton>
          )}
        </div>

        {recent.length > 0 && (
          <>
            <h2 className="mb-2 mt-8 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Recent files
            </h2>
            <ul
              aria-label="Recent files"
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              {recent.map((path) => {
                const slash = path.lastIndexOf("/");
                const name = path.slice(slash + 1);
                const folder = slash === -1 ? "" : path.slice(0, slash);
                const file = files[path];
                const changed = externalChanges[path]?.seen === false;
                const Icon = path.endsWith(".squiggle")
                  ? SquiggleIcon
                  : path.endsWith(".md")
                    ? DocumentTextIcon
                    : FileIcon;
                return (
                  <li
                    key={path}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <button
                      type="button"
                      data-path={path}
                      title={path}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300"
                      onClick={() =>
                        workspace.openFile(path, { reason: "start" })
                      }
                    >
                      <Icon
                        size={14}
                        className={clsx(
                          "shrink-0",
                          path.endsWith(".squiggle")
                            ? "text-orange-500"
                            : "text-slate-500"
                        )}
                      />
                      <span className="min-w-0 shrink-0 truncate font-medium">
                        {name}
                      </span>
                      {folder && (
                        <span className="min-w-0 truncate text-xs text-slate-500">
                          {folder}
                        </span>
                      )}
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        {file && isDirty(file) && <DirtyDot />}
                        {changed && <ChangedDot />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
          <Hint command="workbench.action.quickOpen">Go to file</Hint>
          <Hint command="workbench.action.showCommands">All commands</Hint>
          <Hint command="workbench.view.explorer">then ↑↓ Explorer</Hint>
          <Hint command="squiggle.toggleCodePane">Code pane</Hint>
          <Hint command="workbench.action.openGlobalKeybindings">
            Shortcuts
          </Hint>
        </div>
        <p className="mt-4 text-xs">
          <a
            href={AGENTS_GUIDE}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            Using Studio with a coding agent
          </a>
        </p>
      </div>
    </div>
  );
};
