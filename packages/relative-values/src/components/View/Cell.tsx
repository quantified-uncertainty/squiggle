import { NumberShower } from "@quri/squiggle-components";
import { Env, SqDistribution, SqDistributionTag } from "@quri/squiggle-lang";
import { FC, memo } from "react";
import { CellError } from "./CellError";
import { Histogram } from "./Histogram";

export const Cell: FC<{ dist: SqDistribution; env: Env }> = memo(function Cell({
  dist,
  env,
}) {
  if (dist.tag !== SqDistributionTag.SampleSet) {
    // TODO - convert automatically?
    return <CellError error="Expected sample set" />;
  }

  const median = dist.inv(env, 0.5);

  const [min, max] = [0.05, 0.95].map((q) => dist.inv(env, q));

  const samples = [...dist.value().samples].sort((a, b) => a - b);
  return (
    <div className="pt-[1px] min-h-[2em] relative">
      <div className="text-center z-0 py-1">
        {median.ok ? (
          <div className="text-sm">
            <NumberShower number={median.value} />
          </div>
        ) : null}

        {min.ok && max.ok ? (
          <div className="text-xs text-gray-500">
            <NumberShower number={min.value} /> to{" "}
            <NumberShower number={max.value} />
          </div>
        ) : null}
      </div>
      <div className="h-8 absolute bottom-0 inset-x-0 -z-10">
        <Histogram data={samples} domain={[1e-3, 1e3]} />
      </div>
    </div>
  );
});
