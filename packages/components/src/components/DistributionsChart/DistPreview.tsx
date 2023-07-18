import { FC } from "react";

import { SqDistribution, Env, result } from "@quri/squiggle-lang";
import { NumberShower } from "../NumberShower.js";

function unwrap<a, b>(x: result<a, b>): a {
  if (x.ok) {
    return x.value;
  } else {
    throw Error("FAILURE TO UNWRAP");
  }
}

type SummaryTableProps = {
  dist: SqDistribution;
  environment: Env;
};

export const DistPreview: FC<SummaryTableProps> = ({ dist, environment }) => {
  const p05 = unwrap(dist.inv(environment, 0.05));
  const p95 = unwrap(dist.inv(environment, 0.95));
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
