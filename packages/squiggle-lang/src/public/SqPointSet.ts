import zipWith from "lodash/zipWith";
import { SqPointSetDistribution } from "./SqDistribution";
import { ContinuousShape } from "../PointSet/Continuous";
import { DiscreteShape } from "../PointSet/Discrete";
import { MixedShape } from "../PointSet/Mixed";
import { AnyPointSet } from "../PointSet/PointSet";
import { PointSetDist } from "../dist/PointSetDist";

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

const shapePoints = (x: ContinuousShape | DiscreteShape): SqPoint[] => {
  let xs = x.xyShape.xs;
  let ys = x.xyShape.ys;
  return zipWith(xs, ys, (x, y) => ({ x, y }));
};

export const wrapPointSet = (value: AnyPointSet) => {
  if (value instanceof ContinuousShape) {
    return new SqContinuousPointSet(value);
  } else if (value instanceof DiscreteShape) {
    return new SqDiscretePointSet(value);
  } else if (value instanceof MixedShape) {
    return new SqMixedPointSet(value);
  }
  throw new Error(`Unknown PointSet shape ${value}`);
};

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
    return new SqPointSetDistribution(new PointSetDist(this.value));
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
    return new SqPointSetDistribution(new PointSetDist(this.value));
  }
}

export type SqPointSet =
  | SqMixedPointSet
  | SqDiscretePointSet
  | SqContinuousPointSet;
