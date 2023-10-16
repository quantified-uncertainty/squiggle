import * as Continuous from "../PointSet/Continuous.js";
import * as Discrete from "../PointSet/Discrete.js";
import * as XYShape from "../XYShape.js";
import { BaseDist } from "../dist/BaseDist.js";
import { xyShapeDistError } from "../dist/DistError.js";
import { PointSetDist } from "../dist/PointSetDist.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDist,
  frLambda,
  frNumber,
  frDict,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  doNumberLambdaCall,
  repackDistResult,
} from "../library/registry/helpers.js";
import { REDistributionError, REExpectedType } from "../errors/messages.js";
import { Ok } from "../utility/result.js";
import { vDist, vNumber } from "../value/index.js";
import { PointMass } from "../dist/SymbolicDist.js";

const maker = new FnFactory({
  nameSpace: "PointSet",
  requiresNamespace: true,
});

const argsToXYShape = (inputs: { x: number; y: number }[]): XYShape.XYShape => {
  const result = XYShape.T.makeFromZipped(
    inputs.map(({ x, y }) => [x, y] as const)
  );
  if (!result.ok) {
    throw new REDistributionError(xyShapeDistError(result.value));
  }
  return result.value;
};

function pointSetAssert(dist: BaseDist): asserts dist is PointSetDist {
  if (dist instanceof PointSetDist) {
    return;
  }
  throw new REExpectedType("PointSetDist", dist.toString());
}

const fromDist = makeDefinition([frDist], ([dist], context) =>
  repackDistResult(dist.toPointSetDist(context.environment))
);

const fromNumber = makeDefinition([frNumber], ([num], _) => {
  const pointMass = new PointMass(num);
  return repackDistResult(pointMass.toPointSetDist());
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
      makeDefinition([frDist, frNumber], ([dist, number]) => {
        pointSetAssert(dist);
        return vDist(dist.downsample(number));
      }),
    ],
  }),
  maker.make({
    name: "mapY",
    examples: [`PointSet.mapY(mx(Sym.normal(5,2)), {|x| x + 1})`],
    output: "Dist",
    definitions: [
      makeDefinition([frDist, frLambda], ([dist, lambda], context) => {
        pointSetAssert(dist);
        return repackDistResult(
          dist.mapYResult(
            (y) => Ok(doNumberLambdaCall(lambda, [vNumber(y)], context)),
            undefined,
            undefined
          )
        );
      }),
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
        ([arr]) => {
          return vDist(
            new PointSetDist(
              new Continuous.ContinuousShape({
                xyShape: argsToXYShape(arr),
              }).toMixed()
            )
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
        ([arr]) => {
          return vDist(
            new PointSetDist(
              new Discrete.DiscreteShape({
                xyShape: argsToXYShape(arr),
              }).toMixed()
            )
          );
        }
      ),
    ],
  }),
];
