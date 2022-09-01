import { environment, run, SqValue } from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";

type SquiggleArgs = {
  code: string;
  executionId?: number;
  // jsImports?: jsImports;
  environment?: environment;
  onChange?: (expr: SqValue | undefined) => void;
};

export const useSquiggle = (args: SquiggleArgs) => {
  const result = useMemo(
    () => {
      const result = run(args.code, {
        environment: args.environment,
      });
      return result;
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
