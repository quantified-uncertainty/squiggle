import _ from "lodash";
import React, { FC } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/theme-github";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  oneLine?: boolean;
  width?: number;
}

export let CodeEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  oneLine = false,
  width = 500,
}: CodeEditorProps) => {
  let lineCount = value.split("\n").length;
  let id = _.uniqueId();
  return (
    <AceEditor
      value={value}
      mode="golang"
      theme="github"
      width={width + "px"}
      minLines={oneLine ? lineCount : 15}
      maxLines={oneLine ? lineCount : 15}
      showGutter={false}
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
    />
  );
};
export default CodeEditor;
