import { environment, SqProject, SqValue } from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";
import { JsImports, jsImportsToSquiggleCode } from "../jsImports";

type SquiggleArgs = {
  code?: string;
  executionId?: number;
  jsImports?: JsImports;
  environment?: environment;
  project: SqProject;
  sourceName: string;
  includes: string[];
  onChange?: (expr: SqValue | undefined) => void;
};

export const useSquiggle = (args: SquiggleArgs) => {
  const result = useMemo(
    () => {
      const project = args.project;
      let code = project.getSource(args.sourceName);
      if (args.code) {
        code = args.code;
      }
      project.setSource(args.sourceName, code ?? "");
      let includes = args.includes;
      if (args.environment) {
        project.setEnvironment(args.environment);
      }
      if (args.jsImports && Object.keys(args.jsImports).length) {
        const importsSource = jsImportsToSquiggleCode(args.jsImports);
        project.setSource("imports", importsSource);
        includes.push("imports");
      }
      project.setContinues(args.sourceName, includes);
      project.run(args.sourceName);
      const result = project.getResult(args.sourceName);
      const bindings = project.getBindings(args.sourceName);
      return { result, bindings };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.code, args.environment, args.jsImports, args.executionId]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(result.result.tag === "Ok" ? result.result.value : undefined);
  }, [result, onChange]);

  return result;
};
