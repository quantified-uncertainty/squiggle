import uniq from "lodash/uniq.js";

import { getDefaultRng } from "../../src/rng/index.js";
import { random_sample } from "../../src/utility/math.js";

const rng = getDefaultRng();

describe("random_sample", () => {
  test("Length of random_sample", () => {
    expect(
      random_sample([1.0, 2.0], { probs: [0.5, 0.5], size: 10, rng }).length
    ).toEqual(10);
  });
  test("Random.sample returns elements from input array (will fail with very slim probability)", () => {
    expect(
      uniq(
        random_sample([1.0, 2.0], { probs: [0.5, 0.5], size: 10, rng })
      ).sort()
    ).toEqual([1, 2]);
  });
});
