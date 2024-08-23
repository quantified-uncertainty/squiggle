import { xyShapeDistError } from "../dists/DistError.js";
import { PointSetDist } from "../dists/PointSetDist.js";
import { PointMass } from "../dists/SymbolicDist/PointMass.js";
import { ErrorMessage } from "../errors/messages.js";
import { namedInput } from "../library/FrInput.js";
import {
  frArray,
  frDict,
  frDist,
  frMixedSet,
  frNumber,
  frPointSetDist,
  frTypedLambda,
} from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  doNumberLambdaCall,
  FnFactory,
  unwrapDistResult,
} from "../library/registry/helpers.js";
import * as Continuous from "../PointSet/Continuous.js";
import * as Discrete from "../PointSet/Discrete.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { tNumber } from "../types/TIntrinsic.js";
import { Ok } from "../utility/result.js";
import { vNumber } from "../value/VNumber.js";
import * as XYShape from "../XYShape.js";

const maker = new FnFactory({
  nameSpace: "PointSet",
  requiresNamespace: true,
});

const argsToXYShape = (
  inputs: readonly { x: number; y: number }[]
): XYShape.XYShape => {
  const result = XYShape.T.makeFromZipped(
    inputs.map(({ x, y }) => [x, y] as const)
  );
  if (!result.ok) {
    throw ErrorMessage.distributionError(xyShapeDistError(result.value));
  }
  return result.value;
};

const fromDist = makeDefinition([frDist], frPointSetDist, ([dist], reducer) =>
  unwrapDistResult(dist.toPointSetDist(reducer.environment))
);

const fromNumber = makeDefinition([frNumber], frPointSetDist, ([num], _) => {
  const pointMass = new PointMass(num);
  return unwrapDistResult(pointMass.toPointSetDist());
});

export const library = [
  maker.make({
    name: "make",
    examples: [
      makeFnExample(`PointSet.make(normal(5,10))`),
      makeFnExample(`PointSet(3)`),
    ],
    displaySection: "Constructors",
    definitions: [fromDist, fromNumber],
  }),
  maker.make({
    name: "fromDist",
    description:
      "Converts the distribution in question into a point set distribution. If the distribution is symbolic, then it does this by taking the quantiles. If the distribution is a sample set, then it uses a version of kernel density estimation to approximate the point set format. One complication of this latter process is that if there is a high proportion of overlapping samples (samples that are exactly the same as each other), it will convert these samples into discrete point masses. Eventually we'd like to add further methods to help adjust this process.",
    examples: [makeFnExample(`PointSet.fromDist(normal(5,2))`)],
    displaySection: "Conversions",
    definitions: [fromDist],
  }),
  maker.make({
    name: "fromNumber",
    examples: [makeFnExample(`PointSet.fromNumber(3)`)],
    displaySection: "Conversions",
    definitions: [fromNumber],
  }),
  maker.make({
    name: "downsample",
    examples: [
      makeFnExample(`PointSet.downsample(PointSet.fromDist(normal(5,2)), 50)`),
    ],
    displaySection: "Conversions",
    definitions: [
      makeDefinition(
        [frPointSetDist, namedInput("newLength", frNumber)],
        frPointSetDist,
        ([dist, number]) => {
          return dist.downsample(number);
        }
      ),
    ],
  }),
  maker.make({
    name: "support",
    examples: [
      makeFnExample(`PointSet.support(PointSet.fromDist(normal(5,2)))`),
    ],
    displaySection: "Conversions",
    definitions: [
      makeDefinition([frPointSetDist], frMixedSet, ([dist]) => {
        const support = dist.support();
        return {
          points: support.numberSet.numbers,
          segments: support.rangeSet.ranges.map(
            ([start, end]) => [start, end] as [number, number]
          ),
        };
      }),
    ],
  }),
  maker.make({
    name: "makeContinuous",
    examples: [
      makeFnExample(`PointSet.makeContinuous([
  {x: 0, y: 0.2},
  {x: 1, y: 0.7},
  {x: 2, y: 0.8},
  {x: 3, y: 0.2}
])`),
    ],
    displaySection: "Constructors",
    definitions: [
      makeDefinition(
        [frArray(frDict(["x", frNumber], ["y", frNumber]))],
        frPointSetDist,
        ([arr]) => {
          return new PointSetDist(
            new Continuous.ContinuousShape({
              xyShape: argsToXYShape(arr),
            }).toMixed()
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "makeDiscrete",
    examples: [
      makeFnExample(`PointSet.makeDiscrete([
  {x: 0, y: 0.2},
  {x: 1, y: 0.7},
  {x: 2, y: 0.8},
  {x: 3, y: 0.2}
])`),
    ],
    displaySection: "Constructors",
    definitions: [
      makeDefinition(
        [frArray(frDict(["x", frNumber], ["y", frNumber]))],
        frPointSetDist,
        ([arr]) => {
          return new PointSetDist(
            new Discrete.DiscreteShape({
              xyShape: argsToXYShape(arr),
            }).toMixed()
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "mapY",
    examples: [
      makeFnExample(`PointSet.mapY(mx(Sym.normal(5,2)), {|x| x + 1})`),
    ],
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [frPointSetDist, namedInput("fn", frTypedLambda([tNumber], tNumber))],
        frPointSetDist,
        ([dist, lambda], reducer) => {
          return unwrapDistResult(
            dist.mapYResult(
              (y) => Ok(doNumberLambdaCall(lambda, [vNumber(y)], reducer)),
              undefined,
              undefined
            )
          );
        }
      ),
    ],
  }),
];
