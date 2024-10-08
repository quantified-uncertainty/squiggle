import * as SampleSetDist from "../dists/SampleSetDist/index.js";
import { frInput, namedInput } from "../library/FrInput.js";
import {
  frArray,
  frDist,
  frNumber,
  frSampleSetDist,
  frTypedLambda,
} from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  chooseLambdaParamLength,
  doNumberLambdaCall,
  FnFactory,
  unwrapDistResult,
} from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { FnInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import { Reducer } from "../reducer/Reducer.js";
import { tArray } from "../types/TArray.js";
import { tNumber } from "../types/TIntrinsic.js";
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
  ([number], reducer) =>
    unwrapDistResult(
      SampleSetDist.SampleSetDist.make(
        new Array(reducer.environment.sampleCount).fill(number)
      )
    )
);

const fromList = makeDefinition(
  [frArray(frNumber)],
  frSampleSetDist,
  ([numbers]) => unwrapDistResult(SampleSetDist.SampleSetDist.make(numbers))
);

const fromFn = (lambda: Lambda, reducer: Reducer, fn: (i: number) => Value[]) =>
  unwrapDistResult(
    SampleSetDist.SampleSetDist.fromFn((index) => {
      return doNumberLambdaCall(lambda, fn(index), reducer);
    }, reducer.environment)
  );

const fromFnDefinition = makeDefinition(
  [
    frTypedLambda(
      [new FnInput({ name: "index", type: tNumber, optional: true })],
      tNumber
    ),
  ],
  frSampleSetDist,
  ([lambda], reducer) => {
    const usedOptional = chooseLambdaParamLength([0, 1], lambda) === 1;
    return fromFn(
      lambda,
      reducer,
      usedOptional ? (index) => [vNumber(index)] : () => []
    );
  }
);

const baseLibrary = [
  maker.make({
    name: "make",
    description:
      "Calls the correct conversion constructor, based on the corresponding input type, to create a sample set distribution",
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
    definitions: [
      makeDefinition(
        [frSampleSetDist, namedInput("fn", frTypedLambda([tNumber], tNumber))],
        frSampleSetDist,
        ([dist, lambda], reducer) => {
          return unwrapDistResult(
            dist.samplesMap((r) =>
              Ok(doNumberLambdaCall(lambda, [vNumber(r)], reducer))
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
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frSampleSetDist,
          frSampleSetDist,
          frInput({
            name: "fn",
            type: frTypedLambda([tNumber, tNumber], tNumber),
          }),
        ],
        frSampleSetDist,
        ([dist1, dist2, lambda], reducer) => {
          return unwrapDistResult(
            SampleSetDist.map2({
              fn: (a, b) =>
                Ok(
                  doNumberLambdaCall(lambda, [vNumber(a), vNumber(b)], reducer)
                ),
              dist1,
              dist2,
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
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frSampleSetDist,
          frSampleSetDist,
          frSampleSetDist,
          namedInput("fn", frTypedLambda([tNumber, tNumber, tNumber], tNumber)),
        ],
        frSampleSetDist,
        ([dist1, dist2, dist3, lambda], reducer) => {
          return unwrapDistResult(
            SampleSetDist.map3({
              fn: (a, b, c) =>
                Ok(
                  doNumberLambdaCall(
                    lambda,
                    [vNumber(a), vNumber(b), vNumber(c)],
                    reducer
                  )
                ),
              dist1,
              dist2,
              dist3,
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
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frArray(frSampleSetDist),
          namedInput("fn", frTypedLambda([tArray(tNumber)], tNumber)),
        ],
        frSampleSetDist,
        ([dists, lambda], reducer) => {
          return unwrapDistResult(
            SampleSetDist.mapN({
              fn: (a) =>
                Ok(
                  doNumberLambdaCall(lambda, [vArray(a.map(vNumber))], reducer)
                ),
              dists,
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
    definitions: [
      makeDefinition(
        [frSampleSetDist, frNumber],
        frSampleSetDist,
        ([dist, f]) => unwrapDistResult(withFloat(dist, f))
      ),
      makeDefinition(
        [frNumber, frSampleSetDist],
        frSampleSetDist,
        ([f, dist]) => unwrapDistResult(withFloat(dist, f))
      ),
      makeDefinition(
        [frSampleSetDist, frSampleSetDist],
        frSampleSetDist,
        ([dist1, dist2]) => unwrapDistResult(withDist(dist1, dist2))
      ),
    ],
  });

const comparisonLibrary = [
  mkComparison("min", SampleSetDist.minOfTwo, SampleSetDist.minOfFloat),
  mkComparison("max", SampleSetDist.maxOfTwo, SampleSetDist.maxOfFloat),
];

export const library = [...baseLibrary, ...comparisonLibrary];
