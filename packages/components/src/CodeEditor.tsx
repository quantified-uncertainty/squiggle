import React, { FC } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/keybinding-vim";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  oneLine: boolean;
  width?: number;
}

export let CodeEditor: FC<CodeEditorProps> = (props) => (
  <AceEditor
    value={props.value}
    mode="golang"
    theme="github"
    width={props.width ? props.width + "px" : "500px"}
    height={props.oneLine ? "1.2em" : "500px"}
    showGutter={false}
    highlightActiveLine={false}
    showPrintMargin={false}
    onChange={props.onChange}
    name="UNIQUE_ID_OF_DIV"
    editorProps={{
      $blockScrolling: true,
    }}
    setOptions={{
      enableBasicAutocompletion: false,
      enableLiveAutocompletion: true,
      enableSnippets: true,
    }}
  />
);
export default CodeEditor;
