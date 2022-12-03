import { toSampleSetDist } from "../dist/DistOperations";
import * as SampleSetDist from "../dist/SampleSetDist/SampleSetDist";
import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frArray,
  frDist,
  frLambda,
  frNumber,
} from "../library/registry/frTypes";
import {
  doNumberLambdaCall,
  FnFactory,
  repackDistResult,
  unpackDistResult,
} from "../library/registry/helpers";
import { Ok } from "../utility/result";
import { vArray, vNumber } from "../value";
import { BaseDist } from "../dist/BaseDist";
import { ErrorMessage, REExpectedType } from "../reducer/ErrorMessage";

const maker = new FnFactory({
  nameSpace: "SampleSet",
  requiresNamespace: true,
});

// "asserts x is type doesn't work when using arrow functions"
// https://github.com/microsoft/TypeScript/issues/34523
function sampleSetAssert(
  dist: BaseDist
): asserts dist is SampleSetDist.SampleSetDist {
  if (dist instanceof SampleSetDist.SampleSetDist) {
    return;
  }
  return ErrorMessage.throw(REExpectedType("SampleSetDist", dist.toString()));
}

const baseLibrary = [
  maker.d2d({
    name: "fromDist",
    examples: [`SampleSet.fromDist(normal(5,2))`],
    fn: (dist, env) => unpackDistResult(toSampleSetDist(dist, env)),
  }),
  maker.make({
    name: "fromList",
    examples: [`SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])`],
    output: "Dist",
    definitions: [
      makeDefinition("fromList", [frArray(frNumber)], ([numbers]) =>
        repackDistResult(SampleSetDist.SampleSetDist.make(numbers))
      ),
    ],
  }),
  maker.make({
    name: "toList",
    examples: [`SampleSet.toList(SampleSet.fromDist(normal(5,2)))`],
    output: "Array",
    definitions: [
      makeDefinition("toList", [frDist], ([dist]) => {
        sampleSetAssert(dist);
        return Ok(vArray(dist.samples.map(vNumber)));
      }),
    ],
  }),
  maker.make({
    name: "fromFn",
    examples: [`SampleSet.fromFn({|| sample(normal(5,2))})`],
    output: "Dist",
    definitions: [
      makeDefinition("fromFn", [frLambda], ([lambda], context, reducer) =>
        repackDistResult(
          SampleSetDist.SampleSetDist.fromFn((i: number) => {
            return doNumberLambdaCall(lambda, [vNumber(i)], context, reducer);
          }, context.environment)
        )
      ),
    ],
  }),
  maker.make({
    name: "map",
    examples: [`SampleSet.map(SampleSet.fromDist(normal(5,2)), {|x| x + 1})`],
    output: "Dist",
    definitions: [
      makeDefinition(
        "map",
        [frDist, frLambda],
        ([dist, lambda], context, reducer) => {
          sampleSetAssert(dist);
          return repackDistResult(
            dist.samplesMap((r) =>
              Ok(doNumberLambdaCall(lambda, [vNumber(r)], context, reducer))
            )
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "map2",
    examples: [
      `SampleSet.map2(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), {|x, y| x + y})`,
    ],
    output: "Dist",
    definitions: [
      makeDefinition(
        "map2",
        [frDist, frDist, frLambda],
        ([dist1, dist2, lambda], context, reducer) => {
          sampleSetAssert(dist1);
          sampleSetAssert(dist2);
          return repackDistResult(
            SampleSetDist.map2({
              fn: (a, b) =>
                Ok(
                  doNumberLambdaCall(
                    lambda,
                    [vNumber(a), vNumber(b)],
                    context,
                    reducer
                  )
                ),
              t1: dist1,
              t2: dist2,
            })
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "map3",
    examples: [
      `SampleSet.map3(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), {|x, y, z| max([x,y,z])})`,
    ],
    output: "Dist",
    definitions: [
      makeDefinition(
        "map3",
        [frDist, frDist, frDist, frLambda],
        ([dist1, dist2, dist3, lambda], context, reducer) => {
          sampleSetAssert(dist1);
          sampleSetAssert(dist2);
          sampleSetAssert(dist3);
          return repackDistResult(
            SampleSetDist.map3({
              fn: (a, b, c) =>
                Ok(
                  doNumberLambdaCall(
                    lambda,
                    [vNumber(a), vNumber(b), vNumber(c)],
                    context,
                    reducer
                  )
                ),
              t1: dist1,
              t2: dist2,
              t3: dist3,
            })
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "mapN",
    examples: [
      `SampleSet.mapN([SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2))], {|x| max(x)})`,
    ],
    output: "Dist",
    definitions: [
      makeDefinition(
        "mapN",
        [frArray(frDist), frLambda],
        ([dists, lambda], context, reducer) => {
          const sampleSetDists = dists.map((d) => {
            sampleSetAssert(d);
            return d;
          });
          return repackDistResult(
            SampleSetDist.mapN({
              fn: (a) =>
                Ok(
                  doNumberLambdaCall(
                    lambda,
                    [vArray(a.map(vNumber))],
                    context,
                    reducer
                  )
                ),
              t1: sampleSetDists,
            })
          );
        }
      ),
    ],
  }),
];

const mkComparison = (
  name: string,
  withDist: SampleSetDist.CompareTwoDistsFn,
  withFloat: SampleSetDist.CompareDistWithFloatFn
) =>
  maker.make({
    name,
    requiresNamespace: false,
    examples: [
      `SampleSet.${name}(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(6,2)))`,
      `SampleSet.${name}(SampleSet.fromDist(normal(5,2)), 3.0)`,
      `SampleSet.${name}(4.0, SampleSet.fromDist(normal(6,2)))`,
    ],
    output: "Dist",
    definitions: [
      makeDefinition(name, [frDist, frDist], ([dist1, dist2]) => {
        sampleSetAssert(dist1);
        sampleSetAssert(dist2);
        return repackDistResult(withDist(dist1, dist2));
      }),
      makeDefinition(name, [frDist, frNumber], ([dist, f]) => {
        sampleSetAssert(dist);
        return repackDistResult(withFloat(dist, f));
      }),
      makeDefinition(name, [frNumber, frDist], ([f, dist]) => {
        sampleSetAssert(dist);
        return repackDistResult(withFloat(dist, f));
      }),
    ],
  });

const comparisonLibrary = [
  mkComparison("min", SampleSetDist.minOfTwo, SampleSetDist.minOfFloat),
  mkComparison("max", SampleSetDist.maxOfTwo, SampleSetDist.maxOfFloat),
];

export const library = [...baseLibrary, ...comparisonLibrary];
