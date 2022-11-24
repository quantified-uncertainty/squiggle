import zipWith from "lodash/zipWith";
import { SqPointSetDistribution } from "./SqDistribution";
import { ContinuousShape } from "../PointSetDist/Continuous";
import { DiscreteShape } from "../PointSetDist/Discrete";
import { MixedShape } from "../PointSetDist/Mixed";
import * as PointSetDist from "../PointSetDist/PointSetDist";
import {
  toDistribution,
  pointSetDistribution,
} from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_PointSetDistribution.gen";

type T = PointSetDist.PointSetDist;

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

export const wrapPointSetDist = (value: pointSetDistribution) => {
  const tsValue = value as unknown as PointSetDist.PointSetDist;
  switch (tsValue.type) {
    case "Continuous":
      return new SqContinuousPointSetDist(tsValue.value);
    case "Mixed":
      return new SqMixedPointSetDist(tsValue.value);
    case "Discrete":
      return new SqDiscretePointSetDist(tsValue.value);
    default:
      throw new Error("Internal error");
  }
};

abstract class SqAbstractPointSetDist<S> {
  constructor(_value: S) {}

  abstract get value(): S;
  abstract asShape(): SqShape;

  abstract asDistribution(): SqPointSetDistribution;
}

export class SqMixedPointSetDist implements SqAbstractPointSetDist<MixedShape> {
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
    return new SqPointSetDistribution(
      toDistribution(
        PointSetDist.makeMixed(this._value) as unknown as pointSetDistribution
      )
    );
  }
}

export class SqDiscretePointSetDist
  implements SqAbstractPointSetDist<DiscreteShape>
{
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
    return new SqPointSetDistribution(
      toDistribution(
        PointSetDist.makeDiscrete(
          this._value
        ) as unknown as pointSetDistribution
      )
    );
  }
}

export class SqContinuousPointSetDist
  implements SqAbstractPointSetDist<ContinuousShape>
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
    return new SqPointSetDistribution(
      toDistribution(
        PointSetDist.makeContinuous(
          this._value
        ) as unknown as pointSetDistribution
      )
    );
  }
}

export type SqPointSetDist =
  | SqMixedPointSetDist
  | SqDiscretePointSetDist
  | SqContinuousPointSetDist;
