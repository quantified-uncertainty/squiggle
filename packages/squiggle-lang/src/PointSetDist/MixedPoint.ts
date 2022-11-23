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

export const add = (p1: MixedPoint, p2: MixedPoint): MixedPoint => ({
  continuous: p1.continuous + p2.continuous,
  discrete: p1.discrete + p2.discrete,
});
