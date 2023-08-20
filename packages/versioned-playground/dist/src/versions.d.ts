export declare const squiggleVersions: readonly ["dev"];
export type SquiggleVersion = (typeof squiggleVersions)[number];
export declare const defaultSquiggleVersion: SquiggleVersion;
export declare function checkSquiggleVersion(version: string): version is SquiggleVersion;
//# sourceMappingURL=versions.d.ts.map