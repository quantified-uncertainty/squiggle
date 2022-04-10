/*
This is used as a smart constructor. The only way to create a SampleSetDist.t is to call
this constructor.
https://stackoverflow.com/questions/66909578/how-to-make-a-type-constructor-private-in-rescript-except-in-current-module
*/
module T: {
  @genType
  type t
  let make: array<float> => result<t, string>
  let get: t => array<float>
} = {
  type t = array<float>
  let make = (a: array<float>) =>
    if E.A.length(a) > 5 {
      Ok(a)
    } else {
      Error("too small")
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
  string,
> =>
  SampleSetDist_ToPointSet.toPointSetDist(
    ~samples=get(samples),
    ~samplingInputs,
    (),
  ).pointSetDist->E.O2.toResult("Failed to convert to PointSetDist")

//Randomly get one sample from the distribution
let sample = (t: t): float => {
  let i = E.Int.random(~min=0, ~max=E.A.length(get(t)) - 1)
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
    Belt.Array.makeBy(n, _ => sample(t))
  }
}

//TODO: Figure out what to do if distributions are different lengths. ``zip`` is kind of inelegant for this.
let map2 = (~fn: (float, float) => float, ~t1: t, ~t2: t) => {
  let samples = Belt.Array.zip(get(t1), get(t2))->E.A2.fmap(((a, b)) => fn(a, b))
  make(samples)
}
