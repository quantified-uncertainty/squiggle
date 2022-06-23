import {
  bindings,
  environment,
  jsImports,
  run,
  runPartial,
} from "@quri/squiggle-lang";
import { useEffect, useMemo, useRef } from "react";

type SquiggleArgs<T extends ReturnType<typeof run | typeof runPartial>> = {
  code: string;
  bindings?: bindings;
  jsImports?: jsImports;
  environment?: environment;
  onChange?: (expr: Extract<T, { tag: "Ok" }>["value"] | undefined) => void;
};

const useSquiggleAny = <T extends ReturnType<typeof run | typeof runPartial>>(
  args: SquiggleArgs<T>,
  f: (...args: Parameters<typeof run>) => T
) => {
  //  We're using observable, where div elements can have a `value` property:
  // https://observablehq.com/@observablehq/introduction-to-views
  //
  //  This is here to get the 'viewof' part of:
  //  viewof env = cell('normal(0,1)')
  //  to work
  const ref = useRef<
    HTMLDivElement & { value?: Extract<T, { tag: "Ok" }>["value"] }
  >(null);
  const result: T = useMemo<T>(
    () => f(args.code, args.bindings, args.environment, args.jsImports),
    [f, args.code, args.bindings, args.environment, args.jsImports]
  );

  useEffect(() => {
    if (!ref.current) return;
    ref.current.value = result.tag === "Ok" ? result.value : undefined;

    ref.current.dispatchEvent(new CustomEvent("input"));
  }, [result]);

  const { onChange } = args;

  useEffect(() => {
    onChange?.(result.tag === "Ok" ? result.value : undefined);
  }, [result, onChange]);

  return {
    result, // squiggleExpression or externalBindings
    observableRef: ref, // can be passed to outermost <div> if you want to use your component as an observablehq's view
  };
};

export const useSquigglePartial = (
  args: SquiggleArgs<ReturnType<typeof runPartial>>
) => {
  return useSquiggleAny(args, runPartial);
};

export const useSquiggle = (args: SquiggleArgs<ReturnType<typeof run>>) => {
  return useSquiggleAny(args, run);
};
