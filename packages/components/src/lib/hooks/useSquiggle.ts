import {
  environment,
  resultMap,
  run,
  SqValue,
  SqValueTag,
} from "@quri/squiggle-lang";
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
      const { result, bindings } = run(args.code, {
        environment: args.environment,
      });
      return resultMap(result, (v) =>
        v.tag === SqValueTag.Void ? bindings.asValue() : v
      );
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

  console.log(result);

  return result;
};
