export type MixedPoint = {
  continuous: number;
  discrete: number;
};

export const makeContinuous = (f: number): MixedPoint => ({
  continuous: f,
  discrete: 0,
});

export const makeMixed = (f: number): MixedPoint => ({
  continuous: f,
  discrete: 0,
});
