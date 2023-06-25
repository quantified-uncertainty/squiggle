import { SquiggleCodeProps } from "../../components/types.js";
import { useMaybeControlledValue } from "./useMaybeControlledValue.js";

// common helper for SquiggleEditor and SquigglePlayground
export function useMaybeControlledCode(props: SquiggleCodeProps) {
  return useMaybeControlledValue({
    value: props.code,
    defaultValue: props.defaultCode ?? "",
    onChange: props.onCodeChange,
  });
}
