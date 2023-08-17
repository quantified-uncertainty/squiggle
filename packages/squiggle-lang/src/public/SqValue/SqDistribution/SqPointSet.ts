import zipWith from "lodash/zipWith.js";

import { PointSetDist } from "../../../dist/PointSetDist.js";
import { ContinuousShape } from "../../../PointSet/Continuous.js";
import { DiscreteShape } from "../../../PointSet/Discrete.js";
import { MixedShape } from "../../../PointSet/Mixed.js";
import { AnyPointSet } from "../../../PointSet/PointSet.js";

import { SqPointSetDistribution } from "./index.js";

enum Tag {
  Mixed = "Mixed",
  Discrete = "Discrete",
  Continuous = "Continuous",
}

export type SqPoint = { x: number; y: number };
export type SqShape = {
  continuous: SqPoint[];
  discrete: SqPoint[];
};

function shapePoints(x: ContinuousShape | DiscreteShape): SqPoint[] {
  const xs = x.xyShape.xs;
  const ys = x.xyShape.ys;
  return zipWith(xs, ys, (x, y) => ({ x, y }));
}

export function wrapPointSet(value: AnyPointSet) {
  if (value instanceof ContinuousShape) {
    return new SqContinuousPointSet(value);
  } else if (value instanceof DiscreteShape) {
    return new SqDiscretePointSet(value);
  } else if (value instanceof MixedShape) {
    return new SqMixedPointSet(value);
  }
  throw new Error(`Unknown PointSet shape ${value}`);
}

abstract class SqAbstractPointSet<S extends AnyPointSet> {
  constructor(_value: S) {}

  abstract get value(): S;
  abstract asShape(): SqShape;

  abstract asDistribution(): SqPointSetDistribution;
}

export class SqMixedPointSet implements SqAbstractPointSet<MixedShape> {
  tag = Tag.Mixed as const;
  constructor(private _value: MixedShape) {}

  get value(): MixedShape {
    return this._value;
  }

  asShape() {
    const v = this.value;
    return {
      discrete: shapePoints(v.discrete),
      continuous: shapePoints(v.continuous),
    };
  }

  asDistribution(): SqPointSetDistribution {
    return new SqPointSetDistribution(new PointSetDist(this.value));
  }
}

export class SqDiscretePointSet implements SqAbstractPointSet<DiscreteShape> {
  tag = Tag.Discrete as const;
  constructor(private _value: DiscreteShape) {}

  get value(): DiscreteShape {
    return this._value;
  }

  asShape() {
    const v = this.value;
    return {
      discrete: shapePoints(v),
      continuous: [],
    };
  }

  asDistribution(): SqPointSetDistribution {
    return new SqPointSetDistribution(new PointSetDist(this.value.toMixed()));
  }
}

export class SqContinuousPointSet
  implements SqAbstractPointSet<ContinuousShape>
{
  tag = Tag.Continuous as const;
  constructor(private _value: ContinuousShape) {}

  get value(): ContinuousShape {
    return this._value;
  }

  asShape() {
    const v = this.value;
    return {
      discrete: [],
      continuous: shapePoints(v),
    };
  }

  asDistribution(): SqPointSetDistribution {
    return new SqPointSetDistribution(new PointSetDist(this.value.toMixed()));
  }
}

export type SqPointSet =
  | SqMixedPointSet
  | SqDiscretePointSet
  | SqContinuousPointSet;
