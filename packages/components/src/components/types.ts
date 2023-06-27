import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
} from "../lib/hooks/useSquiggle.js";

// common props for SquigglePlayground and SquiggleEditor
export type SquiggleCodeProps = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
} & (StandaloneExecutionProps | ProjectExecutionProps);
