import { environment, SqProject, SqValue } from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";

export type jsImports =
  | number
  | string
  | jsImports[]
  | {
      [k: string]: jsImports;
    };

type SquiggleArgs = {
  code: string;
  executionId?: number;
  jsImports?: jsImports;
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
      if (args.jsImports) {
        console.log(JSON.stringify(args.jsImports));
        project.setSource(
          "zzz", // due to bug in topology implementation, can be renamed later
          "imports = " + JSON.stringify(args.jsImports)
        );
      }
      project.run("main");
      const result = project.getResult("main");
      const bindings = project.getBindings("main");
      return { result, bindings };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      args.code,
      args.environment,
      // args.jsImports,
      args.executionId,
    ]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(result.result.tag === "Ok" ? result.result.value : undefined);
  }, [result, onChange]);

  return result;
};
