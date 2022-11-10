import React, { useEffect, useState } from "react";
import { type IAceEditorProps } from "react-ace";

const LazyAceEditor = React.lazy(() => {
  const ace = import("react-ace");
  import("ace-builds/src-noconflict/mode-json");
  import("ace-builds/src-noconflict/mode-golang");
  import("ace-builds/src-noconflict/theme-github");
  return ace;
});

export const DynamicAceEditor: React.FC<IAceEditorProps> = (props) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (isClient) {
    return <LazyAceEditor {...props} />;
  } else {
    return null;
  }
};
