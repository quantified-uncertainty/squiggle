import { FC, memo } from "react";

import { RelativeValueCell } from "@quri/squiggle-components";

import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";

import { CellBox } from "../CellBox";
import { ErrorCell } from "./ErrorCell";

export const RelativeCell: FC<{
  id1: string;
  id2: string;
  model: ModelEvaluator;
  uncertaintyPercentiles: [number, number];
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
    <CellBox>
      <RelativeValueCell
        item={result.value}
        uncertaintyPercentiles={uncertaintyPercentiles}
        showRange={showRange}
        showMedian={true}
      />
    </CellBox>
  );
});
