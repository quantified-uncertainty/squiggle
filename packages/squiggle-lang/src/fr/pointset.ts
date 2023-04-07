import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDist,
  frLambda,
  frNumber,
  frRecord,
} from "../library/registry/frTypes.js";
import * as Continuous from "../PointSet/Continuous.js";
import * as Discrete from "../PointSet/Discrete.js";
import {
  doNumberLambdaCall,
  FnFactory,
  repackDistResult,
} from "../library/registry/helpers.js";
import { PointSetDist } from "../dist/PointSetDist.js";
import { vDist, vNumber } from "../value/index.js";
import * as XYShape from "../XYShape.js";
import { xyShapeDistError } from "../dist/DistError.js";
import { BaseDist } from "../dist/BaseDist.js";
import { Ok } from "../utility/result.js";
import {
  ErrorMessage,
  REDistributionError,
  REExpectedType,
} from "../reducer/ErrorMessage.js";

const maker = new FnFactory({
  nameSpace: "PointSet",
  requiresNamespace: true,
});

const argsToXYShape = (inputs: { x: number; y: number }[]): XYShape.XYShape => {
  const result = XYShape.T.makeFromZipped(
    inputs.map(({ x, y }) => [x, y] as const)
  );
  if (!result.ok) {
    return ErrorMessage.throw(
      REDistributionError(xyShapeDistError(result.value))
    );
  }
  return result.value;
};

function pointSetAssert(dist: BaseDist): asserts dist is PointSetDist {
  if (dist instanceof PointSetDist) {
    return;
  }
  return ErrorMessage.throw(REExpectedType("PointSetDist", dist.toString()));
}

export const library = [
  maker.make({
    name: "fromDist",
    examples: [`PointSet.fromDist(normal(5,2))`],
    output: "Dist",
    definitions: [
      makeDefinition("fromDist", [frDist], ([dist], context) =>
        repackDistResult(dist.toPointSetDist(context.environment))
      ),
    ],
  }),
  maker.make({
    name: "downsample",
    examples: [`PointSet.downsample(PointSet.fromDist(normal(5,2)), 50)`],
    output: "Dist",
    definitions: [
      makeDefinition("downsample", [frDist, frNumber], ([dist, number]) => {
        pointSetAssert(dist);
        return Ok(vDist(dist.downsample(number)));
      }),
    ],
  }),
  maker.make({
    name: "mapY",
    examples: [`PointSet.mapY(mx(normal(5,2)), {|x| x + 1})`],
    output: "Dist",
    definitions: [
      makeDefinition(
        "mapY",
        [frDist, frLambda],
        ([dist, lambda], context, reducer) => {
          pointSetAssert(dist);
          return repackDistResult(
            dist.mapYResult(
              (y) =>
                Ok(doNumberLambdaCall(lambda, [vNumber(y)], context, reducer)),
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
        "makeContinuous",
        [frArray(frRecord(["x", frNumber], ["y", frNumber]))],
        ([arr]) => {
          return Ok(
            vDist(
              new PointSetDist(
                new Continuous.ContinuousShape({ xyShape: argsToXYShape(arr) })
              )
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
        "makeDiscrete",
        [frArray(frRecord(["x", frNumber], ["y", frNumber]))],
        ([arr]) => {
          return Ok(
            vDist(
              new PointSetDist(
                new Discrete.DiscreteShape({ xyShape: argsToXYShape(arr) })
              )
            )
          );
        }
      ),
    ],
  }),
];
