export const epsilon_float = 2.22044604925031308e-16; // via pervasives.js

export const Environment = {
  defaultXYPointLength: 1000,
  defaultSampleCount: 1000,
  sparklineLength: 20,
};

export const OpCost = {
  floatCost: 1,
  // FIXME - these depend on runtime env and other variables and shouldn't be global
  symbolicCost: 1000,
  wildcardCost: 1000,
};

export const Epsilon = {
  ten: 1e-10,
};
