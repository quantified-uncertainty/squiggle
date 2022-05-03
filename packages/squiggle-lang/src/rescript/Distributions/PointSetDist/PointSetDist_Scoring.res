module LogScoring = {
  let logFn = Js.Math.log
  let subtraction = (a, b) => Ok(a -. b)
  let logScore = (a: float, b: float): result<float, Operation.Error.t> =>
    if a == 0.0 {
      Error(Operation.NegativeInfinityError)
    } else if b == 0.0 {
      Error(Operation.DivisionByZeroError)
    } else {
      let quot = a /. b
      quot < 0.0 ? Error(Operation.ComplexNumberError) : Ok(logFn(quot))
    }
  let multiply = (a: float, b: float): result<float, Operation.Error.t> => Ok(a *. b)
}
