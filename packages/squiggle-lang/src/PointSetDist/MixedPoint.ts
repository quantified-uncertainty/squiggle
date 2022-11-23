export type MixedPoint = {
  continuous: number;
  discrete: number;
};

export const makeContinuous = (f: number): MixedPoint => ({
  continuous: f,
  discrete: 0,
});

export const makeDiscrete = (f: number): MixedPoint => ({
  continuous: 0,
  discrete: f,
});
