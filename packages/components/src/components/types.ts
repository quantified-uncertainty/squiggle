import { SqProject } from "@quri/squiggle-lang";

export type SquiggleCodeProps = (
  | {
      code: string;
      defaultCode?: undefined;
      onCodeChange?: undefined; // not compatible with `code`
    }
  | {
      defaultCode?: string;
      code?: undefined;
      onCodeChange?(expr: string): void;
    }
) &
  (
    | {
        project: SqProject;
        continues?: string[];
      }
    | object
  );
