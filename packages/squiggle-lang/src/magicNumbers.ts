export const epsilon_float = 2.22044604925031308e-16; // via pervasives.js

export const OpCost = {
  floatCost: 1,
  symbolicCost: 1000,
  //   // Discrete cost is the length of the xyShape
  mixedCost: 1000,
  continuousCost: 1000,
  //   let wildcardCost = 1000
  //   let monteCarloCost = Environment.defaultSampleCount
};

export const Epsilon = {
  ten: 1e-10,
};
