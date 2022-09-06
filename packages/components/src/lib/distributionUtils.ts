import { SqShape } from "@quri/squiggle-lang";

export const hasMassBelowZero = (shape: SqShape) =>
  shape.continuous.some((x) => x.x <= 0) ||
  shape.discrete.some((x) => x.x <= 0);
