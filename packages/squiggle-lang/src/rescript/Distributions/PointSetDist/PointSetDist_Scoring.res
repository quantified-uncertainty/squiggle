module LogScoring = {
  let logFn = Js.Math.log2
  let subtraction = (a, b) => Ok(a -. b)
  let logScore = (a: float, b: float): result<float, Operation.Error.t> => Ok(
    Js.Math.log2(Js.Math.abs_float(a /. b)),
  )
}
