/* TypeScript file generated from SymbolicTypes.res by genType. */
/* eslint-disable import/first */


// tslint:disable-next-line:interface-over-type-literal
export type normal = { readonly mean: number; readonly stdev: number };

// tslint:disable-next-line:interface-over-type-literal
export type lognormal = { readonly mu: number; readonly sigma: number };

// tslint:disable-next-line:interface-over-type-literal
export type uniform = { readonly low: number; readonly high: number };

// tslint:disable-next-line:interface-over-type-literal
export type beta = { readonly alpha: number; readonly beta: number };

// tslint:disable-next-line:interface-over-type-literal
export type exponential = { readonly rate: number };

// tslint:disable-next-line:interface-over-type-literal
export type cauchy = { readonly local: number; readonly scale: number };

// tslint:disable-next-line:interface-over-type-literal
export type triangular = {
  readonly low: number; 
  readonly medium: number; 
  readonly high: number
};

// tslint:disable-next-line:interface-over-type-literal
export type symbolicDist = 
    { NAME: "Normal"; VAL: normal }
  | { NAME: "Beta"; VAL: beta }
  | { NAME: "Lognormal"; VAL: lognormal }
  | { NAME: "Uniform"; VAL: uniform }
  | { NAME: "Exponential"; VAL: exponential }
  | { NAME: "Cauchy"; VAL: cauchy }
  | { NAME: "Triangular"; VAL: triangular }
  | { NAME: "Float"; VAL: number };
