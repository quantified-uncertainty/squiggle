import { distributions, generateFloat, generateFloatRange } from "./generators";
import { test, expectEqual } from "./lib";

let checkDistributionSame = (
  distribution: string,
  operation: (arg: string) => string
): void => {
  expectEqual(
    operation(distribution),
    operation(`toPointSet(${distribution})`)
  );
  expectEqual(
    operation(distribution),
    operation(`toSampleSet(${distribution})`)
  );
};

Object.entries(distributions).map(([key, generator]) => {
  let distribution = generator();
  test(`mean is the same for ${key} distribution under all distribution types`, () =>
    checkDistributionSame(distribution, (d: string) => `mean(${d})`));

  test(`cdf is the same for ${key} distribution under all distribution types`, () => {
    let cdf_value = generateFloat();
    checkDistributionSame(
      distribution,
      (d: string) => `cdf(${d}, ${cdf_value})`
    );
  });

  test(`pdf is the same for ${key} distribution under all distribution types`, () => {
    let pdf_value = generateFloat();
    checkDistributionSame(
      distribution,
      (d: string) => `pdf(${d}, ${pdf_value})`
    );
  });

  test(`inv is the same for ${key} distribution under all distribution types`, () => {
    let inv_value = generateFloatRange(0, 1);
    checkDistributionSame(
      distribution,
      (d: string) => `inv(${d}, ${inv_value})`
    );
  });
});
