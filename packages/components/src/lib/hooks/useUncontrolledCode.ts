import { useCallback, useState } from "react";

// common helper for SquiggleEditor and SquigglePlayground
export function useUncontrolledCode({
  defaultCode = "",
  onCodeChange,
}: {
  defaultCode?: string;
  onCodeChange?: (code: string) => void;
}) {
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
