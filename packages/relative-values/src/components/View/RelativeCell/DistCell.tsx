import { NumberShower } from "@quri/squiggle-components";
import { Env, SqDistribution, SqDistributionTag } from "@quri/squiggle-lang";
import { FC, memo, useMemo } from "react";
import { ErrorCell } from "./ErrorCell";
import { Histogram } from "../Histogram";
import { CellBox } from "../CellBox";
import { SqSampleSetDistribution } from "@quri/squiggle-lang/dist/src/public/SqDistribution";
import { CachedItem } from "../hooks";

export const DistCell: FC<{ item: CachedItem }> = memo(function DistCell({
  item,
}) {
  const uncertainty = useMemo(() => {
    if (!item.min.ok || !item.max.ok || !item.median.ok) {
      return undefined;
    }

    const min = item.min.value;
    const max = item.max.value;
    const median = item.median.value;

    const leftUncertainty = (median - min) / median;
    const rightUncertainty = leftUncertainty; // ???
    return (leftUncertainty + rightUncertainty) / 2;
  }, [item]);

  return (
    <CellBox>
      <div className="h-full pt-[1px] min-h-[2em] relative">
        <div className="text-center z-0 py-1">
          {item.median.ok ? (
            <div className="text-sm">
              <NumberShower number={item.median.value} />
              {uncertainty ? (
                <span>
                  {" "}
                  <span className="text-gray-500">±</span>{" "}
                  <NumberShower number={uncertainty * 100} />%
                </span>
              ) : null}
            </div>
          ) : null}

          {item.min.ok && item.max.ok ? (
            <div className="text-xs text-gray-500">
              <NumberShower number={item.min.value} /> to{" "}
              <NumberShower number={item.max.value} />
            </div>
          ) : null}
        </div>
        <div className="h-8 absolute bottom-0 inset-x-0 -z-10">
          <Histogram data={item.sortedSamples} domain={[1e-3, 1e3]} />
        </div>
      </div>
    </CellBox>
  );
});
