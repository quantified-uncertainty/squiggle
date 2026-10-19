import { FC, ReactNode, useEffect, useMemo, useState } from "react";

import { useSimulator } from "@quri/squiggle-components";
import { RefreshIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import type { ViewState } from "../../shared/viewState.js";
import { useReportBusy } from "../lib/idle.js";
import { makeStudioLinker } from "../lib/linker.js";
import { updateViewState } from "../lib/navigation.js";
import { useLayout } from "../lib/stores/layout.js";
import type { OpenFile, Workspace } from "../lib/workspaceTypes.js";
import type {
  StudioRunOutput,
  StudioView,
  StudioViewContext,
} from "../views/types.js";
import { CodePane } from "./CodePane.js";
import { EditorHeader } from "./EditorHeader.js";

export type FileWorkspaceProps = {
  file: OpenFile;
  workspace: Workspace;
  views: readonly StudioView[];
  embed: boolean;
  initial?: ViewState; // URL initial state for this file (authoritative in embed)
  banner?: ReactNode; // FileBanner, rendered under the editor header
};

// WP0 stub (owned by WP5): the HEAD workspace with the v2 props. The editor
// header replaces the tab bar's toolbar portal; the URL is initial state only
// (#17): outside embed mode the file's chosen view wins once the user picks
// one, and `?variable=` filters Output only in embed mode.

const Shell: FC<{
  header: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}> = ({ header, banner, children }) => (
  <div className="flex h-full min-h-0 flex-col">
    {header}
    {banner}
    <div className="min-h-0 flex-1">{children}</div>
  </div>
);

// Runs the file (for the Output view and any registered views) and renders the
// active view. Remounted (via `key`) when the file's imports change on disk,
// which resets the SqProject's module cache (WP5 replaces this with RunHost,
// #10).
const SquiggleFileWorkspace: FC<FileWorkspaceProps> = ({
  file,
  workspace,
  views,
  embed,
  initial,
  banner,
}) => {
  const [codePane, setCodePane] = useLayout("codePane");
  const { recordDependency } = workspace;
  const [linker] = useState(() =>
    makeStudioLinker((dep) => recordDependency(file.path, dep))
  );

  const { simulation, project } = useSimulator({
    code: file.buffer,
    sourceId: file.path,
    setup: { type: "projectFromLinker", linker },
  });
  useReportBusy(`run:${file.path}`, !simulation || simulation.isStale);

  const runOutput: StudioRunOutput | undefined = useMemo(
    () =>
      simulation
        ? {
            sourceId: file.path,
            output: simulation.output,
            project,
            isStale: simulation.isStale,
            executionId: simulation.executionId,
            simulation,
          }
        : undefined,
    [simulation, project, file.path]
  );

  const viewId = embed
    ? (initial?.view ?? "output")
    : (workspace.viewIds[file.path] ?? initial?.view);

  const availableViews = views.filter((v) =>
    v.isAvailable({ filePath: file.path, runOutput })
  );
  const activeView =
    availableViews.find((v) => v.id === viewId) ??
    // In embed mode (`render`), fall back to the Output view, which reports
    // errors, rather than to the editor.
    (embed ? availableViews.find((v) => v.id === "output") : undefined) ??
    // Without a choice, files with a relative values spec open on their
    // dashboard.
    (viewId === undefined
      ? availableViews.find((v) => v.id === "relative-values")
      : undefined) ??
    availableViews[0];

  // The address bar mirrors the shown view (replaceState).
  useEffect(() => {
    if (!embed && activeView) updateViewState({ view: activeView.id });
  }, [embed, activeView]);

  const context: StudioViewContext = {
    filePath: file.path,
    code: file.buffer,
    runOutput,
    linker,
    editorKey: `${file.path}:${file.editorEpoch}:${file.externalRevision}`,
    setCode: (code) => workspace.setBuffer(file.path, code),
    openFile: (path) => workspace.openFile(path, { reason: "link" }),
    embed,
    initial,
    variable: embed ? initial?.variable : undefined,
    revealInCode: () => undefined, // WP5
    registerReveal: () => () => undefined, // WP5
  };

  if (embed) {
    return <div>{activeView?.render(context)}</div>;
  }

  // Views that bring their own editor (the playground) don't get the pane.
  const canShowCode = activeView !== undefined && !activeView.hasOwnEditor;
  const showCode = canShowCode && codePane.open;

  return (
    <Shell
      banner={banner}
      header={
        <EditorHeader
          file={file}
          views={{
            available: availableViews,
            activeId: activeView?.id ?? "",
            onSelect: (id) => workspace.selectView(file.path, id),
          }}
          toolbar={activeView?.renderToolbar?.(context)}
          codePane={
            canShowCode
              ? {
                  open: codePane.open,
                  onToggle: () =>
                    setCodePane({ ...codePane, open: !codePane.open }),
                }
              : undefined
          }
        />
      }
    >
      <div className="h-full min-h-0">
        {showCode ? (
          <CodePane
            editorKey={context.editorKey}
            code={file.buffer}
            setCode={context.setCode}
            sourceId={file.path}
            project={project}
            simulation={simulation}
            fraction={codePane.fraction}
            onResize={(fraction) => setCodePane({ ...codePane, fraction })}
          >
            {activeView?.render(context)}
          </CodePane>
        ) : (
          <div className="h-full min-h-0" data-studio-region="view">
            {activeView?.render(context)}
          </div>
        )}
      </div>
    </Shell>
  );
};

// Plain text editor for .json / .md files. Keyed by path, so switching
// between two text files never shows the previous file's text (#1).
const TextFileWorkspace: FC<FileWorkspaceProps> = ({
  file,
  workspace,
  banner,
}) => (
  <Shell banner={banner} header={<EditorHeader file={file} />}>
    <div className="flex h-full min-h-0 flex-col" data-studio-region="editor">
      <textarea
        key={`${file.path}:${file.editorEpoch}:${file.externalRevision}`}
        data-testid={TID.textEditor}
        aria-label={`Contents of ${file.path}`}
        className="min-h-0 flex-1 resize-none border-0 p-4 font-mono text-sm text-slate-800 focus:ring-0"
        spellCheck={false}
        defaultValue={file.buffer}
        onChange={(e) => workspace.setBuffer(file.path, e.target.value)}
      />
    </div>
  </Shell>
);

export const FileWorkspace: FC<FileWorkspaceProps> = (props) => {
  const { file, embed, banner } = props;
  if (file.status === "loading") {
    return (
      <Shell
        banner={banner}
        header={embed ? null : <EditorHeader file={file} />}
      >
        <div className="grid h-full place-items-center">
          <RefreshIcon className="animate-spin text-slate-400" size={20} />
        </div>
      </Shell>
    );
  }
  if (file.status === "error") {
    return (
      <Shell
        banner={banner}
        header={embed ? null : <EditorHeader file={file} />}
      >
        <div className="p-6 text-sm text-red-700" data-studio-error="">
          Couldn&apos;t open {file.path}: {file.error}
        </div>
      </Shell>
    );
  }
  if (!file.path.endsWith(".squiggle")) {
    return <TextFileWorkspace {...props} />;
  }
  return (
    <SquiggleFileWorkspace key={`${file.path}:${file.runEpoch}`} {...props} />
  );
};
