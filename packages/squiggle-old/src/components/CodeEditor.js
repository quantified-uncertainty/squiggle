import React from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/keybinding-vim";

function onChange(newValue) {
  console.log("change", newValue);
}

export function CodeEditor(props) {
  return (
    <AceEditor
      value={props.value}
      mode="golang"
      height="400px"
      width="100%"
      theme="github"
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
}
