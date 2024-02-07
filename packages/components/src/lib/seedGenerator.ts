import sample from "lodash/sample.js";

import { seedWords } from "./seedWords.js";

export function randomSeed(): string {
  return [sample(seedWords), sample(seedWords), sample(seedWords)].join("_");
}
