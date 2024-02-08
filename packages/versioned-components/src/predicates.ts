// We need several kinds of guards:
// 1) `guard.plain(version)`, to check the version string
// 2) `guard.props({ version: ... })`, to check and narrow the props or packages object
// 3) `guard.propsByVersion(packages, props)`, to incrementally update the props
// The following code is a bit complicated, because it optimizes for easily adding new guards.

import { type FC } from "react";

import { type SquigglePackages } from "./versionedSquigglePackages.js";
import { type SquiggleVersion } from "./versions.js";

type VersionGuard<AllowedSquiggleVersion extends SquiggleVersion> = (
  version: SquiggleVersion
) => version is AllowedSquiggleVersion;

type VersionedObjectGuard<AllowedSquiggleVersion extends SquiggleVersion> = <
  Obj extends { version: SquiggleVersion },
>(
  obj: Obj
) => obj is Extract<Obj, { version: AllowedSquiggleVersion }>;

type ExtractKeys<T extends object, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

// TODO - include components for all versions
type SquiggleComponentName = ExtractKeys<
  SquigglePackages<SquiggleVersion>["components"],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FC<any>
>;

type VersionedPropsByVersionGuard<
  AllowedSquiggleVersion extends SquiggleVersion,
> = <Component extends SquiggleComponentName = never>(
  version: SquiggleVersion,
  props: Parameters<
    SquigglePackages<SquiggleVersion>["components"][Component]
  >[0]
) => props is Parameters<
  SquigglePackages<AllowedSquiggleVersion>["components"][Component]
>[0];

type CompositeGuard<AllowedSquiggleVersion extends SquiggleVersion> = {
  plain: VersionGuard<AllowedSquiggleVersion>;
  object: VersionedObjectGuard<AllowedSquiggleVersion>;
  propsByVersion: VersionedPropsByVersionGuard<AllowedSquiggleVersion>;
};

export function excludeVersions<
  T extends SquiggleVersion[],
  AllowedSquiggleVersion extends SquiggleVersion = Exclude<
    SquiggleVersion,
    T[number]
  >,
>(skipVersions: T): CompositeGuard<AllowedSquiggleVersion> {
  const plainGuard = ((version) =>
    !skipVersions.includes(version)) as VersionGuard<AllowedSquiggleVersion>;

  const objectGuard = ((arg) =>
    !skipVersions.includes(
      arg.version
    )) as VersionedObjectGuard<AllowedSquiggleVersion>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const propsByVersionGuard = ((version, props) =>
    !skipVersions.includes(
      version
    )) as VersionedPropsByVersionGuard<AllowedSquiggleVersion>;

  return {
    plain: plainGuard,
    object: objectGuard,
    propsByVersion: propsByVersionGuard,
  };
}

/*
 * This is an example of a type predicate (https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
 * that's useful for setting component props conditionally.
 * See `EditSquiggleSnippetModel` in the Squiggle Hub source code for an example how it's used.
 */

export const versionSupportsOnClickExport = excludeVersions([
  "0.8.5",
  "0.8.6",
  "0.9.0",
  "0.9.2",
  "0.9.3",
]);

export const versionSupportsDropdownMenu = excludeVersions(["0.8.5"]);
export const versionSupportsExports = excludeVersions(["0.8.5", "0.8.6"]);
export const versionSupportsSquiggleChart = excludeVersions(["0.8.5", "0.8.6"]);
export const versionSupportsImportTooltip = excludeVersions([
  "0.8.5",
  "0.8.6",
  "0.9.0",
  "0.9.2",
]);

export const versionSupportsSqPathV2 = excludeVersions([
  "0.8.5",
  "0.8.6",
  "0.9.0",
  "0.9.2",
]);
