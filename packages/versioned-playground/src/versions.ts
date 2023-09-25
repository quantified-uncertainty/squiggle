export const squiggleVersions = ["dev", "0.8.5"] as const;

export type SquiggleVersion = (typeof squiggleVersions)[number];

export const defaultSquiggleVersion: SquiggleVersion = "0.8.5";

export function checkSquiggleVersion(
  version: string
): version is SquiggleVersion {
  return (squiggleVersions as readonly string[]).includes(version);
}