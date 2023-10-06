import { BaseDist } from "../dist/BaseDist.js";
import * as SampleSetDist from "../dist/SampleSetDist/index.js";
import {
  FnDefinition,
  makeDefinition,
} from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDist,
  frLambda,
  frLambdaN,
  frNumber,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  doNumberLambdaCall,
  repackDistResult,
} from "../library/registry/helpers.js";
import { REExpectedType } from "../errors/messages.js";
import { Ok } from "../utility/result.js";
import { vArray, vNumber, Value } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "SampleSet",
  requiresNamespace: true,
});

// "asserts x is type doesn't work when using arrow functions"
// https://github.com/microsoft/TypeScript/issues/34523
export function sampleSetAssert(
  dist: BaseDist
): asserts dist is SampleSetDist.SampleSetDist {
  if (dist instanceof SampleSetDist.SampleSetDist) {
    return;
  }
  throw new REExpectedType("SampleSetDist", dist.toString());
}

const fromDist = makeDefinition([frDist], ([dist], { environment }) =>
  repackDistResult(SampleSetDist.SampleSetDist.fromDist(dist, environment))
);

const fromNumber = makeDefinition([frNumber], ([number], context) =>
  repackDistResult(
    SampleSetDist.SampleSetDist.make(
      new Array(context.environment.sampleCount).fill(number)
    )
  )
);

const fromList = makeDefinition([frArray(frNumber)], ([numbers]) =>
  repackDistResult(SampleSetDist.SampleSetDist.make(numbers))
);

const fromFn = (lambda: any, context: any, fn: (i: number) => Value[]) =>
  repackDistResult(
    SampleSetDist.SampleSetDist.fromFn((index) => {
      return doNumberLambdaCall(lambda, fn(index), context);
    }, context.environment)
  );

const fromFnDefinitions: FnDefinition[] = [
  makeDefinition([frLambdaN(0)], ([lambda], context) => {
    return fromFn(lambda, context, () => []);
  }),
  makeDefinition([frLambdaN(1)], ([lambda], context) => {
    return fromFn(lambda, context, (index) => [vNumber(index)]);
  }),
];

const baseLibrary = [
  maker.make({
    name: "fromDist",
    examples: [`SampleSet.fromDist(normal(5,2))`],
    definitions: [fromDist],
  }),
  maker.make({
    name: "fromNumber",
    examples: [`SampleSet.fromNumber(3)`],
    definitions: [fromNumber],
  }),
  maker.make({
    name: "fromList",
    examples: [`SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])`],
    output: "Dist",
    definitions: [fromList],
  }),
  maker.make({
    name: "toList",
    examples: [`SampleSet.toList(SampleSet.fromDist(normal(5,2)))`],
    output: "Array",
    definitions: [
      makeDefinition([frDist], ([dist]) => {
        sampleSetAssert(dist);
        return vArray(dist.samples.map(vNumber));
      }),
    ],
  }),
  maker.make({
    name: "fromFn",
    examples: [`SampleSet.fromFn({|i| sample(normal(5,2))})`],
    output: "Dist",
    definitions: fromFnDefinitions,
  }),
  maker.make({
    name: "make",
    output: "Dist",
    definitions: [fromDist, fromNumber, fromList, ...fromFnDefinitions],
  }),
  maker.make({
    name: "map",
    examples: [`SampleSet.map(SampleSet.fromDist(normal(5,2)), {|x| x + 1})`],
    output: "Dist",
    definitions: [
      makeDefinition([frDist, frLambda], ([dist, lambda], context) => {
        sampleSetAssert(dist);
        return repackDistResult(
          dist.samplesMap((r) =>
            Ok(doNumberLambdaCall(lambda, [vNumber(r)], context))
          )
        );
      }),
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
        [frDist, frDist, frLambda],
        ([dist1, dist2, lambda], context) => {
          sampleSetAssert(dist1);
          sampleSetAssert(dist2);
          return repackDistResult(
            SampleSetDist.map2({
              fn: (a, b) =>
                Ok(
                  doNumberLambdaCall(lambda, [vNumber(a), vNumber(b)], context)
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
        [frDist, frDist, frDist, frLambda],
        ([dist1, dist2, dist3, lambda], context) => {
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
                    context
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
        [frArray(frDist), frLambda],
        ([dists, lambda], context) => {
          const sampleSetDists = dists.map((d) => {
            sampleSetAssert(d);
            return d;
          });
          return repackDistResult(
            SampleSetDist.mapN({
              fn: (a) =>
                Ok(
                  doNumberLambdaCall(lambda, [vArray(a.map(vNumber))], context)
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
      makeDefinition([frDist, frDist], ([dist1, dist2]) => {
        sampleSetAssert(dist1);
        sampleSetAssert(dist2);
        return repackDistResult(withDist(dist1, dist2));
      }),
      makeDefinition([frDist, frNumber], ([dist, f]) => {
        sampleSetAssert(dist);
        return repackDistResult(withFloat(dist, f));
      }),
      makeDefinition([frNumber, frDist], ([f, dist]) => {
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
