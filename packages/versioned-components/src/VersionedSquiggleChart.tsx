"use client";

import { FC, lazy, Suspense } from "react";

/*
 * Please don't change the formatting of these imports and the following `componentByVersion` declaration unless you have to.
 * It's edited with babel transformation in `publish-all.ts` script.
 */
import { type SquiggleChartProps as SquiggleChartProps_0_9_0 } from "squiggle-components-0.9.0";
import { type SquiggleChartProps as SquiggleChartProps_dev } from "@quri/squiggle-components";
import { LazyVersionedComponents, VersionedComponentProps } from "./types.js";
import { SquiggleVersion } from "./versions.js";
type SquiggleChartVersion = Exclude<SquiggleVersion, "0.8.5" | "0.8.6">;
const componentByVersion = {
  "0.9.0": lazy(async () => ({
    default: (await import("squiggle-components-0.9.0")).SquiggleChart,
  })) as FC<SquiggleChartProps_0_9_0>,
  dev: lazy(async () => ({
    default: (await import("@quri/squiggle-components")).SquiggleChart,
  })) as FC<SquiggleChartProps_dev>,
} as const satisfies LazyVersionedComponents<SquiggleChartVersion>;
type VersionedSquiggleChartProps = VersionedComponentProps<
  typeof componentByVersion,
  SquiggleChartVersion
>;
export const VersionedSquiggleChart: FC<VersionedSquiggleChartProps> = ({
  version,
  ...props
}) => {
  const Chart = componentByVersion[version];
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
