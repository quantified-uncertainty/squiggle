import { SquiggleVersion } from "./versions.js";

// This type helper is named identically here and in `versionedSquiggleComponents.ts`.
// This allows us to use the same code in `patch-js.ts` to update the list for both files.
type GetImportType<T> = Awaited<T>;

// Auto-generated, don't touch.
export type SquiggleLangPackageTypes = {
  "0.8.5": GetImportType<typeof import("squiggle-lang-0.8.5")>;
  "0.8.6": GetImportType<typeof import("squiggle-lang-0.8.6")>;
  "0.9.0": GetImportType<typeof import("squiggle-lang-0.9.0")>;
  "0.9.2": GetImportType<typeof import("squiggle-lang-0.9.2")>;
  "0.9.3": GetImportType<typeof import("squiggle-lang-0.9.3")>;
  "0.9.4": GetImportType<typeof import("squiggle-lang-0.9.4")>;
  dev: GetImportType<typeof import("@quri/squiggle-lang")>;
};
export async function squiggleLangByVersion<T extends SquiggleVersion>(
  version: T
): Promise<SquiggleLangPackageTypes[T]> {
  // Auto-generated, don't touch.
  // Enumerating all imports is necessary; `await import(version)` won't be enough.
  // Note: `as unknown` casting here is not strictly necessary, but it matches the code in `versionedSquiggleComponents`,
  // which helps with `patch-js.ts` transformations.
  switch (version) {
    case "0.8.5":
      return (await import(
        "squiggle-lang-0.8.5"
      )) as unknown as SquiggleLangPackageTypes[T];
    case "0.8.6":
      return (await import(
        "squiggle-lang-0.8.6"
      )) as unknown as SquiggleLangPackageTypes[T];
    case "0.9.0":
      return (await import(
        "squiggle-lang-0.9.0"
      )) as unknown as SquiggleLangPackageTypes[T];
    case "0.9.2":
      return (await import(
        "squiggle-lang-0.9.2"
      )) as unknown as SquiggleLangPackageTypes[T];
    case "0.9.3":
      return (await import(
        "squiggle-lang-0.9.3"
      )) as unknown as SquiggleLangPackageTypes[T];
    case "0.9.4":
      return (await import(
        "squiggle-lang-0.9.4"
      )) as unknown as SquiggleLangPackageTypes[T];
    case "dev":
      return (await import(
        "@quri/squiggle-lang"
      )) as unknown as SquiggleLangPackageTypes[T];
    default:
      throw new Error(`Unkonwn version ${version satisfies never}`);
  }
}
