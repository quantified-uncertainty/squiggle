module T: {
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

// TODO: Refactor to raise correct error when not enough samples

let toPointSetDist = (~samples: t, ~samplingInputs: SamplingInputs.samplingInputs, ()) =>
  SampleSetDist_ToPointSet.toPointSetDist(~samples=get(samples), ~samplingInputs, ())

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

let runMonteCarlo = (fn: (float, float) => float, t1: t, t2: t) => {
  let samples = Belt.Array.zip(get(t1), get(t2))->E.A2.fmap(((a, b)) => fn(a, b))
  make(samples)
}
