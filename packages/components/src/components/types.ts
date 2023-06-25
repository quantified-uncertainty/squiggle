import { SqProject } from "@quri/squiggle-lang";

export type SquiggleCodeProps = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
} & (
  | {
      project: SqProject;
      continues?: string[];
    }
  | object
);
