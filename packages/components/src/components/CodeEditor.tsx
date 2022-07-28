import _ from "lodash";
import React, { FC, useMemo, useRef } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/theme-github";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  oneLine?: boolean;
  width?: number;
  height: number;
  showGutter?: boolean;
}

export const CodeEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  onSubmit,
  oneLine = false,
  showGutter = false,
  height,
}) => {
  const lineCount = value.split("\n").length;
  const id = useMemo(() => _.uniqueId(), []);

  // this is necessary because AceEditor binds commands on mount, see https://github.com/securingsincity/react-ace/issues/684
  const onSubmitRef = useRef<typeof onSubmit | null>(null);
  onSubmitRef.current = onSubmit;

  return (
    <AceEditor
      value={value}
      mode="golang"
      theme="github"
      width="100%"
      fontSize={14}
      height={String(height) + "px"}
      minLines={oneLine ? lineCount : undefined}
      maxLines={oneLine ? lineCount : undefined}
      showGutter={showGutter}
      highlightActiveLine={false}
      showPrintMargin={false}
      onChange={onChange}
      name={id}
      editorProps={{
        $blockScrolling: true,
      }}
      setOptions={{
        enableBasicAutocompletion: false,
        enableLiveAutocompletion: false,
      }}
      commands={[
        {
          name: "submit",
          bindKey: { mac: "Cmd-Enter", win: "Ctrl-Enter" },
          exec: () => onSubmitRef.current?.(),
        },
      ]}
    />
  );
};
