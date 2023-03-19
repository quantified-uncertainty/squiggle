import { RV } from "@/values/RV";
import { FC, memo } from "react";
import { DistCell } from "./DistCell";
import { ErrorCell } from "./ErrorCell";

export const RelativeCell: FC<{
  id1: string;
  id2: string;
  rv: RV;
}> = memo(function RelativeCell({ id1, id2, rv }) {
  const result = rv.compare(id1, id2);

  if (!result.ok) {
    return <ErrorCell error={result.value} />;
  }

  return <DistCell item={result.value} />;
});
