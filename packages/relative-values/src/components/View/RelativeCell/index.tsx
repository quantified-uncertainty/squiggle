import { FC, memo } from "react";
import { CachedPairs } from "../hooks";
import { DistCell } from "./DistCell";
import { ErrorCell } from "./ErrorCell";

export const RelativeCell: FC<{
  id1: string;
  id2: string;
  cache: CachedPairs;
}> = memo(function CachedCell({ id1, id2, cache }) {
  const result = cache[id1]?.[id2];
  if (!result) {
    return <ErrorCell error="Internal error, missing data" />;
  }

  if (!result.ok) {
    return <ErrorCell error={result.value} />;
  }

  return <DistCell item={result.value} />;
});
