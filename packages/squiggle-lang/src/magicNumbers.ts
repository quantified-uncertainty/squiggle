export const epsilon_float = 2.22044604925031308e-16; // via pervasives.js

export const Environment = {
  defaultXYPointLength: 1000,
  defaultSampleCount: 10000,
  sparklineLength: 20,
};

export const OpCost = {
  floatCost: 1,
  symbolicCost: 1000,
  //   // Discrete cost is the length of the xyShape
  mixedCost: 1000,
  continuousCost: 1000,
  wildcardCost: 1000,
  monteCarloCost: Environment.defaultSampleCount,
};

export const Epsilon = {
  ten: 1e-10,
};
