import _ from "lodash";
import React, { FC } from "react";

import { DynamicAceEditor } from "./DynamicAceEditor";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  oneLine?: boolean;
  width?: number;
  height: number;
  showGutter?: boolean;
}

export const JsonEditor: FC<CodeEditorProps> = ({
  value,
  onChange,
  oneLine = false,
  showGutter = false,
  height,
}) => {
  const lineCount = value.split("\n").length;
  const id = _.uniqueId();
  return (
    <DynamicAceEditor
      value={value}
      mode="json"
      theme="github"
      width={"100%"}
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
    />
  );
};
