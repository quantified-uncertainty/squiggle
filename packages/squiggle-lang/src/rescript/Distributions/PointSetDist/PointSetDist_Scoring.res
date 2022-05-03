module LogScoring = {
  let logFn = Js.Math.log
  let subtraction = (a, b) => Ok(a -. b)
  let logScore = (a: float, b: float): result<float, Operation.Error.t> =>
    if a == 0.0 {
      Error(Operation.Error.NegativeInfinityError)
    } else if b == 0.0 {
      Error(Operation.Error.DivideByZeroError)
    } else {
      let quot = a /. b
      quot < 0.0 ? Error(OperationError.ComplexNumberError) : Ok(logFn(quot))
    }
  let multiply = (a: float, b: float): result<float, Operation.Error.t> => Ok(a *. b)
}
