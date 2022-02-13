/* TypeScript file generated from DistTypes.res by genType. */
/* eslint-disable import/first */


// tslint:disable-next-line:interface-over-type-literal
export type domainLimit = { readonly xPoint: number; readonly excludingProbabilityMass: number };

// tslint:disable-next-line:interface-over-type-literal
export type domain = 
    "Complete"
  | { tag: "LeftLimited"; value: domainLimit }
  | { tag: "RightLimited"; value: domainLimit }
  | { tag: "LeftAndRightLimited"; value: [domainLimit, domainLimit] };

// tslint:disable-next-line:interface-over-type-literal
export type xyShape = { readonly xs: number[]; readonly ys: number[] };

// tslint:disable-next-line:interface-over-type-literal
export type interpolationStrategy = "Stepwise" | "Linear";

// tslint:disable-next-line:interface-over-type-literal
export type continuousShape = {
  readonly xyShape: xyShape; 
  readonly interpolation: interpolationStrategy; 
  readonly integralSumCache?: number; 
  readonly integralCache?: continuousShape
};

// tslint:disable-next-line:interface-over-type-literal
export type discreteShape = {
  readonly xyShape: xyShape; 
  readonly integralSumCache?: number; 
  readonly integralCache?: continuousShape
};

// tslint:disable-next-line:interface-over-type-literal
export type mixedShape = {
  readonly continuous: continuousShape; 
  readonly discrete: discreteShape; 
  readonly integralSumCache?: number; 
  readonly integralCache?: continuousShape
};

// tslint:disable-next-line:interface-over-type-literal
export type shapeMonad<a,b,c> = 
    { tag: "Mixed"; value: a }
  | { tag: "Discrete"; value: b }
  | { tag: "Continuous"; value: c };

// tslint:disable-next-line:interface-over-type-literal
export type shape = shapeMonad<mixedShape,discreteShape,continuousShape>;

// tslint:disable-next-line:interface-over-type-literal
export type distributionUnit = "UnspecifiedDistribution";

// tslint:disable-next-line:interface-over-type-literal
export type distPlus = {
  readonly shape: shape; 
  readonly domain: domain; 
  readonly integralCache: continuousShape; 
  readonly unit: distributionUnit; 
  readonly squiggleString?: string
};
