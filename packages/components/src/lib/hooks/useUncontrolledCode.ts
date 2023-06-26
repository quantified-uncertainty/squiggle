import { useCallback, useState } from "react";

import { SquiggleCodeProps } from "../../components/types.js";

// common helper for SquiggleEditor and SquigglePlayground
export function useUncontrolledCode({
  defaultCode = "",
  onCodeChange,
}: SquiggleCodeProps) {
  const [code, setCode] = useState(defaultCode);

  const onChange = useCallback(
    (newValue: string) => {
      setCode(newValue);
      onCodeChange?.(newValue);
    },
    [onCodeChange]
  );

  return { code, setCode: onChange, defaultCode };
}
