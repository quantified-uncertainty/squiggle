export let generateFloat = (): number => Math.random() * 200 - 100;
export let generateFloatMin = (min:number): number => Math.random() * (100 - min) + min;
export let generateFloatRange = (min:number, max: number): number => Math.random() * (max - min) + min;

let generatePositive = (): number => Math.random() * 100;

export let generateNormal = (): string =>
  `normal(${generateFloat()}, ${generatePositive()})`;

export let generateBeta = (): string =>
  `beta(${generatePositive()}, ${generatePositive()})`;

export let generateLognormal = (): string =>
  `lognormal(${generateFloat()}, ${generatePositive()})`;

export let generateExponential = (): string =>
  `exponential(${generatePositive()})`;

export let generateUniform = (): string => {
  let a = generateFloat()
  let b = generateFloatMin(a)
  return `uniform(${a}, ${b})`
}
export let generateCauchy = (): string => {
  return `cauchy(${generateFloat()}, ${generatePositive()})`
}

export let generateTriangular = (): string => {
  let a = generateFloat()
  let b = generateFloatMin(a)
  let c = generateFloatMin(b)
  return `triangular(${a}, ${b}, ${c})`
}

export let distributions : {[key: string]: () => string} = { 
  normal: generateNormal, 
  beta: generateBeta, 
  lognormal: generateLognormal, 
  exponential: generateExponential, 
  triangular: generateTriangular ,
  cauchy: generateCauchy,
  uniform: generateUniform
}

