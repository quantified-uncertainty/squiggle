import { FC } from "react";

import { SquiggleVersion } from "./versions.js";

// This file contains type helpers for contructing correct props in `Versioned*` components.

export type LazyVersionedComponents<
  // Version type parameter is optional; it's useful if we don't want to support some older versions for this component.
  Version extends SquiggleVersion = SquiggleVersion,
> = {
  // `FC<unknown>` or `FC<never>` won't work. `any` here is not a big deal because we only use this type for `satisfies` check.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k in Version]: FC<any>;
};

// Conditional is a trick from https://stackoverflow.com/a/51691257; because of it, `VersionedComponentProps` type becomes a discriminated union over `version`.
type ChartProps<
  C extends LazyVersionedComponents<T>,
  T extends SquiggleVersion = SquiggleVersion,
> = T extends string ? { version: T } & Parameters<C[T]>[0] : never;

export type VersionedComponentProps<
  // TODO: there might be a way to infer `Version` from `LazyComponents`, but I couldn't find it.
  LazyComponents extends LazyVersionedComponents<Version>,
  Version extends SquiggleVersion = SquiggleVersion,
> = ChartProps<LazyComponents, Version>;
