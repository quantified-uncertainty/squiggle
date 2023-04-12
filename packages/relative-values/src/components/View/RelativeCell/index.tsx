import { ModelEvaluator } from "@/values/ModelEvaluator";
import { FC, memo } from "react";
import { DistCell } from "./DistCell";
import { ErrorCell } from "./ErrorCell";

export const RelativeCell: FC<{
  id1: string;
  id2: string;
  model: ModelEvaluator;
  uncertaintyPercentiles: number[];
}> = memo(function RelativeCell({ id1, id2, model, uncertaintyPercentiles }) {
  const result = model.compare(id1, id2);

  if (!result.ok) {
    return <ErrorCell error={result.value} />;
  }

  return (
    <DistCell
      item={result.value}
      uncertaintyPercentiles={uncertaintyPercentiles}
    />
  );
});
