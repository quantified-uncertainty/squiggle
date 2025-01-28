"use client";
import React, { FC, useMemo, useState } from "react";

import dynamic from "next/dynamic";

import { QuestionWithHistoryFragment } from "../../../fragments.generated";
import { Props as InnerChartProps } from "./InnerChart"; // hopefully doesn't import code, just types - need to check
import { InnerChartPlaceholder } from "./InnerChartPlaceholder";
import { Legend } from "./Legend";
import { buildChartData, chartColors } from "./utils";

const InnerChart = dynamic<InnerChartProps>(
  () => import("./InnerChart").then((mod) => mod.InnerChart),
  { ssr: false, loading: () => <InnerChartPlaceholder /> }
);

interface Props {
  question: QuestionWithHistoryFragment;
}

export const HistoryChart: FC<Props> = ({ question }) => {
  // maybe use context instead?
  const [highlight, setHighlight] = useState<number | undefined>(undefined);

  const data = useMemo(() => buildChartData(question), [question]);

  return (
    <div className="flex items-center space-y-4 sm:flex-row sm:space-y-0 ">
      <InnerChart data={data} highlight={highlight} />
      <Legend
        items={data.seriesNames.map((name, i) => ({
          name,
          color: chartColors[i],
        }))}
        setHighlight={setHighlight}
      />
    </div>
  );
};
