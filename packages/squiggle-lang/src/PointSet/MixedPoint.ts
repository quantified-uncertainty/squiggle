// MixedPoints are used to represent PDFs and scores.
export type MixedPoint = {
  continuous: number;
  discrete: number;
};

export function makeContinuous(f: number): MixedPoint {
  return {
    continuous: f,
    discrete: 0,
  };
}

export function makeDiscrete(f: number): MixedPoint {
  return {
    continuous: 0,
    discrete: f,
  };
}

export function add(p1: MixedPoint, p2: MixedPoint): MixedPoint {
  return {
    continuous: p1.continuous + p2.continuous,
    discrete: p1.discrete + p2.discrete,
  };
}
