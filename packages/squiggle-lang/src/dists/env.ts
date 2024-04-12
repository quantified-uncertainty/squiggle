import * as magicNumbers from "../magicNumbers.js";

export type Env = {
  sampleCount: number; // int
  xyPointLength: number; // int
  seed: string; // for RNG
};

export const defaultEnv: Env = {
  sampleCount: magicNumbers.Environment.defaultSampleCount,
  xyPointLength: magicNumbers.Environment.defaultXYPointLength,
  seed: magicNumbers.Environment.defaultSeed,
};
