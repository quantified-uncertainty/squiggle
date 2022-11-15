module JS = {
  @genType
  type distJs = {
    continuousDist: option<PointSetTypes.xyShape>,
    discreteDist: PointSetTypes.xyShape,
  }

  @module("./SampleSetDist_ToPointSet")
  external toPointSetDist: (array<float>, int, option<float>) => distJs = "toPointSetDist"
}

@genType
module Error = {
  @genType
  type sampleSetError =
    TooFewSamples | NonNumericInput(string) | OperationError(Operation.operationError)

  @genType
  type pointsetConversionError = TooFewSamplesForConversionToPointSet

  let pointsetConversionErrorToString = (err: pointsetConversionError) =>
    switch err {
    | TooFewSamplesForConversionToPointSet => "Too Few Samples to convert to point set"
    }

  let fromOperationError = e => OperationError(e)

  let toString = (err: sampleSetError) => {
    switch err {
    | TooFewSamples => "Too few samples when constructing sample set"
    | NonNumericInput(err) => `Found a non-number in input: ${err}`
    | OperationError(err) => Operation.Error.toString(err)
    }
  }
}

include Error

/*
This is used as a smart constructor. The only way to create a SampleSetDist.t is to call
this constructor.
https://stackoverflow.com/questions/66909578/how-to-make-a-type-constructor-private-in-rescript-except-in-current-module
*/
module T: {
  //This really should be hidden (remove the array<float>). The reason it isn't is to act as an escape hatch in JS__Test.ts.
  //When we get a good functional library in TS, we could refactor that out.
  @genType
  type t = array<float>
  let make: array<float> => result<t, sampleSetError>
  let get: t => array<float>
} = {
  type t = array<float>
  let make = (a: array<float>) =>
    if E.A.length(a) > 5 {
      Ok(a)
    } else {
      Error(TooFewSamples)
    }
  let get = (a: t) => a
}

include T

let length = (t: t) => get(t)->E.A.length

/*
TODO: Refactor to get a more precise estimate. Also, this code is just fairly messy, could use 
some refactoring.
*/
let toPointSetDist = (~samples: t, ~samplingInputs: SamplingInputs.samplingInputs): result<
  PointSetTypes.pointSetDist,
  pointsetConversionError,
> => {
  let dists = JS.toPointSetDist(
    get(samples),
    samplingInputs.outputXYPoints,
    samplingInputs.kernelWidth,
  )

  MixedShapeBuilder.buildSimple(
    ~continuous=dists.continuousDist->E.O.fmap(Continuous.make),
    ~discrete=Some(dists.discreteDist->Discrete.make),
  )->E.O.toResult(TooFewSamplesForConversionToPointSet)
}

//Randomly get one sample from the distribution
let sample = (t: t): float => {
  let i = Js.Math.random_int(0, E.A.length(get(t)) - 1)
  E.A.unsafe_get(get(t), i)
}

/*
If asked for a length of samples shorter or equal the length of the distribution,
return this first n samples of this distribution.
Else, return n random samples of the distribution.
The former helps in cases where multiple distributions are correlated.
However, if n > length(t), then there's no clear right answer, so we just randomly
sample everything.
*/
let sampleN = (t: t, n) => {
  if n <= E.A.length(get(t)) {
    E.A.slice(get(t), ~offset=0, ~len=n)
  } else {
    E.A.makeBy(n, _ => sample(t))
  }
}

let _fromSampleResultArray = (samples: array<result<float, QuriSquiggleLang.Operation.Error.t>>) =>
  E.A.R.firstErrorOrOpen(samples)->E.R.errMap(Error.fromOperationError)->E.R.bind(make)

let samplesMap = (~fn: float => result<float, Operation.Error.t>, t: t): result<
  t,
  sampleSetError,
> => T.get(t)->E.A.fmap(fn)->_fromSampleResultArray

//TODO: Figure out what to do if distributions are different lengths. ``zip`` is kind of inelegant for this.
let map2 = (~fn: (float, float) => result<float, Operation.Error.t>, ~t1: t, ~t2: t): result<
  t,
  sampleSetError,
> => E.A.zip(get(t1), get(t2))->E.A.fmap(E.Tuple2.toFnCall(fn))->_fromSampleResultArray

let map3 = (
  ~fn: (float, float, float) => result<float, Operation.Error.t>,
  ~t1: t,
  ~t2: t,
  ~t3: t,
): result<t, sampleSetError> =>
  E.A.zip3(get(t1), get(t2), get(t3))->E.A.fmap(E.Tuple3.toFnCall(fn))->_fromSampleResultArray

let mapN = (~fn: array<float> => result<float, Operation.Error.t>, ~t1: array<t>): result<
  t,
  sampleSetError,
> => E.A.transpose(E.A.fmap(t1, get))->E.A.fmap(fn)->_fromSampleResultArray

let mean = t => T.get(t)->E.A.Floats.mean
let geomean = t => T.get(t)->E.A.Floats.geomean
let mode = t => T.get(t)->E.A.Floats.mode
let sum = t => T.get(t)->E.A.Floats.sum
let min = t => T.get(t)->E.A.Floats.min
let max = t => T.get(t)->E.A.Floats.max
let stdev = t => T.get(t)->E.A.Floats.stdev
let variance = t => T.get(t)->E.A.Floats.variance
let percentile = (t, f) => T.get(t)->E.A.Floats.percentile(f)
let cdf = (t: t, f: float) => {
  let countBelowF = t->E.A.reduce(0, (acc, x) => acc + (x <= f ? 1 : 0))
  countBelowF->Js.Int.toFloat /. t->length->Js.Int.toFloat
}

let mixture = (values: array<(t, float)>, intendedLength: int) => {
  let totalWeight = values->E.A.fmap(E.Tuple2.second)->E.A.Floats.sum
  let discreteSamples =
    values
    ->E.A.fmapi((i, (_, weight)) => (E.I.toFloat(i), weight /. totalWeight))
    ->XYShape.T.fromZippedArray
    ->Discrete.make
    ->Discrete.sampleN(intendedLength)
  let dists = values->E.A.fmap(E.Tuple2.first)->E.A.fmap(T.get)
  let samples =
    discreteSamples
    ->E.A.fmapi((index, distIndexToChoose) => {
      let chosenDist = E.A.get(dists, E.Float.toInt(distIndexToChoose))
      chosenDist->E.O.bind(E.A.get(_, index))
    })
    ->E.A.O.openIfAllSome
  samples->E.O.toExn("Mixture unreachable error")->T.make
}

let truncateLeft = (t, f) => T.get(t)->E.A.filter(x => x >= f)->T.make
let truncateRight = (t, f) => T.get(t)->E.A.filter(x => x <= f)->T.make

let truncate = (t, ~leftCutoff: option<float>, ~rightCutoff: option<float>) => {
  let withTruncatedLeft = t => leftCutoff->E.O.dimap(left => truncateLeft(t, left), _ => Ok(t))
  let withTruncatedRight = t => rightCutoff->E.O.dimap(left => truncateRight(t, left), _ => Ok(t))
  t->withTruncatedLeft->E.R.bind(withTruncatedRight)
}

let minOfTwo = (t1: t, t2: t) => map2(~fn=(a, b) => Ok(Js.Math.min_float(a, b)), ~t1, ~t2)
let maxOfTwo = (t1: t, t2: t) => map2(~fn=(a, b) => Ok(Js.Math.max_float(a, b)), ~t1, ~t2)

let minOfFloat = (t: t, f: float) => samplesMap(~fn=a => Ok(Js.Math.min_float(a, f)), t)
let maxOfFloat = (t: t, f: float) => samplesMap(~fn=a => Ok(Js.Math.max_float(a, f)), t)
