import { FC } from "react";

import { SqDistribution, Env } from "@quri/squiggle-lang";
import { NumberShower } from "../NumberShower.js";
import { unwrapOrFailure } from "../../lib/utility.js";

type SummaryTableProps = {
  dist: SqDistribution;
  environment: Env;
};

export const DistPreview: FC<SummaryTableProps> = ({ dist, environment }) => {
  const p05 = unwrapOrFailure(dist.inv(environment, 0.05));
  const p95 = unwrapOrFailure(dist.inv(environment, 0.95));
  const oneValue = p05 === p95;
  return oneValue ? (
    <NumberShower precision={2} number={p05} />
  ) : (
    <div>
      <NumberShower precision={2} number={p05} />
      <span className="mx-1 opacity-70">to</span>
      <NumberShower precision={2} number={p95} />
    </div>
  );
};
