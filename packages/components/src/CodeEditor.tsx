import React, { FC } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/keybinding-vim";

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
}: CodeEditorProps) => (
  <AceEditor
    value={value}
    mode="golang"
    theme="github"
    width={width + "px"}
    maxLines={oneLine ? 1 : 15}
    minLines={oneLine ? 1 : 15}
    showGutter={false}
    highlightActiveLine={false}
    showPrintMargin={false}
    onChange={onChange}
    name="UNIQUE_ID_OF_DIV"
    editorProps={{
      $blockScrolling: true,
    }}
    setOptions={{
      enableBasicAutocompletion: false,
      enableLiveAutocompletion: true,
    }}
  />
);
export default CodeEditor;
