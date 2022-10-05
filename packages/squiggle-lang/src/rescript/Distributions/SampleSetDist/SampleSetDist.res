@genType
module Error = {
  @genType
  type sampleSetError =
    | TooFewSamples
    | NonNumericInput(string)
    | OperationError(Operation.operationError)
    | UnequalSizes

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
    | UnequalSizes => "Expected sample sets of equal size"
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
  @genType.opaque
  type t
  let makeFromTypedArray: E.FloatArray.t => result<t, sampleSetError>
  let makeFromJsArray: array<float> => result<t, sampleSetError>
  let toJsArray: t => array<float>
  let get: t => E.FloatArray.t
} = {
  type t = E.FloatArray.t
  let makeFromTypedArray = (a: E.FloatArray.t): result<t, sampleSetError> =>
    if E.FloatArray.length(a) > 5 {
      Ok(a)
    } else {
      Error(TooFewSamples)
    }
  let makeFromJsArray = (a: array<float>): result<t, sampleSetError> =>
    E.FloatArray.make(a)->makeFromTypedArray
  let toJsArray = (t: t) => t->E.FloatArray.toArray
  let get = (t: t) => t
}

include T

let length = (t: T.t) => T.get(t)->E.FloatArray.length

/*
TODO: Refactor to get a more precise estimate. Also, this code is just fairly messy, could use 
some refactoring.
*/
let toPointSetDist = (~samples: t, ~samplingInputs: SamplingInputs.samplingInputs): result<
  PointSetTypes.pointSetDist,
  pointsetConversionError,
> =>
  SampleSetDist_ToPointSet.toPointSetDist(
    ~samples=T.get(samples),
    ~samplingInputs,
    (),
  ).pointSetDist->E.O2.toResult(TooFewSamplesForConversionToPointSet)

//Randomly get one sample from the distribution
let sample = (t: t): float => {
  let i = E.Int.random(~min=0, ~max=E.FloatArray.length(get(t)) - 1)
  E.FloatArray.unsafe_get(get(t), i)
}

/*
If asked for a length of samples shorter or equal the length of the distribution,
return this first n samples of this distribution.
Else, return n random samples of the distribution.
The former helps in cases where multiple distributions are correlated.
However, if n > length(t), then there's no clear right answer, so we just randomly
sample everything.
*/
let sampleN = (t: t, n): array<float> => {
  if n <= length(t) {
    E.FloatArray.slice(~start=0, ~end_=n, get(t))->E.FloatArray.toArray
  } else {
    Belt.Array.makeBy(n, _ => sample(t))
  }
}

let samplesMap = (~fn: float => result<float, Operation.Error.t>, t: t): result<
  t,
  sampleSetError,
> => {
  try {
    T.get(t)
    ->E.FloatArray.map((. v) => {
      switch fn(v) {
      | Ok(res) => res
      | Error(err) => err->Operation.Error.OperationException->raise
      }
    })
    ->T.makeFromTypedArray
  } catch {
  | Operation.Error.OperationException(err) => Error.fromOperationError(err)->Error
  }
}

let map2 = (~fn: (float, float) => result<float, Operation.Error.t>, ~t1: t, ~t2: t): result<
  t,
  sampleSetError,
> => {
  let length1 = t1->length
  let length2 = t2->length
  if length1 == length2 {
    try {
      let res = E.FloatArray.fromLength(length1)
      for i in 0 to length1 - 1 {
        let v = switch fn(
          get(t1)->E.FloatArray.unsafe_get(i),
          get(t2)->E.FloatArray.unsafe_get(i),
        ) {
        | Ok(fnResult) => fnResult
        | Error(err) => err->Operation.Error.OperationException->raise
        }
        res->E.FloatArray.set(i, v)
      }
      res->T.makeFromTypedArray
    } catch {
    | Operation.Error.OperationException(err) => Error.fromOperationError(err)->Error
    }
  } else {
    Error.UnequalSizes->Error
  }
}

let map3 = (
  ~fn: (float, float, float) => result<float, Operation.Error.t>,
  ~t1: t,
  ~t2: t,
  ~t3: t,
): result<t, sampleSetError> => {
  let length1 = t1->length
  let length2 = t2->length
  let length3 = t3->length
  if length1 == length2 && length2 == length3 {
    try {
      let res = E.FloatArray.fromLength(length1)
      for i in 0 to length1 - 1 {
        let v = switch fn(
          get(t1)->E.FloatArray.unsafe_get(i),
          get(t2)->E.FloatArray.unsafe_get(i),
          get(t3)->E.FloatArray.unsafe_get(i),
        ) {
        | Ok(fnResult) => fnResult
        | Error(err) => err->Operation.Error.OperationException->raise
        }
        res->E.FloatArray.set(i, v)
      }
      res->T.makeFromTypedArray
    } catch {
    | Operation.Error.OperationException(err) => Error.fromOperationError(err)->Error
    }
  } else {
    Error.UnequalSizes->Error
  }
}

let mapN = (~fn: array<float> => result<float, Operation.Error.t>, ~t1: array<t>): result<
  t,
  sampleSetError,
> => {
  let lengths = t1->E.A2.fmap(t => t->length)
  let l0 = lengths[0]
  if lengths->E.A.all(l => l == l0, _) {
    try {
      let res = E.FloatArray.fromLength(l0)
      for i in 0 to l0 - 1 {
        let v = switch fn(t1->E.A2.fmap(t => get(t)->E.FloatArray.unsafe_get(i))) {
        | Ok(fnResult) => fnResult
        | Error(err) => err->Operation.Error.OperationException->raise
        }
        res->E.FloatArray.set(i, v)
      }
      res->T.makeFromTypedArray
    } catch {
    | Operation.Error.OperationException(err) => Error.fromOperationError(err)->Error
    }
  } else {
    Error.UnequalSizes->Error
  }
}

let makeBy = (n: int, fn: int => result<float, Operation.Error.t>): result<t, sampleSetError> => {
  let res = E.FloatArray.fromLength(n)
  try {
    for i in 0 to n - 1 {
      let fnResult = fn(i)
      switch fnResult {
      | Ok(v) => res->E.FloatArray.set(i, v)
      | Error(err) => err->Operation.Error.OperationException->raise
      }
    }
    res->T.makeFromTypedArray
  } catch {
  | Operation.Error.OperationException(err) => Error.fromOperationError(err)->Error
  }
}

let mean = t => T.get(t)->E.FloatArray.mean
let geomean = t => T.get(t)->E.FloatArray.geomean
let mode = t => T.get(t)->E.FloatArray.mode
let sum = t => T.get(t)->E.FloatArray.sum
let min = t => T.get(t)->E.FloatArray.min
let max = t => T.get(t)->E.FloatArray.max
let stdev = t => T.get(t)->E.FloatArray.stdev
let variance = t => T.get(t)->E.FloatArray.variance
let percentile = (t, f) => T.get(t)->E.FloatArray.percentile(f)
let cdf = (t: t, f: float) => {
  let countBelowF = T.get(t)->E.FloatArray.reduce((. acc, x) => acc + (x <= f ? 1 : 0), 0)
  countBelowF->Js.Int.toFloat /. t->length->Js.Int.toFloat
}

let mixture = (values: array<(t, float)>, intendedLength: int) => {
  let totalWeight = values->E.A2.fmap(E.Tuple2.second)->E.A.Floats.sum
  let discreteSamples =
    values
    ->Belt.Array.mapWithIndex((i, (_, weight)) => (E.I.toFloat(i), weight /. totalWeight))
    ->XYShape.T.fromZippedArray
    ->Discrete.make
    ->Discrete.sampleN(intendedLength)
  let dists = values->E.A2.fmap(E.Tuple2.first)->E.A2.fmap(T.get)
  let samples =
    discreteSamples
    ->Belt.Array.mapWithIndex((index, distIndexToChoose) => {
      let chosenDist = E.A.get(dists, E.Float.toInt(distIndexToChoose))
      chosenDist->E.O.bind(E.FloatArray.get(_, index))
    })
    ->E.A.O.openIfAllSome
  samples->E.O2.toExn("Mixture unreachable error")->T.makeFromJsArray
}

let truncateLeft = (t, f) => T.get(t)->E.FloatArray.filter((. x) => x >= f)->T.makeFromTypedArray
let truncateRight = (t, f) => T.get(t)->E.FloatArray.filter((. x) => x <= f)->T.makeFromTypedArray

let truncate = (t, ~leftCutoff: option<float>, ~rightCutoff: option<float>) => {
  let withTruncatedLeft = t => leftCutoff |> E.O.dimap(left => truncateLeft(t, left), _ => Ok(t))
  let withTruncatedRight = t => rightCutoff |> E.O.dimap(left => truncateRight(t, left), _ => Ok(t))
  t->withTruncatedLeft |> E.R2.bind(withTruncatedRight)
}

let minOfTwo = (t1: t, t2: t) => map2(~fn=(a, b) => Ok(Js.Math.min_float(a, b)), ~t1, ~t2)
let maxOfTwo = (t1: t, t2: t) => map2(~fn=(a, b) => Ok(Js.Math.max_float(a, b)), ~t1, ~t2)

let minOfFloat = (t: t, f: float) => samplesMap(~fn=a => Ok(Js.Math.min_float(a, f)), t)
let maxOfFloat = (t: t, f: float) => samplesMap(~fn=a => Ok(Js.Math.max_float(a, f)), t)
