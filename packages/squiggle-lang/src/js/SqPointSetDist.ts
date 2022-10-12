import zipWith from "lodash/zipWith";
import { wrapDistribution } from "./SqDistribution";
import * as RSPointSetDist from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_PointSetDistribution.gen";
import { pointSetDistributionTag as Tag } from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_PointSetDistribution_tag";

type T = RSPointSetDist.pointSetDistribution;

export type SqPoint = { x: number; y: number };
export type SqShape = {
  continuous: SqPoint[];
  discrete: SqPoint[];
};

const shapePoints = (
  x: RSPointSetDist.continuousShape | RSPointSetDist.discreteShape
): SqPoint[] => {
  let xs = x.xyShape.xs;
  let ys = x.xyShape.ys;
  return zipWith(xs, ys, (x, y) => ({ x, y }));
};

export const wrapPointSetDist = (value: T) => {
  const tag = RSPointSetDist.getTag(value);

  return new tagToClass[tag](value);
};

abstract class SqAbstractPointSetDist {
  constructor(private _value: T) {}

  abstract asShape(): SqShape;

  protected valueMethod = <IR>(rsMethod: (v: T) => IR | null | undefined) => {
    const value = rsMethod(this._value);
    if (!value) throw new Error("Internal casting error");
    return value;
  };

  asDistribution() {
    return wrapDistribution(RSPointSetDist.toDistribution(this._value));
  }
}

export class SqMixedPointSetDist extends SqAbstractPointSetDist {
  tag = Tag.Mixed as const;

  get value(): RSPointSetDist.mixedShape {
    return this.valueMethod(RSPointSetDist.getMixed);
  }

  asShape() {
    const v = this.value;
    return {
      discrete: shapePoints(v.discrete),
      continuous: shapePoints(v.continuous),
    };
  }
}

export class SqDiscretePointSetDist extends SqAbstractPointSetDist {
  tag = Tag.Discrete as const;

  get value(): RSPointSetDist.discreteShape {
    return this.valueMethod(RSPointSetDist.getDiscrete);
  }

  asShape() {
    const v = this.value;
    return {
      discrete: shapePoints(v),
      continuous: [],
    };
  }
}

export class SqContinuousPointSetDist extends SqAbstractPointSetDist {
  tag = Tag.Continuous as const;

  get value(): RSPointSetDist.continuousShape {
    return this.valueMethod(RSPointSetDist.getContinues);
  }

  asShape() {
    const v = this.value;
    return {
      discrete: [],
      continuous: shapePoints(v),
    };
  }
}

const tagToClass = {
  [Tag.Mixed]: SqMixedPointSetDist,
  [Tag.Discrete]: SqDiscretePointSetDist,
  [Tag.Continuous]: SqContinuousPointSetDist,
} as const;

export type SqPointSetDist =
  | SqMixedPointSetDist
  | SqDiscretePointSetDist
  | SqContinuousPointSetDist;
