import {
  distributions,
  generateInt,
  generateFloatRange,
} from "./generators.js";
import { test, expectEqual } from "./lib.js";

// This script is pretty old and it's unclear how useful it is.
// It should probably be converted to the jest test.

const checkDistributionSame = async (
  distribution: string,
  operation: (arg: string) => string
) => {
  await expectEqual(
    operation(distribution),
    operation(`PointSet.fromDist(${distribution})`)
  );
  await expectEqual(
    operation(distribution),
    operation(`SampleSet.fromDist(${distribution})`)
  );
};

Object.entries(distributions).map(([key, generator]) => {
  const distribution = generator();
  test(`mean is the same for ${key} distribution under all distribution types`, async () =>
    await checkDistributionSame(distribution, (d: string) => `mean(${d})`));

  test(`cdf is the same for ${key} distribution under all distribution types`, async () => {
    const cdf_value = generateInt();
    await checkDistributionSame(
      distribution,
      (d: string) => `cdf(${d}, ${cdf_value})`
    );
  });

  test(`pdf is the same for ${key} distribution under all distribution types`, async () => {
    const pdf_value = generateInt();
    await checkDistributionSame(
      distribution,
      (d: string) => `pdf(${d}, ${pdf_value})`
    );
  });

  test(`inv is the same for ${key} distribution under all distribution types`, async () => {
    const inv_value = generateFloatRange(0, 1);
    await checkDistributionSame(
      distribution,
      (d: string) => `inv(${d}, ${inv_value})`
    );
  });
});
