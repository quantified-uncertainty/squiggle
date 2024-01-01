import { xyShapeDistError } from "../dist/DistError.js";
import { PointSetDist } from "../dist/PointSetDist.js";
import { PointMass } from "../dist/SymbolicDist.js";
import { REDistributionError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDict,
  frDist,
  frDistPointset,
  frLambdaTyped,
  frNamed,
  frNumber,
} from "../library/registry/frTypes.js";
import {
  doNumberLambdaCall,
  FnFactory,
  unwrapDistResult,
} from "../library/registry/helpers.js";
import * as Continuous from "../PointSet/Continuous.js";
import * as Discrete from "../PointSet/Discrete.js";
import { Ok } from "../utility/result.js";
import { vNumber } from "../value/index.js";
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
    throw new REDistributionError(xyShapeDistError(result.value));
  }
  return result.value;
};

const fromDist = makeDefinition([frDist], frDistPointset, ([dist], context) =>
  unwrapDistResult(dist.toPointSetDist(context.environment))
);

const fromNumber = makeDefinition([frNumber], frDistPointset, ([num], _) => {
  const pointMass = new PointMass(num);
  return unwrapDistResult(pointMass.toPointSetDist());
});

export const library = [
  maker.make({
    name: "fromDist",
    examples: [`PointSet.fromDist(normal(5,2))`],
    output: "Dist",
    definitions: [fromDist],
  }),
  maker.make({
    name: "fromNumber",
    examples: [`PointSet.fromNumber(3)`],
    output: "Dist",
    definitions: [fromNumber],
  }),
  maker.make({
    name: "make",
    examples: [`PointSet.make(normal(5,10))`, `PointSet.make(3)`],
    output: "Dist",
    definitions: [fromDist, fromNumber],
  }),
  maker.make({
    name: "downsample",
    examples: [`PointSet.downsample(PointSet.fromDist(normal(5,2)), 50)`],
    output: "Dist",
    definitions: [
      makeDefinition(
        [frDistPointset, frNamed("newLength", frNumber)],
        frDistPointset,
        ([dist, number]) => {
          return dist.downsample(number);
        }
      ),
    ],
  }),
  maker.make({
    name: "mapY",
    examples: [`PointSet.mapY(mx(Sym.normal(5,2)), {|x| x + 1})`],
    output: "Dist",
    definitions: [
      makeDefinition(
        [frDistPointset, frNamed("fn", frLambdaTyped([frNumber], frNumber))],
        frDistPointset,
        ([dist, lambda], context) => {
          return unwrapDistResult(
            dist.mapYResult(
              (y) => Ok(doNumberLambdaCall(lambda, [vNumber(y)], context)),
              undefined,
              undefined
            )
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "makeContinuous",
    examples: [
      `PointSet.makeContinuous([
  {x: 0, y: 0.2},
  {x: 1, y: 0.7},
  {x: 2, y: 0.8},
  {x: 3, y: 0.2}
])`,
    ],
    output: "Dist",
    definitions: [
      makeDefinition(
        [frArray(frDict(["x", frNumber], ["y", frNumber]))],
        frDistPointset,
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
      `PointSet.makeDiscrete([
  {x: 0, y: 0.2},
  {x: 1, y: 0.7},
  {x: 2, y: 0.8},
  {x: 3, y: 0.2}
])`,
    ],
    output: "Dist",
    definitions: [
      makeDefinition(
        [frArray(frDict(["x", frNumber], ["y", frNumber]))],
        frDistPointset,
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
];
