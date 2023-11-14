"use client";
import { FC, Suspense, lazy } from "react";

/*
 * We have to type all playground components explicitly; otherwise, TypeScript will complain with TS2742 "likely not portable" error.
 * But we also need lazy imports and not load all playground versions immediately.
 * This means that types should be imported immediately with `import { type ... }`, which are removed by TypeScript
 * (`importsNotUsedAsValues`, https://www.typescriptlang.org/tsconfig#importsNotUsedAsValues, defaults to "remove"),
 * but components themselves should be imported lazily.
 */
import {
  SquigglePlaygroundProps_0_8_5,
  SquigglePlaygroundProps_0_8_6,
} from "./oldPlaygroundTypes.js";
import { LazyVersionedComponents, VersionedComponentProps } from "./types.js";

/*
 * Please don't change the formatting of these imports and the following `playgroundByVersion` declaration unless you have to.
 * It's edited with babel transformation in `publish-all.ts` script.
 */
import { type SquigglePlaygroundProps as SquigglePlaygroundProps_dev } from "@quri/squiggle-components";

const playgroundByVersion = {
  "0.8.5": lazy(async () => ({
    default: (await import("squiggle-components-0.8.5")).SquigglePlayground,
  })) as FC<SquigglePlaygroundProps_0_8_5>,
  "0.8.6": lazy(async () => ({
    default: (await import("squiggle-components-0.8.6")).SquigglePlayground,
  })) as FC<SquigglePlaygroundProps_0_8_6>,
  dev: lazy(async () => ({
    default: (await import("@quri/squiggle-components")).SquigglePlayground,
  })) as FC<SquigglePlaygroundProps_dev>,
} as const satisfies LazyVersionedComponents;

type Props = VersionedComponentProps<typeof playgroundByVersion>;

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
