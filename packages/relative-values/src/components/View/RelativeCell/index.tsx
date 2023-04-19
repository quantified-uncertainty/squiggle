import { ModelEvaluator } from "@/values/ModelEvaluator";
import { FC, memo } from "react";
import { DistCell } from "./DistCell";
import { ErrorCell } from "./ErrorCell";

export const RelativeCell: FC<{
  id1: string;
  id2: string;
  model: ModelEvaluator;
  uncertaintyPercentiles: number[];
  showRange?: boolean;
}> = memo(function RelativeCell({
  id1,
  id2,
  model,
  uncertaintyPercentiles,
  showRange,
}) {
  const result = model.compare(id1, id2);

  if (!result.ok) {
    return <ErrorCell error={result.value} />;
  }

  return (
    <DistCell
      item={result.value}
      uncertaintyPercentiles={uncertaintyPercentiles}
      showRange={showRange}
      showMedian={true}
    />
  );
});
