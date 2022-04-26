let generateFloat = (): number => Math.random() * 200 - 100;

let generatePositive = (): number => Math.random() * 100;

export let generateNormal = (): string =>
  `normal(${generateFloat()}, ${generatePositive()})`;

export let generateBeta = (): string =>
  `beta(${generatePositive()}, ${generatePositive()})`;

export let generateLognormal = (): string =>
  `lognormal(${generateFloat()}, ${generatePositive()})`;
