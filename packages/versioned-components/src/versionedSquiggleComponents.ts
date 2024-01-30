"use client"; // squiggle-components are not RSC-friendly

import { FC } from "react";

import { SquiggleLangPackageTypes } from "./versionedSquiggleLang.js";
import { SquiggleVersion } from "./versions.js";

/**
 * We extend components props to allow any version of `SqProject` and other common squiggle-lang classes.
 * This makes them less type-safe, but matching squiggle-lang object versions with components verisons is almost impossible without this.
 */

type AnySqProject = InstanceType<
  SquiggleLangPackageTypes[SquiggleVersion]["SqProject"]
>;
type AnySqValuePath = InstanceType<
  SquiggleLangPackageTypes[SquiggleVersion]["SqValuePath"]
>;

type PatchSqType<Prop> = Prop extends AnySqProject
  ? AnySqProject
  : Prop extends AnySqValuePath
    ? AnySqValuePath
    : Prop;

type PatchSqTypesInProps<Props> = Props extends Record<string, unknown>
  ? {
      [k in keyof Props]: PatchSqType<Props[k]>;
    }
  : Props;

type PatchSqTypesInFC<T> = T extends FC<infer Props>
  ? FC<PatchSqTypesInProps<Props>>
  : T;

type PatchSqTypes<Exports extends Record<string, unknown>> = {
  [k in keyof Exports]: PatchSqTypesInFC<Exports[k]>;
};

// This type helper is named identically here and in `versionedSquiggleLang.ts`.
// This allows us to use the same code in `patch-js.ts` to update the list for both files.
type GetImportType<T extends Record<string, unknown>> = PatchSqTypes<
  Awaited<T>
>;

// Auto-generated, don't touch.
export type SquiggleComponentsPackageTypes = {
  "0.8.5": GetImportType<typeof import("squiggle-components-0.8.5")>;
  "0.8.6": GetImportType<typeof import("squiggle-components-0.8.6")>;
  "0.9.0": GetImportType<typeof import("squiggle-components-0.9.0")>;
  "0.9.2": GetImportType<typeof import("squiggle-components-0.9.2")>;
  dev: GetImportType<typeof import("@quri/squiggle-components")>;
};

export async function squiggleComponentsByVersion<T extends SquiggleVersion>(
  version: T
): Promise<SquiggleComponentsPackageTypes[T]> {
  // Auto-generated, don't touch.
  // Enumerating all imports is necessary; `await import(version)` won't be enough.
  switch (version) {
    case "0.8.5":
      return (await import(
        "squiggle-components-0.8.5"
      )) as unknown as SquiggleComponentsPackageTypes[T];
    case "0.8.6":
      return (await import(
        "squiggle-components-0.8.6"
      )) as unknown as SquiggleComponentsPackageTypes[T];
    case "0.9.0":
      return (await import(
        "squiggle-components-0.9.0"
      )) as unknown as SquiggleComponentsPackageTypes[T];
    case "0.9.2":
      return (await import(
        "squiggle-components-0.9.2"
      )) as unknown as SquiggleComponentsPackageTypes[T];
    case "dev":
      return (await import(
        "@quri/squiggle-components"
      )) as unknown as SquiggleComponentsPackageTypes[T];
    default:
      throw new Error(`Unkonwn version ${version satisfies never}`);
  }
}
