export const generateFloatRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;
export const generateIntRange = (min: number, max: number): number =>
  Math.floor(generateFloatRange(min, max));

export const generateIntMin = (min: number): number =>
  generateIntRange(min, 100);

export const generateInt = (): number => generateIntMin(-100);

const generatePositiveInt = (): number => generateIntMin(1);

export const generateNormal = (): string =>
  `normal(${generateInt()}, ${generatePositiveInt()})`;

export const generateBeta = (): string =>
  `beta(${generatePositiveInt()}, ${generatePositiveInt()})`;

export const generateLognormal = (): string =>
  `lognormal(${generateInt()}, ${generatePositiveInt()})`;

export const generateExponential = (): string =>
  `exponential(${generatePositiveInt()})`;

export const generateUniform = (): string => {
  const a = generateInt();
  const b = generateIntMin(a + 1);
  return `uniform(${a}, ${b})`;
};

// cauchy distributions have no mean values

// export const generateCauchy = (): string => {
//   return `cauchy(${generateInt()}, ${generatePositiveInt()})`;
// };

export const generateTriangular = (): string => {
  const a = generateInt();
  const b = generateIntMin(a + 1);
  const c = generateIntMin(b + 1);
  return `triangular(${a}, ${b}, ${c})`;
};

export const distributions: { [key: string]: () => string } = {
  normal: generateNormal,
  beta: generateBeta,
  lognormal: generateLognormal,
  exponential: generateExponential,
  triangular: generateTriangular,
  // cauchy: generateCauchy,
  uniform: generateUniform,
};
