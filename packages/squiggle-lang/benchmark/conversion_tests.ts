import { generateNormal } from "./generators";
import { test, expectEqual } from "./lib";

test("mean is the same under point set transform", () => {
  let normal = generateNormal();
  let symbolicMean = `mean(${normal})`;
  let pointSetMean = `mean(toPointSet(${normal}))`;
  return expectEqual(symbolicMean, pointSetMean);
});
