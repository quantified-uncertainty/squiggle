import { environment, run, SquiggleValue } from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";

type SquiggleArgs = {
  code: string;
  executionId?: number;
  // jsImports?: jsImports;
  environment?: environment;
  onChange?: (expr: SquiggleValue | undefined) => void;
};

export const useSquiggle = (args: SquiggleArgs) => {
  const result = useMemo(
    () => {
      const { result } = run(args.code, { environment: args.environment });
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      args.code,
      // args.environment,
      // args.jsImports,
      args.executionId,
    ]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(result.tag === "Ok" ? result.value : undefined);
  }, [result, onChange]);

  return result;
};
