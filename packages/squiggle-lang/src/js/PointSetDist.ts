import * as _ from "lodash";
import * as RSPointSetDist from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_PointSetDistribution.gen";
import { pointSetDistributionTag as Tag } from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_PointSetDistribution_tag";

type T = RSPointSetDist.pointSetDistribution;

export type point = { x: number; y: number };
type shape = {
  continuous: point[];
  discrete: point[];
};

const shapePoints = (
  x: RSPointSetDist.continuousShape | RSPointSetDist.discreteShape
): point[] => {
  let xs = x.xyShape.xs;
  let ys = x.xyShape.ys;
  return _.zipWith(xs, ys, (x, y) => ({ x, y }));
};

export const wrapPointSetDist = (value: T) => {
  const tag = RSPointSetDist.getTag(value);

  return new tagToClass[tag](value);
};

abstract class AbstractPointSetDist {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }

  abstract asShape(): shape;
}

const valueMethod = <IR>(
  _this: AbstractPointSetDist,
  rsMethod: (v: T) => IR | null | undefined
) => {
  const value = rsMethod(_this._value);
  if (!value) throw new Error("Internal casting error");
  return value;
};

export class MixedPointSetDist extends AbstractPointSetDist {
  tag = Tag.PstMixed as const;

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

export class DiscretePointSetDist extends AbstractPointSetDist {
  tag = Tag.PstDiscrete as const;

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

export class ContinuousPointSetDist extends AbstractPointSetDist {
  tag = Tag.PstContinuous as const;

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
  [Tag.PstMixed]: MixedPointSetDist,
  [Tag.PstDiscrete]: DiscretePointSetDist,
  [Tag.PstContinuous]: ContinuousPointSetDist,
} as const;

export type PointSetDist =
  | MixedPointSetDist
  | DiscretePointSetDist
  | ContinuousPointSetDist;
