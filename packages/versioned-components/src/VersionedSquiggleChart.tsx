"use client";
import { FC, Suspense, lazy } from "react";

import { SquiggleVersion } from "./versions.js";
import { LazyVersionedComponents, VersionedComponentProps } from "./types.js";

type SquiggleChartVersion = Exclude<SquiggleVersion, "0.8.5" | "0.8.6">;

/*
 * Please don't change the formatting of these imports and the following `componentByVersion` declaration unless you have to.
 * It's edited with babel transformation in `publish-all.ts` script.
 */
import { type SquiggleChartProps as SquiggleChartProps_dev } from "@quri/squiggle-components";

const componentByVersion = {
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