import { SquiggleVersion } from "./versions.js";

type PackageTypes = {
  "0.8.5": Awaited<typeof import("squiggle-lang-0.8.5")>;
  "0.8.6": Awaited<typeof import("squiggle-lang-0.8.6")>;
  "0.9.0": Awaited<typeof import("squiggle-lang-0.9.0")>;
  "0.9.2": Awaited<typeof import("squiggle-lang-0.9.2")>;
  dev: Awaited<typeof import("@quri/squiggle-lang")>;
};

export async function squiggleLangByVersion<T extends SquiggleVersion>(
  version: T
): Promise<PackageTypes[T]> {
  // We do explicit casting of imports, but it shouldn't matter.
  switch (version) {
    case "0.8.5":
      return (await import("squiggle-lang-0.8.5")) as PackageTypes[T];
    case "0.8.6":
      return (await import("squiggle-lang-0.8.6")) as PackageTypes[T];
    case "0.9.0":
      return (await import("squiggle-lang-0.9.0")) as PackageTypes[T];
    case "0.9.2":
      return (await import("squiggle-lang-0.9.2")) as PackageTypes[T];
    case "dev":
      return (await import("@quri/squiggle-lang")) as PackageTypes[T];
    default:
      throw new Error(`Unkonwn version ${version satisfies never}`);
  }
}
