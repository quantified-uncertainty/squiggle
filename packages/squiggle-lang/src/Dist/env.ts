import * as magicNumbers from "../magicNumbers";

export type Env = {
  sampleCount: number; // int
  xyPointLength: number; // int
};

export const defaultEnv: Env = {
  sampleCount: magicNumbers.Environment.defaultSampleCount,
  xyPointLength: magicNumbers.Environment.defaultXYPointLength,
};
