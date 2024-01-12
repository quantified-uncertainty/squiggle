// auto-generated by `publish-all.ts`, don't touch
export const squiggleVersions = [
  "0.9.2",
  "0.9.0",
  "0.8.6",
  "0.8.5",
  "dev",
] as const;
export type SquiggleVersion = (typeof squiggleVersions)[number];

// auto-generated by `publish-all.ts`, don't touch
export const defaultSquiggleVersion: SquiggleVersion = "0.9.2";
export function checkSquiggleVersion(
  version: string
): version is SquiggleVersion {
  return (squiggleVersions as readonly string[]).includes(version);
}

// We need two kinds of guards:
// 1) `guard.plain(version)`, to check the version string
// 2) `guard.props({ version: ... })`, to check and narrow the props that we're going to use and incrementally update the props
// The following code is a bit complicated, because it optimizes for easily adding new guards.

type VersionGuard<AllowedSquiggleVersion extends SquiggleVersion> = (
  version: SquiggleVersion
) => version is AllowedSquiggleVersion;

type VersionedPropsGuard<AllowedSquiggleVersion extends SquiggleVersion> = <
  Arg extends { version: SquiggleVersion },
>(
  arg: Arg
) => arg is Extract<Arg, { version: AllowedSquiggleVersion }>;

type CompositeGuard<AllowedSquiggleVersion extends SquiggleVersion> = {
  plain: VersionGuard<AllowedSquiggleVersion>;
  props: VersionedPropsGuard<AllowedSquiggleVersion>;
};

function excludeVersions<
  T extends SquiggleVersion[],
  AllowedSquiggleVersion extends SquiggleVersion = Exclude<
    SquiggleVersion,
    T[number]
  >,
>(skipVersions: T): CompositeGuard<AllowedSquiggleVersion> {
  const plainGuard = ((version) =>
    !skipVersions.includes(version)) as VersionGuard<AllowedSquiggleVersion>;

  const propsGuard = ((arg) =>
    !skipVersions.includes(
      arg.version
    )) as VersionedPropsGuard<AllowedSquiggleVersion>;

  return {
    plain: plainGuard,
    props: propsGuard,
  };
}

/*
 * This is an example of a type predicate (https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
 * that's useful for setting component props conditionally.
 * See `EditSquiggleSnippetModel` in the Squiggle Hub source code for an example how it's used.
 */
export const versionSupportsDropdownMenu = excludeVersions(["0.8.5"]);
export const versionSupportsExports = excludeVersions(["0.8.5", "0.8.6"]);
