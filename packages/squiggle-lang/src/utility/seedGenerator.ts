import sample from "lodash/sample.js";

import { seedWords } from "./seedWords.js";

export function generateSeed(): string {
  return [
    sample(seedWords)?.toUpperCase(),
    sample(seedWords)?.toUpperCase(),
    sample(seedWords)?.toUpperCase(),
  ].join("_");
}
