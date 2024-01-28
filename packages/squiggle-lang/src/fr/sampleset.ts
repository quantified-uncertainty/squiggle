import * as SampleSetDist from "../dist/SampleSetDist/index.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  FnDefinition,
  makeDefinition,
} from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDist,
  frLambdaTyped,
  frNamed,
  frNumber,
  frOptional,
  frOr,
  frSampleSetDist,
} from "../library/registry/frTypes.js";
import {
  chooseLambdaParamLength,
  doNumberLambdaCall,
  FnFactory,
  unwrapDistResult,
} from "../library/registry/helpers.js";
import { Ok } from "../utility/result.js";
import { Value } from "../value/index.js";
import { vArray } from "../value/VArray.js";
import { vNumber } from "../value/VNumber.js";

const maker = new FnFactory({
  nameSpace: "SampleSet",
  requiresNamespace: true,
});

const fromDist = makeDefinition(
  [frDist],
  frSampleSetDist,
  ([dist], { environment, rng }) =>
    unwrapDistResult(
      SampleSetDist.SampleSetDist.fromDist(dist, environment, rng)
    )
);

const fromNumber = makeDefinition(
  [frNumber],
  frSampleSetDist,
  ([number], context) =>
    unwrapDistResult(
      SampleSetDist.SampleSetDist.make(
        new Array(context.environment.sampleCount).fill(number)
      )
    )
);

const fromList = makeDefinition(
  [frArray(frNumber)],
  frSampleSetDist,
  ([numbers]) => unwrapDistResult(SampleSetDist.SampleSetDist.make(numbers))
);

const fromFn = (lambda: any, context: any, fn: (i: number) => Value[]) =>
  unwrapDistResult(
    SampleSetDist.SampleSetDist.fromFn((index) => {
      return doNumberLambdaCall(lambda, fn(index), context);
    }, context.environment)
  );

const fromFnDefinition: FnDefinition = makeDefinition(
  [frLambdaTyped([frNamed("index", frOptional(frNumber))], frNumber)],
  frSampleSetDist,
  ([lambda], context) => {
    const usedOptional = chooseLambdaParamLength([0, 1], lambda) === 1;
    return fromFn(
      lambda,
      context,
      usedOptional ? (index) => [vNumber(index)] : () => []
    );
  }
);

const baseLibrary = [
  maker.make({
    name: "make",
    description:
      "Calls the correct conversion constructor, based on the corresponding input type, to create a sample set distribution",
    output: "Dist",
    examples: [
      makeFnExample(`SampleSet(5)`),
      makeFnExample(`SampleSet.make([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])`),
      makeFnExample(`SampleSet.make({|i| sample(normal(5,2))})`),
    ],
    displaySection: "Constructors",
    definitions: [fromDist, fromNumber, fromList, fromFnDefinition],
  }),
  maker.make({
    name: "fromDist",
    description:
      "Converts any distribution type into a sample set distribution.",
    examples: [makeFnExample(`SampleSet.fromDist(Sym.normal(5,2))`)],
    displaySection: "Conversions",
    definitions: [fromDist],
  }),
  maker.make({
    name: "fromNumber",
    displaySection: "Conversions",
    description:
      "Convert a number into a sample set distribution that contains ``n`` copies of that number. ``n`` refers to the model sample count.",
    examples: [makeFnExample(`SampleSet.fromNumber(3)`)],
    definitions: [fromNumber],
  }),
  maker.make({
    name: "fromList",
    displaySection: "Conversions",
    description: "Convert a list of numbers into a sample set distribution.",
    examples: [
      makeFnExample(
        `SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])`
      ),
    ],
    output: "Dist",
    definitions: [fromList],
  }),
  maker.make({
    name: "toList",
    displaySection: "Conversions",
    examples: [
      makeFnExample(`SampleSet.toList(SampleSet.fromDist(normal(5,2)))`),
    ],
    description:
      "Gets the internal samples of a sampleSet distribution. This is separate from the ``sampleN()`` function, which would shuffle the samples. ``toList()`` maintains order and length.",
    output: "Array",
    definitions: [
      makeDefinition([frSampleSetDist], frArray(frNumber), ([dist]) => {
        return dist.samples;
      }),
    ],
  }),
  maker.make({
    name: "fromFn",
    displaySection: "Conversions",
    description:
      "Convert a function into a sample set distribution by calling it ``n`` times.",
    examples: [makeFnExample(`SampleSet.fromFn({|i| sample(normal(5,2))})`)],
    output: "Dist",
    definitions: [fromFnDefinition],
  }),
  maker.make({
    name: "map",
    displaySection: "Transformations",
    examples: [
      makeFnExample(
        `SampleSet.map(SampleSet.fromDist(normal(5,2)), {|x| x + 1})`
      ),
    ],
    description: `Transforms a sample set distribution by applying a function to each sample. Returns a new sample set distribution.`,
    output: "Dist",
    definitions: [
      makeDefinition(
        [frSampleSetDist, frNamed("fn", frLambdaTyped([frNumber], frNumber))],
        frSampleSetDist,
        ([dist, lambda], context) => {
          return unwrapDistResult(
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
    description: `Transforms two sample set distributions by applying a function to each pair of samples. Returns a new sample set distribution.`,
    examples: [
      makeFnExample(`SampleSet.map2(
  SampleSet.fromDist(normal(5,2)),
  SampleSet.fromDist(normal(5,2)),
  {|x, y| x + y}
)`),
    ],
    output: "Dist",
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frSampleSetDist,
          frSampleSetDist,
          frNamed("fn", frLambdaTyped([frNumber, frNumber], frNumber)),
        ],
        frSampleSetDist,
        ([dist1, dist2, lambda], context) => {
          return unwrapDistResult(
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
      makeFnExample(`SampleSet.map3(
  SampleSet.fromDist(normal(5,2)),
  SampleSet.fromDist(normal(5,2)),
  SampleSet.fromDist(normal(5,2)),
  {|x, y, z| max([x,y,z])}
)`),
    ],
    output: "Dist",
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frSampleSetDist,
          frSampleSetDist,
          frSampleSetDist,
          frNamed(
            "fn",
            frLambdaTyped([frNumber, frNumber, frNumber], frNumber)
          ),
        ],
        frSampleSetDist,
        ([dist1, dist2, dist3, lambda], context) => {
          return unwrapDistResult(
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
      makeFnExample(`SampleSet.mapN(
  [
    SampleSet.fromDist(normal(5,2)),
    SampleSet.fromDist(normal(5,2)),
    SampleSet.fromDist(normal(5,2))
  ],
  max
)`),
    ],
    output: "Dist",
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frArray(frSampleSetDist),
          frNamed("fn", frLambdaTyped([frArray(frNumber)], frNumber)),
        ],
        frSampleSetDist,
        ([dists, lambda], context) => {
          const sampleSetDists = dists.map((d) => {
            return d;
          });
          return unwrapDistResult(
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
      makeFnExample(
        `SampleSet.${name}(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(6,2)))`
      ),
      makeFnExample(`SampleSet.${name}(SampleSet.fromDist(normal(5,2)), 3.0)`),
      makeFnExample(`SampleSet.${name}(4.0, SampleSet.fromDist(normal(6,2)))`),
    ],
    output: "Dist",
    definitions: [
      makeDefinition(
        [frSampleSetDist, frOr(frNumber, frSampleSetDist)],
        frSampleSetDist,
        ([dist, f]) => {
          const distResult =
            f.tag === "1" ? withFloat(dist, f.value) : withDist(dist, f.value);
          return unwrapDistResult(distResult);
        }
      ),
      makeDefinition(
        [frNumber, frSampleSetDist],
        frSampleSetDist,
        ([f, dist]) => {
          return unwrapDistResult(withFloat(dist, f));
        }
      ),
    ],
  });

const comparisonLibrary = [
  mkComparison("min", SampleSetDist.minOfTwo, SampleSetDist.minOfFloat),
  mkComparison("max", SampleSetDist.maxOfTwo, SampleSetDist.maxOfFloat),
];

export const library = [...baseLibrary, ...comparisonLibrary];
