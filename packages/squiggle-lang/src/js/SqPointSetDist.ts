import * as _ from "lodash";
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
  return _.zipWith(xs, ys, (x, y) => ({ x, y }));
};

export const wrapPointSetDist = (value: T) => {
  const tag = RSPointSetDist.getTag(value);

  return new tagToClass[tag](value);
};

abstract class SqAbstractPointSetDist {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }

  abstract asShape(): SqShape;
}

const valueMethod = <IR>(
  _this: SqAbstractPointSetDist,
  rsMethod: (v: T) => IR | null | undefined
) => {
  const value = rsMethod(_this._value);
  if (!value) throw new Error("Internal casting error");
  return value;
};

export class SqMixedPointSetDist extends SqAbstractPointSetDist {
  tag = Tag.Mixed as const;

  get value(): RSPointSetDist.mixedShape {
    return valueMethod(this, RSPointSetDist.getMixed);
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
    return valueMethod(this, RSPointSetDist.getDiscrete);
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
    return valueMethod(this, RSPointSetDist.getContinues);
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
