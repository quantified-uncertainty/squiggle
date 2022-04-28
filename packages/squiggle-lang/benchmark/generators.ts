export let generateFloatRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;
export let generateIntRange = (min: number, max: number): number =>
  Math.floor(generateFloatRange(min, max));

export let generateIntMin = (min: number): number => generateIntRange(min, 100);

export let generateInt = (): number => generateIntMin(-100);

let generatePositiveInt = (): number => generateIntMin(1);

export let generateNormal = (): string =>
  `normal(${generateInt()}, ${generatePositiveInt()})`;

export let generateBeta = (): string =>
  `beta(${generatePositiveInt()}, ${generatePositiveInt()})`;

export let generateLognormal = (): string =>
  `lognormal(${generateInt()}, ${generatePositiveInt()})`;

export let generateExponential = (): string =>
  `exponential(${generatePositiveInt()})`;

export let generateUniform = (): string => {
  let a = generateInt();
  let b = generateIntMin(a + 1);
  return `uniform(${a}, ${b})`;
};
export let generateCauchy = (): string => {
  return `cauchy(${generateInt()}, ${generatePositiveInt()})`;
};

export let generateTriangular = (): string => {
  let a = generateInt();
  let b = generateIntMin(a + 1);
  let c = generateIntMin(b + 1);
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
