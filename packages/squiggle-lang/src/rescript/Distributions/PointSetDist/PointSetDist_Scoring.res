module KLDivergence = {
  let logFn = Js.Math.log
  let subtraction = (a, b) => Ok(a -. b)
  let multiply = (a: float, b: float): result<float, Operation.Error.t> => Ok(a *. b)
  let logScoreDirect = (a: float, b: float): result<float, Operation.Error.t> =>
    if a == 0.0 {
      Error(Operation.NegativeInfinityError)
    } else if b == 0.0 {
      Error(Operation.DivisionByZeroError)
    } else {
      let quot = a /. b
      quot < 0.0 ? Error(Operation.ComplexNumberError) : Ok(b *. logFn(quot))
    }
  let logScoreWithThreshold = (~eps: float, a: float, b: float): result<float, Operation.Error.t> =>
    if abs_float(a) < eps {
      Ok(0.0)
    } else {
      logScoreDirect(a, b)
    }
  let logScore = (~eps: option<float>=?, a: float, b: float): result<float, Operation.Error.t> =>
    switch eps {
    | None => logScoreDirect(a, b)
    | Some(eps') => logScoreWithThreshold(~eps=eps', a, b)
    }
}
