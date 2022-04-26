export let generateFloatRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min) + min);

export let generateFloatMin = (min: number): number =>
  generateFloatRange(min, 100);

export let generateFloat = (): number => generateFloatMin(-100);

let generatePositive = (): number => generateFloatMin(1);

export let generateNormal = (): string =>
  `normal(${generateFloat()}, ${generatePositive()})`;

export let generateBeta = (): string =>
  `beta(${generatePositive()}, ${generatePositive()})`;

export let generateLognormal = (): string =>
  `lognormal(${generateFloat()}, ${generatePositive()})`;

export let generateExponential = (): string =>
  `exponential(${generatePositive()})`;

export let generateUniform = (): string => {
  let a = generateFloat();
  let b = generateFloatMin(a + 1);
  return `uniform(${a}, ${b})`;
};
export let generateCauchy = (): string => {
  return `cauchy(${generateFloat()}, ${generatePositive()})`;
};

export let generateTriangular = (): string => {
  let a = generateFloat();
  let b = generateFloatMin(a + 1);
  let c = generateFloatMin(b + 1);
  return `triangular(${a}, ${b}, ${c})`;
};

export let distributions: { [key: string]: () => string } = {
  normal: generateNormal,
  beta: generateBeta,
  lognormal: generateLognormal,
  exponential: generateExponential,
  triangular: generateTriangular,
  cauchy: generateCauchy,
  uniform: generateUniform,
};
