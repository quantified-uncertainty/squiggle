import { environment, SqProject, SqValue } from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";
import { JsImports, jsImportsToSquiggleCode } from "../jsImports";

type SquiggleArgs = {
  code: string;
  executionId?: number;
  jsImports?: JsImports;
  environment?: environment;
  onChange?: (expr: SqValue | undefined) => void;
};

export const useSquiggle = (args: SquiggleArgs) => {
  const result = useMemo(
    () => {
      const project = SqProject.create();
      project.setSource("main", args.code);
      if (args.environment) {
        project.setEnvironment(args.environment);
      }
      if (args.jsImports && Object.keys(args.jsImports).length) {
        const importsSource = jsImportsToSquiggleCode(args.jsImports);
        project.setSource("imports", importsSource);
        project.setContinues("main", ["imports"]);
      }
      project.run("main");
      const result = project.getResult("main");
      const bindings = project.getBindings("main");
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
