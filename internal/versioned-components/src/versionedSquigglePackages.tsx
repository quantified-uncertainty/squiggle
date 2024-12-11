import {
  squiggleComponentsByVersion,
  SquiggleComponentsPackageTypes,
} from "./versionedSquiggleComponents.js";
import {
  squiggleLangByVersion,
  SquiggleLangPackageTypes,
} from "./versionedSquiggleLang.js";
import { SquiggleVersion } from "./versions.js";

export type SquigglePackages<
  Version extends SquiggleVersion = SquiggleVersion,
> = Version extends string
  ? {
      lang: SquiggleLangPackageTypes[Version];
      components: SquiggleComponentsPackageTypes[Version];
      version: Version;
    }
  : never;

// Caching promises is useful when `versionedSquiggleComponents` is used with `use()`.
// Without a cache, `use()` would re-suspend even if the packages are already imported.
const promiseCache: {
  [k in SquiggleVersion]?: Promise<SquigglePackages<k>>;
} = {};

export function versionedSquigglePackages<Version extends SquiggleVersion>(
  version: Version
): Promise<SquigglePackages<Version>> {
  if (!promiseCache[version]) {
    promiseCache[version] = new Promise((resolve) => {
      Promise.all([
        squiggleLangByVersion(version),
        squiggleComponentsByVersion(version),
      ]).then(([lang, components]) =>
        resolve({ lang, components, version } as SquigglePackages<Version>)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Promise<SquigglePackages<any>>;
  }
  return promiseCache[version]!;
}
