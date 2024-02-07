// Auto-generated, don't touch.
export const squiggleVersions = [
  "0.9.3",
  "0.9.2",
  "0.9.0",
  "0.8.6",
  "0.8.5",
  "dev",
] as const;
export type SquiggleVersion = (typeof squiggleVersions)[number];

// Auto-generated, don't touch.
export const defaultSquiggleVersion: SquiggleVersion = "0.9.3";
export function checkSquiggleVersion(
  version: string
): version is SquiggleVersion {
  return (squiggleVersions as readonly string[]).includes(version);
}
