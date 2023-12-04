import * as SampleSetDist from "../dist/SampleSetDist/index.js";
import {
  FnDefinition,
  makeDefinition,
} from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDist,
  frLambdaTyped,
  frNumber,
  frSampleSetDist,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  doNumberLambdaCall,
  repackDistResult,
} from "../library/registry/helpers.js";
import { Ok } from "../utility/result.js";
import { vArray, vNumber, Value } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "SampleSet",
  requiresNamespace: true,
});

const fromDist = makeDefinition(
  [frDist],
  frSampleSetDist,
  ([dist], { environment }) =>
    repackDistResult(SampleSetDist.SampleSetDist.fromDist(dist, environment))
);

const fromNumber = makeDefinition(
  [frNumber],
  frSampleSetDist,
  ([number], context) =>
    repackDistResult(
      SampleSetDist.SampleSetDist.make(
        new Array(context.environment.sampleCount).fill(number)
      )
    )
);

const fromList = makeDefinition(
  [frArray(frNumber)],
  frSampleSetDist,
  ([numbers]) => repackDistResult(SampleSetDist.SampleSetDist.make(numbers))
);

const fromFn = (lambda: any, context: any, fn: (i: number) => Value[]) =>
  repackDistResult(
    SampleSetDist.SampleSetDist.fromFn((index) => {
      return doNumberLambdaCall(lambda, fn(index), context);
    }, context.environment)
  );

const fromFnDefinitions: FnDefinition[] = [
  makeDefinition(
    [frLambdaTyped([], frNumber)],
    frSampleSetDist,
    ([lambda], context) => {
      return fromFn(lambda, context, () => []);
    }
  ),
  makeDefinition(
    [frLambdaTyped([frNumber], frNumber)],
    frSampleSetDist,
    ([lambda], context) => {
      return fromFn(lambda, context, (index) => [vNumber(index)]);
    }
  ),
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
      makeDefinition([frSampleSetDist], frArray(frNumber), ([dist]) => {
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
      makeDefinition(
        [frSampleSetDist, frLambdaTyped([frNumber], frNumber)],
        frSampleSetDist,
        ([dist, lambda], context) => {
          return repackDistResult(
            dist.samplesMap((r) =>
              Ok(doNumberLambdaCall(lambda, [vNumber(r)], context))
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
        [
          frSampleSetDist,
          frSampleSetDist,
          frLambdaTyped([frNumber, frNumber], frNumber),
        ],
        frSampleSetDist,
        ([dist1, dist2, lambda], context) => {
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
        [
          frSampleSetDist,
          frSampleSetDist,
          frSampleSetDist,
          frLambdaTyped([frNumber, frNumber, frNumber], frNumber),
        ],
        frSampleSetDist,
        ([dist1, dist2, dist3, lambda], context) => {
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
        [
          frArray(frSampleSetDist),
          frLambdaTyped([frArray(frNumber)], frNumber),
        ],
        frSampleSetDist,
        ([dists, lambda], context) => {
          const sampleSetDists = dists.map((d) => {
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
      makeDefinition(
        [frSampleSetDist, frSampleSetDist],
        frSampleSetDist,
        ([dist1, dist2]) => {
          return repackDistResult(withDist(dist1, dist2));
        }
      ),
      makeDefinition(
        [frSampleSetDist, frNumber],
        frSampleSetDist,
        ([dist, f]) => {
          return repackDistResult(withFloat(dist, f));
        }
      ),
      makeDefinition(
        [frNumber, frSampleSetDist],
        frSampleSetDist,
        ([f, dist]) => {
          return repackDistResult(withFloat(dist, f));
        }
      ),
    ],
  });

const comparisonLibrary = [
  mkComparison("min", SampleSetDist.minOfTwo, SampleSetDist.minOfFloat),
  mkComparison("max", SampleSetDist.maxOfTwo, SampleSetDist.maxOfFloat),
];

export const library = [...baseLibrary, ...comparisonLibrary];
