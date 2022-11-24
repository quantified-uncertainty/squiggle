import { ContinuousShape } from "./Continuous";
import { DiscreteShape } from "./Discrete";
import { MixedShape } from "./Mixed";
import { AnyPointSet } from "./PointSet";

export const buildSimple = ({
  continuous,
  discrete,
}: {
  continuous?: ContinuousShape;
  discrete?: DiscreteShape;
}): AnyPointSet | undefined => {
  continuous ??= new ContinuousShape({
    integralSumCache: 0,
    xyShape: { xs: [], ys: [] },
  });
  discrete ??= new DiscreteShape({
    integralSumCache: 0,
    xyShape: { xs: [], ys: [] },
  });
  const cLength = continuous.xyShape.xs.length;
  const dLength = discrete.xyShape.xs.length;
  if (cLength < 2 && dLength == 0) {
    return undefined;
  } else if (cLength < 2) {
    return discrete;
  } else if (dLength == 0) {
    return continuous;
  } else {
    const mixedDist = new MixedShape({ continuous, discrete });
    return mixedDist;
  }
};
