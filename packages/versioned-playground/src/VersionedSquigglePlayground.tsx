"use client";
import { FC, Suspense, lazy } from "react";
import {
  SquigglePlaygroundProps_0_8_5,
  SquigglePlaygroundProps_0_8_6,
} from "./oldPlaygroundTypes.js";

// We have to type all playground components explicitly; otherwise, TypeScript will complain with TS2742 "likely not portable" error.

const playground_0_8_5: FC<SquigglePlaygroundProps_0_8_5> = lazy(async () => ({
  default: (await import("squiggle-components-0.8.5")).SquigglePlayground,
}));

const playground_0_8_6: FC<SquigglePlaygroundProps_0_8_6> = lazy(async () => ({
  default: (await import("squiggle-components-0.8.6")).SquigglePlayground,
}));

import { type SquigglePlaygroundProps } from "@quri/squiggle-components";
import { SquiggleVersion } from "./versions.js";
const playground_dev: FC<SquigglePlaygroundProps> = lazy(async () => ({
  default: (await import("@quri/squiggle-components")).SquigglePlayground,
}));

// Note: typing this with `{ [k in Version]: ComponentType<CommonProps> }` won't work because of contravariance issues.
// Instead, we pass all props explicitly to the playground component when it's instantiated to check that all props are compatible.
// Also, please don't change the formatting of this declaration unless you have to. It's edited with regexes in `publish-all.ts` script.
// (TODO: using codemod would be nice)
const playgroundByVersion = {
  "0.8.5": playground_0_8_5,
  "0.8.6": playground_0_8_6,
  dev: playground_dev,
} as const;

type PlaygroundProps<T extends SquiggleVersion> = Parameters<
  (typeof playgroundByVersion)[T]
>[0];

// Conditional is a trick from https://stackoverflow.com/a/51691257, so that we don't have to list all versions individually in `Props` definition below.
type PropsForVersion<T extends SquiggleVersion> = T extends string
  ? {
      version: T;
    } & PlaygroundProps<T>
  : never;

type Props = PropsForVersion<SquiggleVersion>;

export const VersionedSquigglePlayground: FC<Props> = ({
  version,
  ...props
}) => {
  const Playground = playgroundByVersion[version];

  return (
    // TODO - fallback spinner / loading message?
    <Suspense fallback={null}>
      <Playground
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(props as any) // we've checked the types in Props already so this is fine
        }
      />
    </Suspense>
  );
};
