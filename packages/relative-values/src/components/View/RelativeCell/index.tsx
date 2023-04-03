import { ModelEvaluator } from "@/values/ModelEvaluator";
import { FC, memo } from "react";
import { DistCell } from "./DistCell";
import { ErrorCell } from "./ErrorCell";

export const RelativeCell: FC<{
  id1: string;
  id2: string;
  model: ModelEvaluator;
  percentiles: number[];
}> = memo(function RelativeCell({ id1, id2, model, percentiles }) {
  const result = model.compare(id1, id2);

  if (!result.ok) {
    return <ErrorCell error={result.value} />;
  }

  return <DistCell item={result.value} percentiles={percentiles}/>;
});
