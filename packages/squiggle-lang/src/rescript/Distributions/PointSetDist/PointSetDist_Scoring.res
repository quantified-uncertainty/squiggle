module LogScoring = {
  let logFn = Js.Math.log
  let subtraction = (a, b) => Ok(a -. b)
  let logScore = (a: float, b: float): result<float, Operation.Error.t> => Ok(
    logFn(Js.Math.abs_float(a /. b)),
  )
  let multiply = (a: float, b: float): result<float, Operation.Error.t> => Ok(a *. b)
}
