import { shape } from "@quri/squiggle-lang";

export const hasMassBelowZero = (shape: shape) =>
  shape.continuous.some((x) => x.x <= 0) ||
  shape.discrete.some((x) => x.x <= 0);
