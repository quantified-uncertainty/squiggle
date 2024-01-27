import { FC, useMemo, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
  useSquiggleRunner,
} from "../lib/hooks/useSquiggleRunner.js";
import { getSquiggleOutputErrors } from "../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "./CodeEditor/index.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { SquiggleOutputViewer } from "./SquiggleOutputViewer/index.js";

export type SquiggleEditorProps = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
  editorFontSize?: number;
  settings?: Omit<PartialPlaygroundSettings, "environment">;
  // environment comes from SquiggleCodeProps
} & (StandaloneExecutionProps | ProjectExecutionProps);

export const SquiggleEditor: FC<SquiggleEditorProps> = ({
  defaultCode: propsDefaultCode,
  onCodeChange,
  project: propsProject,
  continues,
  environment,
  editorFontSize,
  settings,
}) => {
  const { code, setCode, defaultCode } = useUncontrolledCode({
    defaultCode: propsDefaultCode,
    onCodeChange,
  });

  const {
    squiggleOutput,
    viewerTab,
    setViewerTab,
    project,
    sourceId,
    rerunSquiggleCode,
  } = useSquiggleRunner({
    code,
    setup: propsProject
      ? { type: "project", project: propsProject, continues }
      : { type: "standalone", environment },
  });

  const errors = useMemo(
    () => getSquiggleOutputErrors(squiggleOutput),
    [squiggleOutput]
  );

  const editorRef = useRef<CodeEditorHandle>(null);

  return (
    <div>
      <div
        className="border border-slate-300 bg-slate-50 rounded-sm p-2"
        data-testid="squiggle-editor"
      >
        <CodeEditor
          defaultValue={defaultCode ?? ""}
          onChange={setCode}
          fontSize={editorFontSize}
          showGutter={false}
          errors={errors}
          project={project}
          sourceId={sourceId}
          ref={editorRef}
          onSubmit={rerunSquiggleCode}
        />
      </div>
      {!squiggleOutput ? null : (
        <SquiggleOutputViewer
          squiggleOutput={squiggleOutput}
          editor={editorRef.current ?? undefined}
          environment={environment}
          viewerTab={viewerTab}
          setViewerTab={setViewerTab}
          {...settings}
        />
      )}
    </div>
  );
};
