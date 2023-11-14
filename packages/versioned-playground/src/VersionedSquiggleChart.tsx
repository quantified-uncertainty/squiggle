"use client";
import { FC, Suspense, lazy } from "react";

import { SquiggleVersion } from "./versions.js";
import { LazyVersionedComponents, VersionedComponentProps } from "./types.js";

type SquiggleChartVersion = Exclude<SquiggleVersion, "0.8.5" | "0.8.6">;

const chartByVersion = {
  dev: lazy(async () => ({
    default: (await import("@quri/squiggle-components")).SquiggleChart,
  })),
} as const satisfies LazyVersionedComponents<SquiggleChartVersion>;

type VersionedSquiggleChartProps = VersionedComponentProps<
  typeof chartByVersion,
  SquiggleChartVersion
>;

export const VersionedSquiggleChart: FC<VersionedSquiggleChartProps> = ({
  version,
  ...props
}) => {
  const Chart = chartByVersion[version];

  return (
    // TODO - fallback spinner / loading message?
    <Suspense fallback={null}>
      <Chart
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(props as any) // we've checked the types in Props already so this is fine
        }
      />
    </Suspense>
  );
};
