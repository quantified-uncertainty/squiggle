import { FC, useMemo, useState } from "react";

import { useSimulator } from "@quri/squiggle-components";
import { RefreshIcon } from "@quri/ui";

import { makeStudioLinker } from "../lib/linker.js";
import type { OpenFile } from "../lib/useWorkspace.js";
import type {
  StudioRunOutput,
  StudioView,
  StudioViewContext,
} from "../views/types.js";
import { ViewTabs } from "./ViewTabs.js";

type Props = {
  file: OpenFile;
  views: readonly StudioView[];
  viewId: string;
  onSelectView: (id: string) => void;
  setBuffer: (path: string, code: string) => void;
  openFile: (path: string) => void;
  recordDependency: (file: string, dep: string) => void;
  embed: boolean;
  variable?: string;
  toolbarRight?: React.ReactNode;
};

// Runs the file (for the Output view and any registered views) and renders the
// view bar plus the active view. Remounted (via `key`) when the file's imports
// change on disk, which resets the SqProject's module cache.
const SquiggleFileWorkspace: FC<Props> = ({
  file,
  views,
  viewId,
  onSelectView,
  setBuffer,
  openFile,
  recordDependency,
  embed,
  variable,
  toolbarRight,
}) => {
  const [linker] = useState(() =>
    makeStudioLinker((dep) => recordDependency(file.path, dep))
  );

  const { simulation, project } = useSimulator({
    code: file.buffer,
    sourceId: file.path,
    setup: { type: "projectFromLinker", linker },
  });

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

  const availableViews = views.filter((v) =>
    v.isAvailable({ filePath: file.path, runOutput })
  );
  const activeView =
    availableViews.find((v) => v.id === viewId) ?? availableViews[0];

  const context: StudioViewContext = {
    filePath: file.path,
    code: file.buffer,
    runOutput,
    linker,
    editorKey: `${file.path}:${file.editorEpoch}`,
    setCode: (code) => setBuffer(file.path, code),
    openFile,
    embed,
    variable,
  };

  if (embed) {
    return <div>{activeView?.render(context)}</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-3 py-1.5">
        <span className="truncate text-xs text-slate-500" title={file.path}>
          {file.path}
        </span>
        <div className="ml-auto flex items-center gap-3">
          {toolbarRight}
          <ViewTabs
            views={availableViews}
            activeId={activeView?.id ?? ""}
            onSelect={onSelectView}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1">{activeView?.render(context)}</div>
    </div>
  );
};

// Plain text editor for .json / .md files.
const TextFileWorkspace: FC<Props> = ({ file, setBuffer, toolbarRight }) => (
  <div className="flex h-full min-h-0 flex-col">
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-3 py-1.5">
      <span className="truncate text-xs text-slate-500">{file.path}</span>
      <div className="ml-auto flex items-center gap-3">{toolbarRight}</div>
    </div>
    <textarea
      key={file.editorEpoch}
      className="min-h-0 flex-1 resize-none border-0 p-4 font-mono text-sm text-slate-800 focus:ring-0"
      spellCheck={false}
      defaultValue={file.buffer}
      onChange={(e) => setBuffer(file.path, e.target.value)}
    />
  </div>
);

export const FileWorkspace: FC<Props> = (props) => {
  const { file } = props;
  if (file.status === "loading") {
    return (
      <div className="grid h-full place-items-center">
        <RefreshIcon className="animate-spin text-slate-400" size={20} />
      </div>
    );
  }
  if (file.status === "error") {
    return (
      <div className="p-6 text-sm text-red-700">
        Couldn&apos;t open {file.path}: {file.error}
      </div>
    );
  }
  if (!file.path.endsWith(".squiggle")) {
    return <TextFileWorkspace {...props} />;
  }
  return (
    <SquiggleFileWorkspace key={`${file.path}:${file.runEpoch}`} {...props} />
  );
};
