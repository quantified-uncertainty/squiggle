import { useMemo } from "react";

export function useStabilizeObjectIdentity<T>(value: T): T {
  const serializedValue = JSON.stringify(value);
  return useMemo(() => JSON.parse(serializedValue), [serializedValue]);
}
