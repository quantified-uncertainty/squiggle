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

export async function versionedSquigglePackages<
  Version extends SquiggleVersion,
>(version: Version): Promise<SquigglePackages<Version>> {
  return {
    lang: await squiggleLangByVersion(version),
    components: await squiggleComponentsByVersion(version),
    version,
  } as unknown as SquigglePackages<Version>;
}
