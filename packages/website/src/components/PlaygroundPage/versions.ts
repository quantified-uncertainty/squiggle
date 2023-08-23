export const versions = ["0.8.4", "dev"] as const;

export type Version = (typeof versions)[number];

export const defaultVersion: Version = "0.8.4";
